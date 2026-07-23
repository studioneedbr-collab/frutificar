// Server Component: busca dias de campo reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em DiasDeCampoView (client).
// O modelo FieldDay não tem vagas/inscritos — esses campos são display-only.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listFieldDaysWithCounts } from '@/server/repositories/fielddays.repository'
import { mockEvents, type FieldDayRow } from './data'
import { DiasDeCampoView } from './dias-view'

const pad = (n: number) => String(n).padStart(2, '0')

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function toTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default async function AdminDiasDeCampoPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <DiasDeCampoView initialEvents={mockEvents} preview />
  }

  // Modo real: lê do banco; em caso de erro, cai no mock para não quebrar.
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

    return <DiasDeCampoView initialEvents={events} preview={false} />
  } catch (err) {
    console.error('[admin/dias-de-campo] falha ao carregar dias de campo:', err)
    return <DiasDeCampoView initialEvents={[]} preview={false} />
  }
}
