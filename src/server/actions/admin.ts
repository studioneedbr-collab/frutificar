'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { VisitStatus, ServiceStatus } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as adminRepository from '@/server/repositories/admin.repository'

// ─── Solicitações: visitas técnicas ───────────────────────

export async function acceptVisit(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminRepository.setVisitStatus(id, VisitStatus.CONFIRMED)
    revalidatePath('/admin')
    revalidatePath('/agendamentos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao confirmar visita.' }
  }
}

export async function rejectVisit(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminRepository.setVisitStatus(id, VisitStatus.CANCELED)
    revalidatePath('/admin')
    revalidatePath('/agendamentos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao recusar visita.' }
  }
}

export async function completeVisit(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminRepository.setVisitStatus(id, VisitStatus.COMPLETED)
    revalidatePath('/admin')
    revalidatePath('/agendamentos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao concluir visita.' }
  }
}

const assignVisitSchema = z.object({
  agronomist: z.string().min(2, 'Selecione um agrônomo.'),
  date: z.string().optional(), // ISO yyyy-mm-dd; vazio = mantém a data atual
})

export async function assignVisitAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = assignVisitSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await adminRepository.assignVisit(id, {
      agronomist: parsed.data.agronomist,
      requestedDate: parsed.data.date ? new Date(parsed.data.date) : undefined,
    })
    // Atribuir um agrônomo confirma a visita, se ainda estava só solicitada.
    await adminRepository.setVisitStatus(id, VisitStatus.CONFIRMED)
    revalidatePath('/admin')
    revalidatePath('/agendamentos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atribuir agrônomo.' }
  }
}

// ─── Solicitações: pedidos de serviço ─────────────────────

export async function acceptServiceRequest(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminRepository.setServiceStatus(id, ServiceStatus.IN_PROGRESS)
    revalidatePath('/admin')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao aceitar solicitação.' }
  }
}

export async function rejectServiceRequest(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminRepository.setServiceStatus(id, ServiceStatus.CANCELED)
    revalidatePath('/admin')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao recusar solicitação.' }
  }
}

// ─── Módulos de curso ─────────────────────────────────────

const addModuleSchema = z.object({
  title: z.string().min(2, 'Título deve ter ao menos 2 caracteres'),
})

export async function addCourseModule(
  courseId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = addModuleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const module = await adminRepository.addModule(courseId, parsed.data.title)
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { ok: true, data: { id: module.id } }
  } catch {
    return { ok: false, error: 'Erro ao adicionar módulo.' }
  }
}

export async function removeCourseModule(moduleId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminRepository.removeModule(moduleId)
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover módulo.' }
  }
}

export async function toggleCoursePublished(
  courseId: string,
  published: boolean,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminRepository.setCoursePublished(courseId, published)
    revalidatePath('/admin/cursos')
    revalidatePath('/cursos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar publicação do curso.' }
  }
}
