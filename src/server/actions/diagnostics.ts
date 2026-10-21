'use server'

import { auth } from '@/lib/auth'
import { requireFeature } from '@/lib/access-control'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import { AnalysisStatus } from '@prisma/client'
import * as diagnosticsRepository from '@/server/repositories/diagnostics.repository'
import { uploadToStorage, sniffFile } from '@/lib/storage'
import { analyzeSoilReportWithAI, type AiSoilResult } from '@/lib/soil-ai'
import { reportError } from '@/lib/alerts'

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
  const access = await requireFeature('diagnostic')
  if (!access.ok) return access
  const session = { user: { id: access.userId } }

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

const MAX_REPORT_BYTES = 4 * 1000 * 1000 // limite da Vercel por requisição
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
  const access = await requireFeature('diagnostic')
  if (!access.ok) return access
  const session = { user: { id: access.userId } }
  // Cada análise é uma chamada paga à IA: limite por aluno.
  if (!rateLimit(`soil-ai:${access.userId}`, 10, 24 * 60 * 60_000)) {
    return { ok: false, error: 'Limite diário de análises atingido. Tente novamente amanhã.' }
  }

  const plotId = String(formData.get('plotId') ?? '')
  const analysisType = String(formData.get('analysisType') ?? 'Completa').slice(0, 60)
  const observacoes = String(formData.get('observacoes') ?? '').slice(0, 1000)
  const file = formData.get('file')

  if (!plotId) return { ok: false, error: 'Selecione um talhão.' }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Anexe o arquivo do laudo (foto ou PDF).' }
  }
  if (file.size > MAX_REPORT_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx. 4 MB).' }
  }
  // Tipo pelo conteúdo do arquivo (o informado pelo navegador pode ser falso).
  const sniffed = sniffFile(new Uint8Array(await file.slice(0, 16).arrayBuffer()), file.name)
  const mime = sniffed?.mime ?? 'application/octet-stream'
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
    await reportError('diagnóstico IA', err, { tipoArquivo: mime, tipoAnalise: analysisType })
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

  // Upload do laudo ao Storage PRIVADO (best-effort — não bloqueia se não configurado).
  // Grava a referência "storage-private://..."; o aluno abre via /api/arquivos.
  let fileRef: string | null = null
  const up = await uploadToStorage(file, { folder: 'laudos', allow: ['pdf', 'image'], visibility: 'private' })
  if (up.ok) fileRef = up.url

  // Grava o diagnóstico concluído com o plano da IA.
  try {
    const analysis = await diagnosticsRepository.createSoilAnalysis(plotId, {
      ph: result.ph,
      nutrients: { params: result.params, recommendations: result.recommendations, fileUrl: fileRef },
      analyzedAt: new Date(),
      status: AnalysisStatus.COMPLETED,
      analysisType,
      summary: result.summary,
    })

    revalidatePath('/diagnostico')
    // Ao cliente vai só o caminho protegido (nunca a referência interna).
    const fileUrl = fileRef ? `/api/arquivos/laudo/${analysis.id}` : null
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
