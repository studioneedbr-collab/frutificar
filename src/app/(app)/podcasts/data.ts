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
