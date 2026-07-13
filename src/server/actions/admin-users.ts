'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { Prisma, Role } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import * as usersRepository from '@/server/repositories/users.repository'

// ─── Schemas ──────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['STUDENT', 'ADMIN', 'INSTRUCTOR']),
})

const updateUserSchema = createUserSchema.partial()

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

// ─── Criar usuário ────────────────────────────────────────

export async function createUserAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const passwordHash = await bcrypt.hash('frutificar123', 12)
    const user = await usersRepository.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as Role,
      passwordHash,
    })
    revalidatePath('/admin/usuarios')
    return { ok: true, data: { id: user.id } }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: 'Este e-mail já está em uso.' }
    }
    return { ok: false, error: 'Erro ao criar usuário.' }
  }
}

// ─── Atualizar usuário ────────────────────────────────────

export async function updateUserAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = updateUserSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await usersRepository.updateUser(id, {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as Role | undefined,
    })
    revalidatePath('/admin/usuarios')
    return { ok: true, data: undefined }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: 'Este e-mail já está em uso.' }
    }
    return { ok: false, error: 'Erro ao atualizar usuário.' }
  }
}

// ─── Suspender / reativar usuário ─────────────────────────

export async function toggleUserSuspended(
  id: string,
  suspended: boolean,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await usersRepository.setUserSuspended(id, suspended)
    revalidatePath('/admin/usuarios')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar status do usuário.' }
  }
}

// ─── Trocar plano do aluno ────────────────────────────────

const changeUserPlanSchema = z.object({
  plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']),
})

export async function changeUserPlanAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = changeUserPlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await usersRepository.setUserPlan(id, parsed.data.plan)
    revalidatePath('/admin/usuarios')
    revalidatePath('/admin/assinaturas')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao trocar o plano do aluno.' }
  }
}

// ─── Redefinir senha: definir senha temporária ────────────

// Gera uma senha temporária legível (sem caracteres ambíguos) de 10 dígitos.
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(10)
  let out = ''
  for (let i = 0; i < 10; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export async function setTemporaryPasswordAction(
  id: string,
): Promise<ActionResult<{ password: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    await usersRepository.setUserPassword(id, passwordHash)
    return { ok: true, data: { password: tempPassword } }
  } catch {
    return { ok: false, error: 'Erro ao gerar senha temporária.' }
  }
}

// ─── Redefinir senha: enviar link por e-mail ──────────────

const RESET_PREFIX = 'reset:'
const RESET_TTL_MS = 60 * 60 * 1000 // 1 hora

export async function sendPasswordResetAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    const user = await usersRepository.getUserById(id)
    if (!user || user.deletedAt) {
      return { ok: false, error: 'Usuário não encontrado.' }
    }

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + RESET_TTL_MS)

    await prisma.verificationToken.deleteMany({
      where: { identifier: `${RESET_PREFIX}${user.email}` },
    })
    await prisma.verificationToken.create({
      data: { identifier: `${RESET_PREFIX}${user.email}`, token, expires },
    })

    await sendPasswordResetEmail(user.email, token)
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[sendPasswordResetAction] falha ao enviar reset:', err)
    return { ok: false, error: 'Não foi possível enviar o e-mail. Verifique a configuração de e-mail (Brevo).' }
  }
}

// ─── Excluir usuário (soft delete) ────────────────────────

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await usersRepository.softDeleteUser(id)
    revalidatePath('/admin/usuarios')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao excluir usuário.' }
  }
}
