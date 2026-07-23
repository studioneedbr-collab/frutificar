'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import * as podcastsRepository from '@/server/repositories/podcasts.repository'

function revalidate() {
  revalidatePath('/admin/podcasts')
  revalidatePath('/podcasts')
}

// ─── Criar episódio ───────────────────────────────────────

const createEpisodeSchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  audioUrl: z.string().optional(),
  publishedAt: z.coerce.date(),
})

export async function createEpisodeAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = createEpisodeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const episode = await podcastsRepository.createEpisode({
      title: parsed.data.title,
      audioUrl: parsed.data.audioUrl,
      publishedAt: parsed.data.publishedAt,
    })
    revalidate()
    return { ok: true, data: { id: episode.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar episódio.' }
  }
}

// ─── Atualizar episódio ───────────────────────────────────

const updateEpisodeSchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres').optional(),
  audioUrl: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
  published: z.boolean().optional(),
})

export async function updateEpisodeAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = updateEpisodeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await podcastsRepository.updateEpisode(id, parsed.data)
    revalidate()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar episódio.' }
  }
}

// ─── Remover episódio ─────────────────────────────────────

export async function deleteEpisodeAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await podcastsRepository.deleteEpisode(id)
    revalidate()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover episódio.' }
  }
}
