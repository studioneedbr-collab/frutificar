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
    return <CursosAdminView initialCourses={courses} preview={false} />
  } catch {
    return <CursosAdminView initialCourses={mockCourses} preview />
  }
}
