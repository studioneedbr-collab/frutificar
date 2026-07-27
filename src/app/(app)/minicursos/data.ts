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
