// Tipo de linha (episódio) da tela de podcasts (admin) + mock usado no modo preview (sem banco).
// A página server mapeia os dados reais (listEpisodes) para este mesmo formato.

export type Episode = {
  id: string
  title: string
  series: string
  dur: string
  /** ISO yyyy-mm-dd */
  date: string
  url: string
  plays: number
  published: boolean
}

export const mockEpisodes: Episode[] = [
  { id: '1', title: 'Como aumentar a produtividade sem aumentar custos', series: 'Campo em Foco', dur: '42 min', date: '2026-06-10', url: '', plays: 1240, published: true },
  { id: '2', title: 'Tecnologia no campo: IoT e sensores para o produtor rural', series: 'Campo em Foco', dur: '38 min', date: '2026-06-03', url: '', plays: 980, published: true },
  { id: '3', title: 'Crédito rural: o que você precisa saber antes de assinar', series: 'Campo em Foco', dur: '51 min', date: '2026-05-27', url: '', plays: 1120, published: true },
  { id: '4', title: 'A safra do café especial: tendências 2026', series: 'Café com Agro', dur: '35 min', date: '2026-06-08', url: '', plays: 620, published: true },
  { id: '5', title: 'Rastreabilidade do café da origem ao consumidor', series: 'Café com Agro', dur: '44 min', date: '2026-06-01', url: '', plays: 540, published: true },
]
