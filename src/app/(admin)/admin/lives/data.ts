// Tipo de linha da lista de lives (admin). A página server mapeia os dados
// reais (listLives) para este mesmo formato.

export type Plan = 'ESSENCIAL' | 'PREMIUM' | 'GOLD'
export type Status = 'SCHEDULED' | 'LIVE' | 'ENDED'

export type Live = {
  id: string
  title: string
  agronomist: string
  plan: Plan
  status: Status
  date: string // ISO yyyy-mm-dd
  time: string // HH:MM
  viewers: number
  ytId: string
}
