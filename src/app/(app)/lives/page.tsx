// Server Component: lê lives reais (Supabase) quando PREVIEW_MODE=false, senão mock.
// Separa em: ao vivo agora (LIVE), próximas (SCHEDULED futuras) e gravadas (ENDED).
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { listLives } from '@/server/repositories/lives.repository'
import { mockData, type LivesData, type Featured, type Upcoming, type Recorded } from './data'
import { LivesView } from './lives-view'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatWhen(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const hora = m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} · ${hora}`
}

function badgeFor(d: Date): string {
  const day = 24 * 60 * 60 * 1000
  const diffDays = Math.ceil((d.getTime() - Date.now()) / day)
  if (diffDays <= 0) return 'AO VIVO HOJE'
  if (diffDays === 1) return 'AO VIVO AMANHÃ'
  return `AO VIVO EM ${diffDays} DIAS`
}

// Lives agendadas a partir de agora, da mais próxima para a mais distante.
function upcomingScheduled<T extends { status: string; scheduledAt: Date }>(rows: T[]): T[] {
  const now = Date.now()
  return rows
    .filter((l) => l.status === 'SCHEDULED' && new Date(l.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
}

export default async function LivesPage() {
  if (PREVIEW_MODE) {
    return <LivesView data={mockData} />
  }

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let data: LivesData = { featured: null, proximas: [], gravadas: [], temas: ['Todos'] }
  try {
    const rows = await listLives()

    const liveNow = rows.find((l) => l.status === 'LIVE')
    const upcoming = upcomingScheduled(rows)
    const recorded = rows.filter((l) => l.status === 'ENDED')

    let featured: Featured | null = null
    let proximas: Upcoming[] = upcoming.map((l) => ({
      id: l.id, title: l.title, agro: '', when: formatWhen(new Date(l.scheduledAt)), tema: '',
    }))
    const gravadas: Recorded[] = recorded.map((l) => ({
      id: l.id, title: l.title, agro: '', dur: '', meta: '', tema: '', ytId: l.youtubeVideoId || '',
    }))

    if (liveNow) {
      featured = {
        title: liveNow.title, agro: '', when: formatWhen(new Date(liveNow.scheduledAt)),
        tema: '', desc: '', ytId: liveNow.youtubeVideoId || '', badge: 'AO VIVO AGORA',
      }
    } else if (upcoming[0]) {
      const f = upcoming[0]
      featured = {
        title: f.title, agro: '', when: formatWhen(new Date(f.scheduledAt)),
        tema: '', desc: '', ytId: f.youtubeVideoId || '', badge: badgeFor(new Date(f.scheduledAt)),
      }
      proximas = proximas.slice(1) // não repetir a live em destaque
    } else if (recorded[0]) {
      const f = recorded[0]
      featured = {
        title: f.title, agro: '', when: formatWhen(new Date(f.scheduledAt)),
        tema: '', desc: '', ytId: f.youtubeVideoId || '', badge: 'GRAVADA',
      }
    }

    data = { featured, proximas, gravadas, temas: ['Todos'] }
  } catch (err) {
    console.error('[lives] erro ao carregar do banco:', err)
    data = { featured: null, proximas: [], gravadas: [], temas: ['Todos'] }
  }
  return <LivesView data={data} />
}
