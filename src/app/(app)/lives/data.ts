// Tipos + mock das lives (área do aluno). A página server mapeia listLives() real.
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

// PLACEHOLDER: vídeo do YouTube só para demonstrar a integração. No modo real,
// o link vem do que o admin cadastrar em cada live (campo "Link do YouTube").
const DEMO_YT = 'jNQXAC9IVRw'

export const mockData: LivesData = {
  featured: {
    title: 'Manejo de pragas na entressafra do café',
    agro: 'Agr. Helena Prado',
    when: 'Qua, 26 jun · 19h',
    tema: 'Pragas',
    desc: 'Como identificar e controlar as principais pragas que avançam durante a entressafra do cafezal, com foco em monitoramento, armadilhas e janelas certas de manejo para chegar à próxima safra com a lavoura protegida.',
    ytId: DEMO_YT,
    badge: 'AO VIVO EM 2 DIAS',
  },
  temas: ['Todos', 'Solo', 'Pragas', 'Gestão', 'Café'],
  proximas: [
    { id: 'p1', title: 'Leitura de análise de solo na prática', agro: 'Agr. Marcos Lima', when: 'Sex, 28 jun · 20h', tema: 'Solo' },
    { id: 'p2', title: 'Custos de produção: planilha da safra', agro: 'Agr. Beatriz Nunes', when: 'Ter, 02 jul · 19h30', tema: 'Gestão' },
    { id: 'p3', title: 'Colheita do café: ponto certo de maturação', agro: 'Agr. Rafael Teixeira', when: 'Qui, 04 jul · 20h', tema: 'Café' },
  ],
  gravadas: [
    { id: 'g1', title: 'Calagem e correção de pH passo a passo', agro: 'Agr. Marcos Lima', dur: '48 min', meta: '1,2 mil visualizações · há 1 semana', tema: 'Solo', ytId: DEMO_YT },
    { id: 'g2', title: 'Controle biológico de broca do café', agro: 'Agr. Helena Prado', dur: '52 min', meta: '980 visualizações · há 2 semanas', tema: 'Pragas', ytId: DEMO_YT },
    { id: 'g3', title: 'Fluxo de caixa para o pequeno produtor', agro: 'Agr. Beatriz Nunes', dur: '41 min', meta: '760 visualizações · há 3 semanas', tema: 'Gestão', ytId: DEMO_YT },
    { id: 'g4', title: 'Adubação foliar no cafezal', agro: 'Agr. Rafael Teixeira', dur: '37 min', meta: '1,5 mil visualizações · há 1 mês', tema: 'Café', ytId: DEMO_YT },
    { id: 'g5', title: 'Manejo de plantas daninhas na lavoura', agro: 'Agr. Helena Prado', dur: '45 min', meta: '630 visualizações · há 1 mês', tema: 'Pragas', ytId: DEMO_YT },
    { id: 'g6', title: 'Como ler um laudo de fertilidade', agro: 'Agr. Marcos Lima', dur: '39 min', meta: '2,1 mil visualizações · há 2 meses', tema: 'Solo', ytId: DEMO_YT },
  ],
}
