// Tipo de linha (episódio) da tela de podcasts (admin).
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
