// Server Component: busca lives reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em LivesView (client).
// O layout admin não tem auth(); buscamos direto — as Server Actions exigem ADMIN.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listLives } from '@/server/repositories/lives.repository'
import { mockLives, type Live, type Plan, type Status } from './data'
import { LivesView } from './lives-view'

const pad = (n: number) => String(n).padStart(2, '0')

export default async function AdminLivesPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <LivesView initialLives={mockLives} preview />
  }

  // Modo real: lê do banco; em caso de erro, cai no mock para não quebrar.
  try {
    const rows = await listLives()
    const lives: Live[] = rows.map((l) => {
      const at = new Date(l.scheduledAt)
      return {
        id: l.id,
        title: l.title,
        agronomist: '—',
        plan: l.requiredPlan as Plan,
        status: l.status as Status,
        date: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
        time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
        viewers: 0,
        ytId: l.youtubeVideoId,
      }
    })

    return <LivesView initialLives={lives} preview={false} />
  } catch {
    return <LivesView initialLives={mockLives} preview />
  }
}
