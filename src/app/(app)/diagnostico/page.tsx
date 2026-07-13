// Server Component: busca diagnósticos reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade + análise por IA ficam em DiagnosticoView.
export const dynamic = 'force-dynamic'

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

  // Modo real: exige sessão; sem ela, cai no mock para não quebrar.
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <DiagnosticoView
        initialHistorico={mockHistorico}
        talhaoOptions={mockTalhaoOptions}
        initialResult={mockResult}
        preview
      />
    )
  }

  const userId = session.user.id

  const plots = await listPlotsByUser(userId)
  const talhaoOptions: TalhaoOption[] = plots.length
    ? plots.map((pl) => ({ value: pl.id, label: pl.name }))
    : mockTalhaoOptions

  const analyses = await listSoilAnalysesByUser(userId)
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
    const n = (latest.nutrients ?? {}) as { params?: SoilParam[]; recommendations?: string[] }
    initialResult = {
      id: latest.id,
      talhao: latest.plot?.name ?? '—',
      data: latest.analyzedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      ph: latest.ph ? Number(latest.ph) : undefined,
      params: Array.isArray(n.params) ? n.params : [],
      recommendations: Array.isArray(n.recommendations) ? n.recommendations : [],
      summary: latest.summary ?? undefined,
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
