'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-types'
import * as coursesService from '@/server/services/courses.service'

const createCourseSchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().min(10),
  type: z.enum(['PRINCIPAL', 'MINICOURSE']),
  coverImage: z.string().url().optional(),
})

const updateCourseSchema = createCourseSchema.partial()

export async function createCourse(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = createCourseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const course = await coursesService.createCourse({
      ...parsed.data,
      published: false,
    })
    return { ok: true, data: { id: course.id } }
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'Já existe um curso com este slug.' }
    }
    return { ok: false, error: 'Erro ao criar curso.' }
  }
}

export async function updateCourse(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = updateCourseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const course = await coursesService.updateCourse(id, parsed.data)
    return { ok: true, data: { id: course.id } }
  } catch {
    return { ok: false, error: 'Erro ao atualizar curso.' }
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await coursesService.softDeleteCourse(id)
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao excluir curso.' }
  }
}

export async function completeLesson(lessonId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  if (!lessonId || typeof lessonId !== 'string') {
    return { ok: false, error: 'ID de aula inválido.' }
  }

  try {
    await coursesService.markLessonComplete(session.user.id, lessonId)
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao registrar progresso.' }
  }
}
