// Server Component: lê os valores reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A UI fica em DashboardView (client).
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listPropertiesByUser } from '@/server/repositories/properties.repository'
import { listLives } from '@/server/repositories/lives.repository'
import { mockDashboard, type DashboardData } from './data'
import { DashboardView, type DashboardReal, type DashboardCourse } from './dashboard-view'

const PLAN_LABEL: Record<string, string> = {
  ESSENCIAL: 'Essencial',
  PREMIUM: 'Premium',
  GOLD: 'Gold',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// 'Qua, 26 jun · 19h'
function formatWhen(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  const hora = m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} · ${hora}`
}

// Lives agendadas a partir de agora, da mais próxima para a mais distante.
function upcomingLives<T extends { status: string; scheduledAt: Date }>(lives: T[]): T[] {
  const now = Date.now()
  return lives
    .filter((l) => l.status === 'SCHEDULED' && l.scheduledAt.getTime() >= now)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
}

// Dados vazios (sem propriedade, sem live, sem progresso) — usados quando o banco falha.
const EMPTY_DATA: DashboardData = {
  propertyName: '',
  propertyLocation: '',
  plotsCount: 0,
  nextLiveTitle: '',
  nextLiveWhen: '',
}

const EMPTY_REAL: DashboardReal = {
  courses: [],
  lives: [],
  coursesInProgress: 0,
  lessonsDone: 0,
  hoursStudied: 0,
  diagnosticsCount: 0,
}

export default async function DashboardPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <DashboardView data={mockDashboard} user={{ firstName: 'Douglas', plan: 'Gold' }} preview />
  }

  // Modo real: exige sessão.
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id
  const user = {
    firstName: session.user.name?.trim().split(/\s+/)[0] ?? '',
    plan: session.user.plan ? PLAN_LABEL[session.user.plan] ?? session.user.plan : null,
  }

  let data: DashboardData = EMPTY_DATA
  let real: DashboardReal = EMPTY_REAL
  try {
    const [props, lives, courses, completedRecords, diagnosticsCount] = await Promise.all([
      listPropertiesByUser(userId),
      listLives(),
      prisma.course.findMany({
        where: { published: true, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        select: {
          title: true,
          slug: true,
          modules: { orderBy: { order: 'asc' }, select: { lessons: { select: { id: true } } } },
        },
      }),
      prisma.lessonProgress.findMany({
        where: { userId, completed: true },
        select: { lessonId: true, lesson: { select: { durationSec: true } } },
      }),
      prisma.soilAnalysis.count({ where: { plot: { property: { userId } } } }),
    ])

    const primary = props[0]
    const upcoming = upcomingLives(lives)
    const next = upcoming[0]

    data = {
      propertyName: primary?.name ?? '',
      propertyLocation: primary?.location ?? '',
      plotsCount: primary?.plots.length ?? 0,
      nextLiveTitle: next?.title ?? '',
      nextLiveWhen: next ? formatWhen(next.scheduledAt) : '',
    }

    // Progresso real por curso (aulas concluídas / total).
    const completed = new Set(completedRecords.map((p) => p.lessonId))
    const inProgress: DashboardCourse[] = []
    for (const c of courses) {
      const lessons = c.modules.flatMap((m) => m.lessons)
      const done = lessons.filter((l) => completed.has(l.id)).length
      if (!lessons.length || done === 0 || done >= lessons.length) continue
      inProgress.push({
        title: c.title,
        module: `${done} de ${lessons.length} aulas concluídas`,
        progress: Math.round((done / lessons.length) * 100),
        href: `/cursos/${c.slug}`,
      })
    }
    inProgress.sort((a, b) => b.progress - a.progress)

    const totalSec = completedRecords.reduce((acc, p) => acc + (p.lesson.durationSec ?? 0), 0)

    real = {
      courses: inProgress.slice(0, 3),
      lives: upcoming.slice(0, 2).map((l) => ({ title: l.title, when: formatWhen(l.scheduledAt) })),
      coursesInProgress: inProgress.length,
      lessonsDone: completedRecords.length,
      hoursStudied: Math.round(totalSec / 3600),
      diagnosticsCount,
    }

  } catch (err) {
    console.error('[dashboard] erro ao carregar do banco:', err)
    data = EMPTY_DATA
    real = EMPTY_REAL
  }
  return <DashboardView data={data} user={user} real={real} preview={false} />
}
