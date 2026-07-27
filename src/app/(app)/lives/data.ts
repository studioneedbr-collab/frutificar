// Tipos das lives (área do aluno). A página server mapeia listLives() real.
// O schema Live tem: title, youtubeVideoId, scheduledAt, status, requiredPlan.
// Campos como técnico/tema/duração/views não existem no banco → ficam vazios em modo real.

export type Featured = {
  title: string
  agro: string
  when: string
  tema: string
  desc: string
  ytId: string
  badge: string // ex.: "AO VIVO AGORA", "EM 2 DIAS"
}

export type Upcoming = { id: string; title: string; agro: string; when: string; tema: string }
export type Recorded = { id: string; title: string; agro: string; dur: string; meta: string; tema: string; ytId: string }

export type LivesData = {
  featured: Featured | null
  proximas: Upcoming[]
  gravadas: Recorded[]
  temas: string[]
}
