'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { newToken, tokenLookup } from '@/lib/tokens'
import { rateLimit, clientIp, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'
import {
  sendVerificationEmail,
  sendAdminNewUserNotification,
  sendPasswordResetEmail,
} from '@/lib/email'
import type { ActionResult } from '@/lib/action-types'

const RESET_PREFIX = 'reset:'
const RESET_TTL_MS = 60 * 60 * 1000 // 1 hora

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
    email: z.string().trim().toLowerCase().email('E-mail inválido.'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72, 'A senha deve ter no máximo 72 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória.'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export async function registerUser(input: unknown): Promise<ActionResult> {
  // Contra criação de contas em massa / spam de e-mails.
  if (!rateLimit(`register:${await clientIp()}`, 5, 60 * 60_000)) {
    return { ok: false, error: RATE_LIMIT_MESSAGE }
  }
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { name, email, password } = parsed.data

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    })
    if (existing) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' }
    }

    const plan = await prisma.plan.findUnique({ where: { name: 'ESSENCIAL' }, select: { id: true } })
    // Sem o plano no banco (seed não rodou) o cadastro não pode travar: cria a
    // conta sem assinatura — o checkout cria a assinatura com o plano escolhido.
    if (!plan) {
      console.error('[registerUser] plano ESSENCIAL não encontrado — conta criada sem assinatura.')
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const token = newToken()
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'STUDENT',
          emailVerified: null,
          ...(plan && {
            subscription: {
              create: {
                planId: plan.id,
                // Sem acesso até pagar: o aluno vai direto para o checkout.
                status: 'PENDING',
                currentPeriodEnd: new Date(),
              },
            },
          }),
        },
      }),
      prisma.verificationToken.create({
        data: { identifier: email, token: token.hash, expires: tokenExpires },
      }),
    ])

    // A conta já foi criada (transação commitada). Uma falha no envio do e-mail
    // não deve derrubar o cadastro nem fazer o usuário tentar de novo e cair em
    // "e-mail já cadastrado" — apenas logamos; o reenvio pode ser feito depois.
    try {
      await sendVerificationEmail(email, token.raw)
    } catch (mailErr) {
      console.error('[registerUser] falha ao enviar e-mail de verificação:', mailErr)
    }
    // Aviso ao admin da Frutificar — também não deve derrubar o cadastro.
    try {
      await sendAdminNewUserNotification({ name, email })
    } catch (notifyErr) {
      console.error('[registerUser] falha ao notificar o admin do novo cadastro:', notifyErr)
    }
    return { ok: true, data: undefined }
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'Este e-mail já está cadastrado.' }
    }
    console.error('[registerUser] erro ao criar conta:', err)
    return { ok: false, error: 'Erro ao criar conta. Tente novamente.' }
  }
}

const requestResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
})

/**
 * Solicita a redefinição de senha. Por segurança retorna sempre { ok: true },
 * mesmo se o e-mail não existir, para não revelar quais e-mails estão cadastrados.
 * O token de reset é guardado no VerificationToken com o identifier prefixado
 * por "reset:" para não colidir com os tokens de verificação de e-mail.
 */
export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'E-mail inválido.' }
  }

  const { email } = parsed.data
  // Resposta idêntica quando estoura o limite (não revela nada).
  if (!rateLimit(`reset:ip:${await clientIp()}`, 10, 60 * 60_000) || !rateLimit(`reset:email:${email}`, 3, 60 * 60_000)) {
    return { ok: true, data: undefined }
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, deletedAt: true },
    })

    // Só gera token/e-mail se a conta existir e estiver ativa; caso contrário,
    // seguimos silenciosamente (resposta idêntica) para não vazar informação.
    if (user && !user.deletedAt) {
      const token = newToken()
      const expires = new Date(Date.now() + RESET_TTL_MS)

      // Remove tokens de reset anteriores deste e-mail antes de criar um novo.
      await prisma.verificationToken.deleteMany({
        where: { identifier: `${RESET_PREFIX}${email}` },
      })
      await prisma.verificationToken.create({
        data: { identifier: `${RESET_PREFIX}${email}`, token: token.hash, expires },
      })

      try {
        await sendPasswordResetEmail(email, token.raw)
      } catch (mailErr) {
        console.error('[requestPasswordReset] falha ao enviar e-mail de reset:', mailErr)
      }
    }
  } catch (err) {
    console.error('[requestPasswordReset] erro inesperado:', err)
    // Ainda assim respondemos ok para não revelar detalhes internos.
  }

  return { ok: true, data: undefined }
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token ausente.'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(72, 'A senha deve ter no máximo 72 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória.'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

/** Efetiva a nova senha a partir de um token de reset válido. */
export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { token, password } = parsed.data
  if (!rateLimit(`reset-confirm:${await clientIp()}`, 20, 60 * 60_000)) {
    return { ok: false, error: RATE_LIMIT_MESSAGE }
  }

  try {
    const record = await prisma.verificationToken.findFirst({ where: { token: { in: tokenLookup(token) } } })
    if (
      !record ||
      !record.identifier.startsWith(RESET_PREFIX) ||
      record.expires <= new Date()
    ) {
      return { ok: false, error: 'Link inválido ou expirado. Solicite um novo.' }
    }

    const email = record.identifier.slice(RESET_PREFIX.length)
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null },
      select: { id: true },
    })
    if (!user) {
      return { ok: false, error: 'Link inválido ou expirado. Solicite um novo.' }
    }
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      // Consome o token (diferente da verificação de e-mail, aqui deletamos).
      prisma.verificationToken.delete({ where: { token: record.token } }),
    ])

    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[resetPassword] erro ao redefinir senha:', err)
    return { ok: false, error: 'Não foi possível redefinir a senha. Tente novamente.' }
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
