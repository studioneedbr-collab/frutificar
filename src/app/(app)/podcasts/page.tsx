// Server Component: lê episódios reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A UI fica em PodcastsView (client).
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { listEpisodes } from '@/server/repositories/podcasts.repository'
import { mockEpisodes, COVERS, type Episode } from './data'
import { PodcastsView } from './podcasts-view'

// "há X dias/semanas" a partir da data de publicação.
function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const day = 24 * 60 * 60 * 1000
  const days = Math.floor(diff / day)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'há 1 dia'
  if (days < 7) return `há ${days} dias`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'há 1 semana'
  if (weeks < 5) return `há ${weeks} semanas`
  const months = Math.floor(days / 30)
  return months === 1 ? 'há 1 mês' : `há ${months} meses`
}

export default async function PodcastsPage() {
  if (PREVIEW_MODE) {
    return <PodcastsView initialEpisodes={mockEpisodes} />
  }

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let episodes: Episode[] = []
  try {
    const rows = await listEpisodes()
    episodes = rows.map((e, i) => ({
      id: e.id,
      title: e.title,
      host: e.podcast?.title ?? 'Frutificar no Campo',
      meta: timeAgo(new Date(e.publishedAt)),
      category: 'Todos', // schema não tem categoria por episódio
      cover: COVERS[i % COVERS.length],
      url: e.audioUrl ?? '',
    }))
  } catch (err) {
    console.error('[podcasts] erro ao carregar do banco:', err)
    episodes = []
  }
  // Em modo real mostramos o que existe (mesmo vazio → estado vazio na view).
  return <PodcastsView initialEpisodes={episodes} />
}
