// Tipo + mock dos podcasts (área do aluno). A página server mapeia listEpisodes() real.

export type Episode = {
  id: string
  title: string
  host: string
  meta: string
  category: string
  cover: string
  url: string
}

export const COVERS = [
  'linear-gradient(150deg, oklch(0.48 0.13 144), oklch(0.62 0.12 55))',
  'linear-gradient(150deg, oklch(0.55 0.1 220), oklch(0.48 0.13 144))',
  'linear-gradient(150deg, oklch(0.55 0.12 200), oklch(0.62 0.12 55))',
  'linear-gradient(150deg, oklch(0.62 0.14 75), oklch(0.62 0.12 55))',
  'linear-gradient(150deg, oklch(0.48 0.13 144), oklch(0.55 0.12 290))',
  'linear-gradient(150deg, oklch(0.55 0.12 290), oklch(0.48 0.13 144))',
]

export const mockEpisodes: Episode[] = [
  { id: '1', title: 'Café de qualidade: da colheita ao copo', host: 'com Agr. Marcos Lima', meta: 'há 3 dias · 28 min', category: 'Cafeicultura', cover: COVERS[0], url: '' },
  { id: '2', title: 'Análise de solo: lendo o laudo sem medo', host: 'com Agr. Helena Prado', meta: 'há 6 dias · 35 min', category: 'Solo & Adubação', cover: COVERS[1], url: '' },
  { id: '3', title: 'Irrigação por gotejamento na seca de MG', host: 'com Eng. Agr. Túlio Resende', meta: 'há 1 semana · 24 min', category: 'Cafeicultura', cover: COVERS[2], url: '' },
  { id: '4', title: 'Preço da saca: como travar a venda do café', host: 'com Econ. Rafael Mourão', meta: 'há 2 semanas · 30 min', category: 'Mercado', cover: COVERS[3], url: '' },
  { id: '5', title: 'Broca e ferrugem: manejo de pragas na entressafra', host: 'com Agr. Helena Prado', meta: 'há 3 semanas · 27 min', category: 'Cafeicultura', cover: COVERS[4], url: '' },
  { id: '6', title: 'Sucessão familiar: passando a fazenda adiante', host: 'com Cons. Beatriz Andrade', meta: 'há 1 mês · 41 min', category: 'Gestão', cover: COVERS[5], url: '' },
]
