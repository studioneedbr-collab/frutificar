'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import { AnalysisStatus } from '@prisma/client'
import * as diagnosticsRepository from '@/server/repositories/diagnostics.repository'
import { uploadToStorage } from '@/lib/storage'
import { analyzeSoilReportWithAI, type AiSoilResult } from '@/lib/soil-ai'

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

// ─── Análise de solo com IA (lê o laudo enviado) ──────────

const MAX_REPORT_BYTES = 15 * 1024 * 1024 // 15MB
const ACCEPTED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
]

export type SoilAnalysisResult = AiSoilResult & { id: string; fileUrl: string | null }

/**
 * Recebe o laudo (imagem/PDF) enviado pelo aluno, sobe ao Storage, manda a IA
 * (GPT-4o visão) interpretar e grava o SoilAnalysis já concluído com o plano.
 */
export async function analyzeSoilReport(
  formData: FormData,
): Promise<ActionResult<SoilAnalysisResult>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const plotId = String(formData.get('plotId') ?? '')
  const analysisType = String(formData.get('analysisType') ?? 'Completa')
  const observacoes = String(formData.get('observacoes') ?? '')
  const file = formData.get('file')

  if (!plotId) return { ok: false, error: 'Selecione um talhão.' }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Anexe o arquivo do laudo (foto ou PDF).' }
  }
  if (file.size > MAX_REPORT_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx. 15MB).' }
  }
  const mime = file.type || 'application/octet-stream'
  if (!ACCEPTED_MIMES.includes(mime)) {
    return { ok: false, error: 'Formato não suportado. Envie JPG, PNG, WEBP ou PDF.' }
  }

  // Ownership do talhão.
  const ownerUserId = await diagnosticsRepository.getPlotOwnerUserId(plotId)
  if (!ownerUserId) return { ok: false, error: 'Talhão não encontrado.' }
  if (ownerUserId !== session.user.id) return { ok: false, error: 'Acesso negado.' }

  // Base64 data URL para a IA (não depende do arquivo ser público).
  const buffer = Buffer.from(await file.arrayBuffer())
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`

  // IA lê o laudo.
  let result: AiSoilResult
  try {
    result = await analyzeSoilReportWithAI({
      dataUrl,
      mime,
      filename: file.name || 'laudo',
      analysisType,
      observacoes,
    })
  } catch (err) {
    console.error('[analyzeSoilReport] falha na IA:', err)
    return {
      ok: false,
      error: 'Não foi possível ler o laudo com a IA. Verifique a OPENAI_API_KEY ou tente uma foto mais nítida.',
    }
  }

  if (!result.legivel || (result.params.length === 0 && result.recommendations.length === 0)) {
    return {
      ok: false,
      error: 'Não consegui interpretar este arquivo como um laudo de solo. Envie uma foto nítida ou o PDF do laboratório.',
    }
  }

  // Upload do laudo ao Storage (best-effort — não bloqueia se não configurado).
  let fileUrl: string | null = null
  const up = await uploadToStorage(file, { prefix: 'laudos' })
  if (up.ok) fileUrl = up.url

  // Grava o diagnóstico concluído com o plano da IA.
  try {
    const analysis = await diagnosticsRepository.createSoilAnalysis(plotId, {
      ph: result.ph,
      nutrients: { params: result.params, recommendations: result.recommendations, fileUrl },
      analyzedAt: new Date(),
      status: AnalysisStatus.COMPLETED,
      analysisType,
      summary: result.summary,
    })

    revalidatePath('/diagnostico')
    return { ok: true, data: { ...result, id: analysis.id, fileUrl } }
  } catch (err) {
    console.error('[analyzeSoilReport] falha ao salvar:', err)
    return { ok: false, error: 'A IA leu o laudo, mas houve erro ao salvar. Tente novamente.' }
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
