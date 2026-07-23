'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { VisitStatus, ServiceStatus } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import { userHasFeature } from '@/lib/access-control'
import * as appointmentsRepository from '@/server/repositories/appointments.repository'

const requestVisitSchema = z.object({
  reason: z.string().min(3, 'Motivo deve ter ao menos 3 caracteres'),
  requestedDate: z.coerce.date(),
  propertyId: z.string().optional(),
  notes: z.string().optional(),
})

const requestServiceSchema = z.object({
  serviceType: z.string().min(2, 'Tipo de serviço inválido'),
  description: z.string().min(3, 'Descrição deve ter ao menos 3 caracteres'),
})

export async function requestVisit(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  if (!(await userHasFeature(session.user.id, 'visits'))) {
    return { ok: false, error: 'Seu plano não inclui visitas técnicas.' }
  }

  const parsed = requestVisitSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const visit = await appointmentsRepository.createTechnicalVisit(session.user.id, {
      reason: parsed.data.reason,
      requestedDate: parsed.data.requestedDate,
      propertyId: parsed.data.propertyId,
      notes: parsed.data.notes,
    })
    revalidatePath('/agendamentos')
    revalidatePath('/admin')
    return { ok: true, data: { id: visit.id } }
  } catch {
    return { ok: false, error: 'Erro ao solicitar visita técnica.' }
  }
}

export async function requestService(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  if (!(await userHasFeature(session.user.id, 'services'))) {
    return { ok: false, error: 'Seu plano não inclui solicitação de serviços.' }
  }

  const parsed = requestServiceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const service = await appointmentsRepository.createServiceRequest(session.user.id, {
      serviceType: parsed.data.serviceType,
      description: parsed.data.description,
    })
    revalidatePath('/agendamentos')
    revalidatePath('/admin')
    return { ok: true, data: { id: service.id } }
  } catch {
    return { ok: false, error: 'Erro ao solicitar serviço.' }
  }
}

export async function cancelVisit(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  if (!id || typeof id !== 'string') {
    return { ok: false, error: 'ID inválido.' }
  }

  try {
    const visit = await appointmentsRepository.getVisit(id)
    if (!visit || visit.userId !== session.user.id) {
      return { ok: false, error: 'Acesso negado.' }
    }

    await appointmentsRepository.updateVisitStatus(id, VisitStatus.CANCELED)
    revalidatePath('/agendamentos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao cancelar visita técnica.' }
  }
}

export async function cancelServiceRequest(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  if (!id || typeof id !== 'string') {
    return { ok: false, error: 'ID inválido.' }
  }

  try {
    const service = await appointmentsRepository.getServiceRequest(id)
    if (!service || service.userId !== session.user.id) {
      return { ok: false, error: 'Acesso negado.' }
    }

    await appointmentsRepository.updateServiceStatus(id, ServiceStatus.CANCELED)
    revalidatePath('/agendamentos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao cancelar solicitação de serviço.' }
  }
}
