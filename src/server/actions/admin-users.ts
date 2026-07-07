'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { Prisma, Role } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
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
