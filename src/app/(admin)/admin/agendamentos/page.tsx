// Server Component: busca todas as visitas (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em AgendamentosView (client).
// O layout admin já exige ADMIN em modo real; as Server Actions revalidam esta rota.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listAllVisits } from '@/server/repositories/admin.repository'
import { mockVisits, type Visit, type Status } from './data'
import { AgendamentosView } from './agendamentos-view'

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function formatDateBR(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`
}

export default async function AdminAgendamentosPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <AgendamentosView initialVisits={mockVisits} preview />
  }

  // Modo real: lê do banco; em caso de erro, cai no mock para não quebrar.
  try {
    const rows = await listAllVisits()
    const visits: Visit[] = rows.map((v) => ({
      id: v.id,
      user: v.user.name,
      property: v.property?.name ?? '—',
      reason: v.reason,
      date: formatDateBR(new Date(v.requestedDate)),
      status: v.status as Status,
      agronomist: v.agronomist ?? undefined,
    }))
    return <AgendamentosView initialVisits={visits} preview={false} />
  } catch {
    return <AgendamentosView initialVisits={mockVisits} preview={false} />
  }
}
