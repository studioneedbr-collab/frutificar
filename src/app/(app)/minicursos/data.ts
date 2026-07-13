// Tipos + mock da página de Minicursos (cursos curtos, tipo MINICOURSE).
// A página server lê os cursos MINICOURSE publicados do banco.

export type MiniCourse = {
  id: string
  title: string
  description: string
  slug: string
  lessons: number
  progress: number
}

export const mockMinicursos: MiniCourse[] = [
  { id: '1', title: 'Manejo da Ferrugem do Café', description: 'Identificação, prevenção e controle da principal doença do cafeeiro.', slug: 'manejo-ferrugem', lessons: 5, progress: 100 },
  { id: '2', title: 'Calagem e Correção de Solo', description: 'Como interpretar a análise e corrigir a acidez do solo para café.', slug: 'calagem-solo', lessons: 4, progress: 40 },
  { id: '3', title: 'Adubação na Florada', description: 'Nutrição do cafeeiro no período crítico de florescimento e granação.', slug: 'adubacao-florada', lessons: 6, progress: 0 },
  { id: '4', title: 'Colheita e Pós-colheita', description: 'Boas práticas de colheita, secagem e beneficiamento para qualidade de bebida.', slug: 'colheita-pos-colheita', lessons: 5, progress: 0 },
  { id: '5', title: 'Precificação da Saca', description: 'Custo de produção, mercado e estratégias para vender melhor.', slug: 'precificacao-saca', lessons: 3, progress: 0 },
  { id: '6', title: 'Irrigação no Cafeeiro', description: 'Manejo de irrigação e estresse hídrico controlado pré-florada.', slug: 'irrigacao-cafeeiro', lessons: 4, progress: 0 },
]
