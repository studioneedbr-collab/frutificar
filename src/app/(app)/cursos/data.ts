// Tipos da lista de cursos (aluno). A página server monta a partir do banco.

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
