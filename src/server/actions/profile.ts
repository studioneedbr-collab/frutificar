'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/action-types'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido.'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual.'),
  newPassword: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres.'),
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
    const emailChanged = current?.email !== parsed.data.email
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        // Trocou o e-mail → o novo endereço ainda não foi confirmado.
        ...(emailChanged ? { emailVerified: null } : {}),
      },
    })
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
