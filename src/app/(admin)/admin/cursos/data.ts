// Tipos do editor de cursos do admin. A página server mapeia os dados reais
// (listCoursesForAdmin) para este mesmo formato.

export type AdminLesson = {
  id: string
  title: string
  videoId: string | null
  minutes: number | null
}

export type AdminModule = {
  id: string
  title: string
  lessons: AdminLesson[]
}

export type AdminCourse = {
  id: string
  title: string
  type: 'PRINCIPAL' | 'MINICOURSE'
  instructor: string
  published: boolean
  enrolled: number
  modules: AdminModule[]
}
