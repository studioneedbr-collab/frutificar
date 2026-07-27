// Server Component: lista os cursos MINICOURSE publicados. Lê do banco com o
// progresso do aluno. Cada card leva a /cursos/[slug].
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type MiniCourse } from './data'
import { MinicursosView } from './minicursos-view'

export default async function MinicursosPage() {
  try {
    const session = await auth()

    const [minisRaw, completedRecords] = await Promise.all([
      prisma.course.findMany({
        where: { published: true, deletedAt: null, type: 'MINICOURSE' },
        orderBy: { createdAt: 'asc' },
        include: { modules: { include: { lessons: { select: { id: true } } } } },
      }),
      session
        ? prisma.lessonProgress.findMany({
            where: { userId: session.user.id, completed: true },
            select: { lessonId: true },
          })
        : Promise.resolve([]),
    ])

    const completed = new Set(completedRecords.map((p) => p.lessonId))

    const minicursos: MiniCourse[] = minisRaw.map((c) => {
      const lessons = c.modules.flatMap((m) => m.lessons)
      const done = lessons.filter((l) => completed.has(l.id)).length
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        slug: c.slug,
        lessons: lessons.length,
        progress: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
      }
    })

    return <MinicursosView minicursos={minicursos} />
  } catch (err) {
    console.error('[app/minicursos] falha ao carregar minicursos:', err)
    return <MinicursosView minicursos={[]} />
  }
}
