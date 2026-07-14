// Tipos + mock do editor de cursos do admin. A página server mapeia os dados reais
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

export const mockCourses: AdminCourse[] = [
  {
    id: 'mock-1',
    title: 'Cafeicultura Completa: do plantio à xícara',
    type: 'PRINCIPAL',
    instructor: 'Dr. Felipe Moura',
    published: true,
    enrolled: 312,
    modules: [
      { id: 'm1', title: 'Introdução ao Café', lessons: [
        { id: 'l1', title: 'História e origem do café', videoId: 'jNQXAC9IVRw', minutes: 12 },
        { id: 'l2', title: 'Espécies e variedades', videoId: 'jNQXAC9IVRw', minutes: 15 },
      ] },
      { id: 'm2', title: 'Clima, Solo e Regiões', lessons: [
        { id: 'l3', title: 'Exigências climáticas', videoId: null, minutes: null },
      ] },
    ],
  },
  {
    id: 'mock-2',
    title: 'Nutrição do Cafeeiro',
    type: 'MINICOURSE',
    instructor: 'Eng. Carla Nogueira',
    published: false,
    enrolled: 0,
    modules: [],
  },
]
