// Server Component: lista os cursos reais (com módulos e aulas) para o editor do admin.
// A interatividade + Server Actions ficam em CursosAdminView.
export const dynamic = 'force-dynamic'

import { listCoursesForAdmin } from '@/server/repositories/courses.repository'
import type { AdminCourse } from './data'
import { CursosAdminView } from './cursos-view'

export default async function AdminCursosPage() {
  try {
    const rows = await listCoursesForAdmin()
    const courses: AdminCourse[] = rows.map((c) => ({
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
    return <CursosAdminView initialCourses={courses} />
  } catch (err) {
    console.error('[admin/cursos] falha ao carregar cursos:', err)
    return <CursosAdminView initialCourses={[]} />
  }
}
