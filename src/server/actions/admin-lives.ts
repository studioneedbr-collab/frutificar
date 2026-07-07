'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { LiveStatus, PlanName } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as livesRepository from '@/server/repositories/lives.repository'

const liveStatusEnum = z.enum(['SCHEDULED', 'LIVE', 'ENDED'])
const requiredPlanEnum = z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD'])

const createLiveSchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  scheduledAt: z.coerce.date(),
  status: liveStatusEnum.optional(),
  requiredPlan: requiredPlanEnum.optional(),
  youtubeVideoId: z.string().optional(),
})

const updateLiveSchema = createLiveSchema.partial()

function revalidateLives() {
  revalidatePath('/admin/lives')
  revalidatePath('/lives')
}

export async function createLiveAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = createLiveSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const live = await livesRepository.createLive({
      title: parsed.data.title,
      youtubeVideoId: parsed.data.youtubeVideoId,
      scheduledAt: parsed.data.scheduledAt,
      status: parsed.data.status as LiveStatus | undefined,
      requiredPlan: parsed.data.requiredPlan as PlanName | undefined,
    })
    revalidateLives()
    return { ok: true, data: { id: live.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar live.' }
  }
}

export async function updateLiveAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = updateLiveSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await livesRepository.updateLive(id, {
      title: parsed.data.title,
      youtubeVideoId: parsed.data.youtubeVideoId,
      scheduledAt: parsed.data.scheduledAt,
      status: parsed.data.status as LiveStatus | undefined,
      requiredPlan: parsed.data.requiredPlan as PlanName | undefined,
    })
    revalidateLives()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar live.' }
  }
}

export async function setLiveStatusAction(
  id: string,
  status: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = liveStatusEnum.safeParse(status)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Status inválido.' }
  }

  try {
    await livesRepository.setLiveStatus(id, parsed.data as LiveStatus)
    revalidateLives()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar status da live.' }
  }
}

export async function deleteLiveAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await livesRepository.deleteLive(id)
    revalidateLives()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover live.' }
  }
}
