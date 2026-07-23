// Server Component: monta a lista de cursos a partir do banco quando PREVIEW_MODE=false.
// O curso PRINCIPAL vira a trilha em destaque (com accordion de módulos/aulas) e os
// MINICOURSE viram cards. Cada aula leva ao player /cursos/[slug]/[lessonId].
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PREVIEW_MODE } from '@/lib/preview'
import { mockData, type CoursesData, type ModuleRow, type MiniRow } from './data'
import { CursosView } from './cursos-view'

function minutes(totalSec: number): string {
  if (!totalSec) return ''
  return `${Math.max(1, Math.round(totalSec / 60))}min`
}

export default async function CursosPage() {
  if (PREVIEW_MODE) {
    return <CursosView data={mockData} />
  }

  try {
    const session = await auth()

    const [principal, minisRaw, completedRecords] = await Promise.all([
      prisma.course.findFirst({
        where: { published: true, deletedAt: null, type: 'PRINCIPAL' },
        include: {
          instructor: { select: { name: true } },
          modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } },
        },
      }),
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

    let modules: ModuleRow[] = []
    let mainData: CoursesData['main'] = null

    if (principal) {
      const allLessons = principal.modules.flatMap((m) => m.lessons)
      const totalLessons = allLessons.length
      const totalDone = allLessons.filter((l) => completed.has(l.id)).length

      modules = principal.modules.map((m, i) => {
        const done = m.lessons.filter((l) => completed.has(l.id)).length
        const secTotal = m.lessons.reduce((acc, l) => acc + (l.durationSec ?? 0), 0)
        return {
          n: i + 1,
          title: m.title,
          lessonsCount: m.lessons.length,
          duration: minutes(secTotal),
          progress: m.lessons.length ? Math.round((done / m.lessons.length) * 100) : 0,
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            duration: minutes(l.durationSec ?? 0),
            done: completed.has(l.id),
            href: `/cursos/${principal.slug}/${l.id}`,
          })),
        }
      })

      const firstIncomplete = allLessons.find((l) => !completed.has(l.id))
      const continueLesson = firstIncomplete ?? allLessons[0] ?? null

      mainData = {
        title: principal.title,
        instrutor: principal.instructor?.name ?? '',
        overall: totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0,
        modulesCount: principal.modules.length,
        lessonsCount: totalLessons,
        continueHref: continueLesson ? `/cursos/${principal.slug}/${continueLesson.id}` : null,
        continueLabel: totalDone > 0 ? 'Continuar de onde parei' : 'Começar curso',
      }
    }

    const minis: MiniRow[] = minisRaw.map((c) => {
      const lessons = c.modules.flatMap((m) => m.lessons)
      const done = lessons.filter((l) => completed.has(l.id)).length
      return {
        title: c.title,
        lessons: lessons.length,
        duration: '',
        progress: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
        href: `/cursos/${c.slug}`,
      }
    })

    return <CursosView data={{ main: mainData, modules, minis }} />
  } catch (err) {
    console.error('[app/cursos] falha ao carregar cursos:', err)
    return <CursosView data={{ main: null, modules: [], minis: [] }} />
  }
}
