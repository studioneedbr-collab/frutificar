'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { Prisma, Role } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import { prisma } from '@/lib/prisma'
import { newToken } from '@/lib/tokens'
import { sendPasswordResetEmail } from '@/lib/email'
import * as usersRepository from '@/server/repositories/users.repository'

// ─── Schemas ──────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  role: z.enum(['STUDENT', 'ADMIN', 'INSTRUCTOR']),
})

const updateUserSchema = createUserSchema.partial()

const RESET_PREFIX = 'reset:'
const RESET_TTL_MS = 60 * 60 * 1000 // 1 hora
const INVITE_TTL_MS = 72 * 60 * 60 * 1000 // 3 dias para o primeiro acesso

/** Gera um link de definição de senha e envia por e-mail. Não lança erro. */
async function sendSetPasswordLink(email: string, ttlMs: number): Promise<boolean> {
  try {
    const token = newToken()
    await prisma.verificationToken.deleteMany({ where: { identifier: `${RESET_PREFIX}${email}` } })
    await prisma.verificationToken.create({
      data: { identifier: `${RESET_PREFIX}${email}`, token: token.hash, expires: new Date(Date.now() + ttlMs) },
    })
    await sendPasswordResetEmail(email, token.raw)
    return true
  } catch (err) {
    console.error('[admin-users] falha ao enviar link de senha:', err)
    return false
  }
}

/** Impede o admin de se rebaixar/suspender/excluir e de remover o último admin. */
async function guardAdminTarget(
  targetId: string,
  sessionUserId: string,
  change: 'demote' | 'suspend' | 'delete' | 'temp-password',
): Promise<string | null> {
  if (targetId === sessionUserId && change !== 'temp-password') {
    return 'Você não pode fazer isso com a sua própria conta.'
  }
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } })
  if (!target) return 'Usuário não encontrado.'
  if (target.role !== 'ADMIN') return null
  if (change === 'temp-password') {
    return 'Por segurança, administradores só redefinem a senha pelo link enviado por e-mail.'
  }
  const admins = await prisma.user.count({
    where: { role: 'ADMIN', deletedAt: null, suspendedAt: null },
  })
  if (admins <= 1) return 'Não é possível remover o último administrador ativo.'
  return null
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

// ─── Criar usuário ────────────────────────────────────────

export async function createUserAction(
  input: unknown,
): Promise<ActionResult<{ id: string; emailSent: boolean }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    // Senha aleatória que ninguém conhece: o usuário define a dele pelo link
    // enviado por e-mail (antes era uma senha fixa igual para todo mundo).
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
    const user = await usersRepository.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role as Role,
      passwordHash,
    })
    revalidatePath('/admin/usuarios')
    const emailSent = await sendSetPasswordLink(user.email, INVITE_TTL_MS)
    return { ok: true, data: { id: user.id, emailSent } }
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

  if (parsed.data.role && parsed.data.role !== 'ADMIN') {
    const blocked = await guardAdminTarget(id, session.user.id, 'demote')
    if (blocked) return { ok: false, error: blocked }
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

  if (suspended) {
    const blocked = await guardAdminTarget(id, session.user.id, 'suspend')
    if (blocked) return { ok: false, error: blocked }
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

  const blocked = await guardAdminTarget(id, session.user.id, 'temp-password')
  if (blocked) return { ok: false, error: blocked }

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

export async function sendPasswordResetAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const user = await usersRepository.getUserById(id)
  if (!user || user.deletedAt) {
    return { ok: false, error: 'Usuário não encontrado.' }
  }
  const sent = await sendSetPasswordLink(user.email, RESET_TTL_MS)
  return sent
    ? { ok: true, data: undefined }
    : { ok: false, error: 'Não foi possível enviar o e-mail. Verifique a configuração de e-mail (Brevo).' }
}

// ─── Excluir usuário (soft delete) ────────────────────────

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const blocked = await guardAdminTarget(id, session.user.id, 'delete')
  if (blocked) return { ok: false, error: blocked }

  try {
    await usersRepository.softDeleteUser(id)
    revalidatePath('/admin/usuarios')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao excluir usuário.' }
  }
}
