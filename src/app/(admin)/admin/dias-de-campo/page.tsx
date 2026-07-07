// Server Component: busca dias de campo reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em DiasDeCampoView (client).
// O modelo FieldDay não tem vagas/inscritos — esses campos são display-only.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listFieldDays } from '@/server/repositories/fielddays.repository'
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
    const rows = await listFieldDays()
    const events: FieldDayRow[] = rows.map((f) => ({
      id: f.id,
      title: f.title,
      location: f.location,
      date: toISO(f.date),
      time: toTime(f.date),
      instructor: f.instructor,
      // Sem modelo de vagas/inscritos no banco — valores display-only.
      capacity: 0,
      registered: 0,
    }))

    return <DiasDeCampoView initialEvents={events} preview={false} />
  } catch {
    return <DiasDeCampoView initialEvents={mockEvents} preview />
  }
}
