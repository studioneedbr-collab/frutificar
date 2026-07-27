// Server Component: busca dias de campo reais (Supabase).
// A interatividade fica em DiasDeCampoView (client).
// O modelo FieldDay não tem vagas/inscritos — esses campos são display-only.
export const dynamic = 'force-dynamic'

import { listFieldDaysWithCounts } from '@/server/repositories/fielddays.repository'
import type { FieldDayRow } from './data'
import { DiasDeCampoView } from './dias-view'

const pad = (n: number) => String(n).padStart(2, '0')

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function toTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default async function AdminDiasDeCampoPage() {
  // Lê do banco; em caso de erro, renderiza a lista vazia (sem dados fictícios).
  try {
    const rows = await listFieldDaysWithCounts()
    const events: FieldDayRow[] = rows.map((f) => ({
      id: f.id,
      title: f.title,
      location: f.location,
      date: toISO(f.date),
      time: toTime(f.date),
      instructor: f.instructor,
      // Capacidade não existe no schema (display-only); inscritos = interesses reais.
      capacity: 0,
      registered: f._count.registrations,
    }))

    return <DiasDeCampoView initialEvents={events} />
  } catch (err) {
    console.error('[admin/dias-de-campo] falha ao carregar dias de campo:', err)
    return <DiasDeCampoView initialEvents={[]} />
  }
}
