// Server Component: busca lives reais (Supabase). A interatividade fica em
// LivesView (client). O layout admin não tem auth(); buscamos direto — as
// Server Actions exigem ADMIN.
export const dynamic = 'force-dynamic'

import { listLives } from '@/server/repositories/lives.repository'
import type { Live, Plan, Status } from './data'
import { LivesView } from './lives-view'

const pad = (n: number) => String(n).padStart(2, '0')

export default async function AdminLivesPage() {
  // Lê do banco; em caso de erro, renderiza vazio (nunca dados fictícios).
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

    return <LivesView initialLives={lives} />
  } catch (err) {
    console.error('[admin/lives] falha ao carregar lives:', err)
    return <LivesView initialLives={[]} />
  }
}
