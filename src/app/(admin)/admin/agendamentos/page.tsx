// Server Component: busca todas as visitas (Supabase). A interatividade fica em AgendamentosView (client).
// O layout admin já exige ADMIN; as Server Actions revalidam esta rota.
export const dynamic = 'force-dynamic'

import { listAllVisits } from '@/server/repositories/admin.repository'
import { type Visit, type Status } from './data'
import { AgendamentosView } from './agendamentos-view'

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function formatDateBR(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`
}

export default async function AdminAgendamentosPage() {
  // Lê do banco; em caso de erro, mostra estado vazio (nunca dados fictícios).
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
    return <AgendamentosView initialVisits={visits} />
  } catch (err) {
    console.error('[admin/agendamentos] falha ao carregar visitas:', err)
    return <AgendamentosView initialVisits={[]} />
  }
}
