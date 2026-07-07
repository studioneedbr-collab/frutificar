// Server Component: busca visitas técnicas e solicitações de serviço reais (Supabase) quando
// PREVIEW_MODE=false, senão renderiza o mock. A interatividade fica em AgendamentosView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import {
  listVisitsByUser, listServiceRequestsByUser,
} from '@/server/repositories/appointments.repository'
import {
  initialUpcoming as mockUpcoming, history as mockHistory,
  type Appointment, type AppointmentStatus,
} from './data'
import { AgendamentosView } from './agendamentos-view'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Formata uma data para 'dd mmm · HHhmm' (pt-BR), ex.: '02 jul · 09h00'.
function formatWhen(date: Date): string {
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = MESES[date.getMonth()]
  const hora = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${dia} ${mes} · ${hora}h${min}`
}

const VISIT_STATUS: Record<string, AppointmentStatus | null> = {
  REQUESTED: 'Pendente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED: null,
}

const SERVICE_STATUS: Record<string, AppointmentStatus | null> = {
  OPEN: 'Pendente',
  IN_PROGRESS: 'Confirmado',
  IN_ANALYSIS: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED: null,
}

export default async function AgendamentosPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <AgendamentosView initialUpcoming={mockUpcoming} initialHistory={mockHistory} preview />
  }

  // Modo real: exige sessão; sem ela, cai no mock para não quebrar.
  const session = await auth()
  if (!session?.user?.id) {
    return <AgendamentosView initialUpcoming={mockUpcoming} initialHistory={mockHistory} preview />
  }

  const userId = session.user.id
  const [visits, serviceRequests] = await Promise.all([
    listVisitsByUser(userId),
    listServiceRequestsByUser(userId),
  ])

  const items: Appointment[] = []

  for (const v of visits) {
    const status = VISIT_STATUS[v.status]
    if (!status) continue
    items.push({
      id: v.id,
      type: 'Visita Técnica',
      title: 'Visita Técnica',
      agro: 'A designar',
      place: v.property?.name ?? '—',
      when: formatWhen(v.requestedDate),
      status,
      kind: 'visit',
    })
  }

  for (const s of serviceRequests) {
    const status = SERVICE_STATUS[s.status]
    if (!status) continue
    items.push({
      id: s.id,
      type: s.serviceType,
      title: s.serviceType,
      agro: 'A designar',
      place: s.description,
      when: formatWhen(s.createdAt),
      status,
      kind: 'service',
    })
  }

  const upcoming = items.filter((a) => a.status === 'Pendente' || a.status === 'Confirmado')
  const history = items
    .filter((a) => a.status === 'Concluído')
    .map((a) => ({ type: a.type, agro: a.agro, when: a.when }))

  return <AgendamentosView initialUpcoming={upcoming} initialHistory={history} preview={false} />
}
