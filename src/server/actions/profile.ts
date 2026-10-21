'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { newToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/email'
import type { ActionResult } from '@/lib/action-types'

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres.').max(72, 'A nova senha deve ter no máximo 72 caracteres.'),
})

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    })
    const emailChanged = current?.email.toLowerCase() !== parsed.data.email
    await prisma.user.update({
      where: { id: session.user.id },
      // E-mail novo precisa ser confirmado de novo (ele é usado no reset de senha).
      data: { name: parsed.data.name, email: parsed.data.email, ...(emailChanged && { emailVerified: null }) },
    })
    if (emailChanged) {
      // Link de confirmação para o e-mail novo (não bloqueia se o envio falhar).
      try {
        const token = newToken()
        await prisma.verificationToken.create({
          data: { identifier: parsed.data.email, token: token.hash, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        })
        await sendVerificationEmail(parsed.data.email, token.raw)
      } catch (mailErr) {
        console.error('[updateProfile] falha ao enviar verificação do novo e-mail:', mailErr)
      }
    }
    revalidatePath('/perfil')
    return { ok: true, data: undefined }
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'Este e-mail já está em uso.' }
    }
    return { ok: false, error: 'Erro ao atualizar perfil.' }
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user || !user.passwordHash) {
      return { ok: false, error: 'Usuário não encontrado.' }
    }

    const passwordValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!passwordValid) {
      return { ok: false, error: 'Senha atual incorreta.' }
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    })

    revalidatePath('/perfil')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao alterar senha.' }
  }
}
