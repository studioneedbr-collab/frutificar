// Tipos + mock da lista de cursos (aluno). A página server monta a partir do banco.

export type LessonRow = { id: string; title: string; duration: string; done: boolean; href: string }
export type ModuleRow = { n: number; title: string; lessonsCount: number; duration: string; progress: number; lessons: LessonRow[] }
export type MiniRow = { title: string; lessons: number; duration: string; progress: number; href: string }
export type MainCourse = {
  title: string
  instrutor: string
  overall: number
  modulesCount: number
  lessonsCount: number
  continueHref: string | null
  continueLabel: string
}
export type CoursesData = { main: MainCourse | null; modules: ModuleRow[]; minis: MiniRow[] }

export const mockData: CoursesData = {
  main: {
    title: 'Cafeicultura Completa: do plantio à xícara',
    instrutor: 'Dr. Felipe Moura',
    overall: 46,
    modulesCount: 8,
    lessonsCount: 46,
    continueHref: '#',
    continueLabel: 'Continuar de onde parei',
  },
  modules: [
    {
      n: 1, title: 'Introdução ao café', lessonsCount: 5, duration: '38min', progress: 100,
      lessons: [
        { id: 'm1l1', title: 'História do café no Brasil', duration: '8min', done: true, href: '#' },
        { id: 'm1l2', title: 'O café no Cerrado Mineiro', duration: '7min', done: true, href: '#' },
        { id: 'm1l3', title: 'Panorama do mercado atual', duration: '9min', done: true, href: '#' },
      ],
    },
    {
      n: 4, title: 'Manejo da cultura', lessonsCount: 6, duration: '58min', progress: 30,
      lessons: [
        { id: 'm4l1', title: 'Calendário de manejo anual', duration: '9min', done: true, href: '#' },
        { id: 'm4l2', title: 'Adubação de produção', duration: '11min', done: false, href: '#' },
        { id: 'm4l3', title: 'Controle de plantas daninhas', duration: '10min', done: false, href: '#' },
      ],
    },
  ],
  minis: [
    { title: 'Nutrição', lessons: 4, duration: '32min', progress: 60, href: '#' },
    { title: 'Pragas', lessons: 5, duration: '41min', progress: 0, href: '#' },
    { title: 'Comercialização', lessons: 3, duration: '24min', progress: 0, href: '#' },
  ],
}
