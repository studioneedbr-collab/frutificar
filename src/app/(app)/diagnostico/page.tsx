// Server Component: busca diagnósticos reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade + análise por IA ficam em DiagnosticoView.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { listSoilAnalysesByUser, listPlotsByUser } from '@/server/repositories/diagnostics.repository'
import {
  initialHistorico as mockHistorico,
  mockTalhaoOptions,
  params as mockParams,
  recommendations as mockRecommendations,
  type HistoricoItem,
  type TalhaoOption,
  type DiagnosticResult,
  type SoilParam,
} from './data'
import { DiagnosticoView } from './diagnostico-view'

// Demo: um "último diagnóstico" fake só para o modo preview (sem banco).
const mockResult: DiagnosticResult = {
  id: 'mock',
  talhao: 'Talhão A1',
  data: '24 jun 2026',
  ph: 5.8,
  params: mockParams,
  recommendations: mockRecommendations,
  summary: 'Solo com boa base, mas fósforo baixo e saturação por bases abaixo do ideal para café.',
}

export default async function DiagnosticoPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return (
      <DiagnosticoView
        initialHistorico={mockHistorico}
        talhaoOptions={mockTalhaoOptions}
        initialResult={mockResult}
        preview
      />
    )
  }

  // Modo real: exige sessão.
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  let plots: Awaited<ReturnType<typeof listPlotsByUser>>
  let analyses: Awaited<ReturnType<typeof listSoilAnalysesByUser>>
  try {
    ;[plots, analyses] = await Promise.all([listPlotsByUser(userId), listSoilAnalysesByUser(userId)])
  } catch (err) {
    console.error('[diagnostico] erro ao carregar do banco:', err)
    return <DiagnosticoView initialHistorico={[]} talhaoOptions={[]} initialResult={null} preview={false} />
  }

  // Sem talhões cadastrados → lista vazia (a view orienta a cadastrar a propriedade).
  const talhaoOptions: TalhaoOption[] = plots.map((pl) => ({ value: pl.id, label: pl.name }))

  const historico: HistoricoItem[] = analyses.map((a) => ({
    id: a.id,
    talhao: a.plot?.name ?? '—',
    data: a.analyzedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: a.status === 'COMPLETED' ? 'Concluído' : 'Em análise',
  }))

  // Último diagnóstico concluído (com plano da IA guardado em nutrients).
  const latest = analyses.find((a) => a.status === 'COMPLETED')
  let initialResult: DiagnosticResult | null = null
  if (latest) {
    const n = (latest.nutrients ?? {}) as { params?: SoilParam[]; recommendations?: string[]; fileUrl?: string | null }
    initialResult = {
      id: latest.id,
      talhao: latest.plot?.name ?? '—',
      data: latest.analyzedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      ph: latest.ph ? Number(latest.ph) : undefined,
      params: Array.isArray(n.params) ? n.params : [],
      recommendations: Array.isArray(n.recommendations) ? n.recommendations : [],
      summary: latest.summary ?? undefined,
      // Laudo original: só o caminho protegido (nunca a referência do Storage).
      fileUrl: n.fileUrl ? `/api/arquivos/laudo/${latest.id}` : null,
    }
  }

  return (
    <DiagnosticoView
      initialHistorico={historico}
      talhaoOptions={talhaoOptions}
      initialResult={initialResult}
      preview={false}
    />
  )
}
