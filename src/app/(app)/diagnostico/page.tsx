// Server Component: busca diagnósticos reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em DiagnosticoView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { listSoilAnalysesByUser, listPlotsByUser } from '@/server/repositories/diagnostics.repository'
import {
  initialHistorico as mockHistorico,
  mockTalhaoOptions,
  type HistoricoItem,
  type TalhaoOption,
} from './data'
import { DiagnosticoView } from './diagnostico-view'

export default async function DiagnosticoPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <DiagnosticoView initialHistorico={mockHistorico} talhaoOptions={mockTalhaoOptions} preview />
  }

  // Modo real: exige sessão; sem ela, cai no mock para não quebrar.
  const session = await auth()
  if (!session?.user?.id) {
    return <DiagnosticoView initialHistorico={mockHistorico} talhaoOptions={mockTalhaoOptions} preview />
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

  return <DiagnosticoView initialHistorico={historico} talhaoOptions={talhaoOptions} preview={false} />
}
