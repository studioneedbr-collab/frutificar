'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import { AnalysisStatus } from '@prisma/client'
import * as diagnosticsRepository from '@/server/repositories/diagnostics.repository'

const requestDiagnosticSchema = z.object({
  plotId: z.string(),
  ph: z.coerce.number().min(0).max(14),
  nutrients: z.record(z.string(), z.number()).optional().default({}),
  analyzedAt: z.coerce.date().optional().default(() => new Date()),
  analysisType: z.string().optional(),
})

export async function requestDiagnostic(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = requestDiagnosticSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const ownerUserId = await diagnosticsRepository.getPlotOwnerUserId(parsed.data.plotId)
    if (!ownerUserId) {
      return { ok: false, error: 'Talhão não encontrado.' }
    }
    if (ownerUserId !== session.user.id) {
      return { ok: false, error: 'Acesso negado.' }
    }

    const analysis = await diagnosticsRepository.createSoilAnalysis(parsed.data.plotId, {
      ph: parsed.data.ph,
      nutrients: parsed.data.nutrients,
      analyzedAt: parsed.data.analyzedAt,
      status: AnalysisStatus.PENDING,
      analysisType: parsed.data.analysisType,
    })

    revalidatePath('/diagnostico')
    return { ok: true, data: { id: analysis.id } }
  } catch {
    return { ok: false, error: 'Erro ao solicitar diagnóstico.' }
  }
}

export async function listMyPlots(): Promise<
  ActionResult<Awaited<ReturnType<typeof diagnosticsRepository.listPlotsByUser>>>
> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  try {
    const plots = await diagnosticsRepository.listPlotsByUser(session.user.id)
    return { ok: true, data: plots }
  } catch {
    return { ok: false, error: 'Erro ao listar talhões.' }
  }
}
