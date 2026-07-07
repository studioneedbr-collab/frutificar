// Server Component: busca episódios reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em PodcastsView (client).
// O layout admin não tem auth(); buscamos direto — as Server Actions exigem ADMIN.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listEpisodes } from '@/server/repositories/podcasts.repository'
import { mockEpisodes, type Episode } from './data'
import { PodcastsView } from './podcasts-view'

export default async function AdminPodcastsPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <PodcastsView initialEpisodes={mockEpisodes} preview />
  }

  // Modo real: lê do banco; em caso de erro, cai no mock para não quebrar.
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
      // Sem campos "plays"/"published" no schema — valores de exibição padrão.
      plays: 0,
      published: true,
    }))

    return <PodcastsView initialEpisodes={episodes} preview={false} />
  } catch {
    return <PodcastsView initialEpisodes={mockEpisodes} preview />
  }
}
