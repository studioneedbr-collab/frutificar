// Server Component: busca episódios reais (Supabase). A interatividade fica em
// PodcastsView (client). O layout admin não tem auth(); buscamos direto —
// as Server Actions exigem ADMIN.
export const dynamic = 'force-dynamic'

import { listEpisodes } from '@/server/repositories/podcasts.repository'
import { type Episode } from './data'
import { PodcastsView } from './podcasts-view'

export default async function AdminPodcastsPage() {
  try {
    const rows = await listEpisodes()
    const episodes: Episode[] = rows.map((e) => ({
      id: e.id,
      title: e.title,
      // Sem campo "host"/programa próprio no episódio — usamos o título do podcast.
      series: e.podcast?.title ?? '—',
      // Sem campo "duration" no schema — exibido como '—'.
      dur: '—',
      date: e.publishedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      url: e.audioUrl ?? '',
      // Sem campo "plays" no schema — exibição padrão.
      plays: 0,
      published: e.published,
    }))

    return <PodcastsView initialEpisodes={episodes} />
  } catch (err) {
    console.error('[admin/podcasts] falha ao carregar episódios:', err)
    return <PodcastsView initialEpisodes={[]} />
  }
}
