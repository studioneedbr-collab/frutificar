// Server Component: lista os cursos reais (com módulos e aulas) para o editor do admin.
// Em preview usa o mock. A interatividade + Server Actions ficam em CursosAdminView.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listCoursesForAdmin } from '@/server/repositories/courses.repository'
import { mockCourses, type AdminCourse } from './data'
import { CursosAdminView } from './cursos-view'

export default async function AdminCursosPage() {
  if (PREVIEW_MODE) {
    return <CursosAdminView initialCourses={mockCourses} preview />
  }

  let courses: AdminCourse[] = []
  try {
    const rows = await listCoursesForAdmin()
    courses = rows.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      instructor: c.instructor?.name ?? 'A definir',
      published: c.published,
      enrolled: c._count.enrollments,
      modules: c.modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          videoId: l.youtubeVideoId ?? null,
          minutes: l.durationSec ? Math.round(l.durationSec / 60) : null,
        })),
      })),
    }))
  } catch (err) {
    // Nunca mostrar mock em produção: lista vazia + log para investigar.
    console.error('[admin/cursos] erro ao carregar do banco:', err)
    courses = []
  }
  return <CursosAdminView initialCourses={courses} preview={false} />
}
