'use server'

import { z } from 'zod'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendVerificationEmail,
  sendAdminNewUserNotification,
  sendPasswordResetEmail,
} from '@/lib/email'
import { asaasConfigured, createCustomer, createSubscription } from '@/lib/asaas'
import { createPendingSubscription } from '@/server/repositories/billing.repository'
import type { ActionResult } from '@/lib/action-types'

const RESET_PREFIX = 'reset:'
const RESET_TTL_MS = 60 * 60 * 1000 // 1 hora
const PENDING_PERIOD_DAYS = 31

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido.'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória.'),
    cpfCnpj: z.string().min(11, 'Informe um CPF ou CNPJ válido.').max(18),
    phone: z.string().min(10, 'Informe um telefone com DDD.').max(15),
    plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export async function registerUser(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { name, email, password, cpfCnpj, phone, plan: planName } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' }
    }

    const plan = await prisma.plan.findUnique({ where: { name: planName } })
    if (!plan) {
      return { ok: false, error: 'Plano indisponível. Tente novamente em instantes.' }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Cria a conta sem acesso ativo: o acesso só é liberado quando o pagamento
    // é confirmado (webhook do Asaas ativa a assinatura).
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'STUDENT',
        emailVerified: null,
        cpfCnpj,
        phone,
      },
    })

    try {
      let gatewayCustomerId = ''
      let gatewaySubscriptionId = ''
      if (asaasConfigured()) {
        const customer = await createCustomer({ name, email, cpfCnpj, mobilePhone: phone })
        const nextDueDate = new Date().toISOString().slice(0, 10)
        const subscription = await createSubscription({
          customer: customer.id,
          billingType: 'UNDEFINED',
          value: Number(plan.priceMonthly),
          nextDueDate,
          description: `Assinatura ${planName}`,
        })
        gatewayCustomerId = customer.id
        gatewaySubscriptionId = subscription.id
      }

      await createPendingSubscription({
        userId: user.id,
        planId: plan.id,
        gatewayCustomerId,
        gatewaySubscriptionId,
        periodEnd: new Date(Date.now() + PENDING_PERIOD_DAYS * 24 * 60 * 60 * 1000),
      })
    } catch (billingErr) {
      // Não podemos deixar um usuário órfão (sem assinatura) e com o e-mail
      // "queimado" impedindo um novo cadastro — reverte a criação do usuário.
      console.error('[registerUser] falha no billing, revertendo usuário:', billingErr)
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      return { ok: false, error: 'Não foi possível iniciar sua assinatura. Tente novamente.' }
    }

    const token = randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: tokenExpires },
    })

    // A conta já foi criada. Uma falha no envio do e-mail não deve derrubar o
    // cadastro nem fazer o usuário tentar de novo e cair em "e-mail já
    // cadastrado" — apenas logamos; o reenvio pode ser feito depois.
    try {
      await sendVerificationEmail(email, token)
    } catch (mailErr) {
      console.error('[registerUser] falha ao enviar e-mail de verificação:', mailErr)
    }
    // Aviso ao admin da Frutificar — também não deve derrubar o cadastro.
    try {
      await sendAdminNewUserNotification({ name, email })
    } catch (notifyErr) {
      console.error('[registerUser] falha ao notificar o admin do novo cadastro:', notifyErr)
    }
    return { ok: true, data: { userId: user.id } }
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'Este e-mail já está cadastrado.' }
    }
    console.error('[registerUser] erro inesperado:', err)
    return { ok: false, error: 'Erro ao criar conta.' }
  }
}

const requestResetSchema = z.object({
  email: z.string().email('E-mail inválido.'),
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

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, deletedAt: true },
    })

    // Só gera token/e-mail se a conta existir e estiver ativa; caso contrário,
    // seguimos silenciosamente (resposta idêntica) para não vazar informação.
    if (user && !user.deletedAt) {
      const token = randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + RESET_TTL_MS)

      // Remove tokens de reset anteriores deste e-mail antes de criar um novo.
      await prisma.verificationToken.deleteMany({
        where: { identifier: `${RESET_PREFIX}${email}` },
      })
      await prisma.verificationToken.create({
        data: { identifier: `${RESET_PREFIX}${email}`, token, expires },
      })

      try {
        await sendPasswordResetEmail(email, token)
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
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
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

  try {
    const record = await prisma.verificationToken.findUnique({ where: { token } })
    if (
      !record ||
      !record.identifier.startsWith(RESET_PREFIX) ||
      record.expires <= new Date()
    ) {
      return { ok: false, error: 'Link inválido ou expirado. Solicite um novo.' }
    }

    const email = record.identifier.slice(RESET_PREFIX.length)
    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({ where: { email }, data: { passwordHash } }),
      // Consome o token (diferente da verificação de e-mail, aqui deletamos).
      prisma.verificationToken.delete({ where: { token } }),
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
