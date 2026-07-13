// Server Component: lê os Dias de Campo reais (Supabase) quando PREVIEW_MODE=false.
// Separa em próximo (destaque), próximos e edições anteriores. Evento é informativo.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listFieldDays } from '@/server/repositories/fielddays.repository'
import { mockData, type FieldDaysData, type FieldEvent, type PastEvent } from './data'
import { DiasView } from './dias-view'

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function toEvent(row: { id: string; title: string; location: string; date: Date; instructor: string; description: string }): FieldEvent {
  const d = new Date(row.date)
  return {
    id: row.id,
    title: row.title,
    local: row.location,
    date: `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    time: `${String(d.getHours()).padStart(2, '0')}h`,
    instructor: row.instructor,
    desc: row.description,
    day: String(d.getDate()).padStart(2, '0'),
    month: MONTHS[d.getMonth()].toUpperCase(),
  }
}

export default async function DiasDeCampoPage() {
  if (PREVIEW_MODE) {
    return <DiasView data={mockData} />
  }

  try {
    const rows = await listFieldDays()
    const now = Date.now()

    const future = rows
      .filter((r) => new Date(r.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const pastRows = rows.filter((r) => new Date(r.date).getTime() < now)

    const featured = future[0] ? toEvent(future[0]) : null
    const upcoming = future.slice(1).map(toEvent)
    const past: PastEvent[] = pastRows.map((r) => {
      const d = new Date(r.date)
      return { title: r.title, when: `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` }
    })

    const data: FieldDaysData = { featured, upcoming, past }
    return <DiasView data={data} />
  } catch {
    return <DiasView data={mockData} />
  }
}
