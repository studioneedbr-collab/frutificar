// Server Component: busca diagnósticos reais (Supabase). A interatividade + análise por IA
// ficam em DiagnosticoView.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listSoilAnalysesByUser, listPlotsByUser } from '@/server/repositories/diagnostics.repository'
import {
  mockTalhaoOptions,
  type HistoricoItem,
  type TalhaoOption,
  type DiagnosticResult,
  type SoilParam,
} from './data'
import { DiagnosticoView } from './diagnostico-view'

export default async function DiagnosticoPage() {
  // Sem sessão → login (nunca dados fake).
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
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
    />
  )
}
