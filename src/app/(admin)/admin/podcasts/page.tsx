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

  // Modo real: lê do banco; em caso de erro, lista vazia (nunca mock) + log.
  let episodes: Episode[] = []
  try {
    const rows = await listEpisodes()
    episodes = rows.map((e) => ({
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
  } catch (err) {
    // Nunca mostrar mock em produção: lista vazia + log para investigar.
    console.error('[admin/podcasts] erro ao carregar do banco:', err)
    episodes = []
  }
  return <PodcastsView initialEpisodes={episodes} preview={false} />
}
