// Server Component: busca solicitações reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em AdminDashboardView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import {
  listPendingVisits, listOpenServiceRequests,
  getDashboardStats, listRecentUsers, listRecentCourses,
} from '@/server/repositories/admin.repository'
import { mockSolicitations, type Solicitation } from './data'
import {
  AdminDashboardView, type DashboardUser, type DashboardCourse,
} from './admin-dashboard-view'

// Formata uma data em string curta (pt-BR) ou "há pouco" se muito recente.
function formatWhen(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  if (diffMs < 60 * 60 * 1000) return 'há pouco'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default async function AdminPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <AdminDashboardView initialSolicitations={mockSolicitations} preview />
  }

  // Modo real: busca tudo do banco em paralelo.
  // Em caso de erro, cai no mock para não quebrar a tela.
  try {
    const [visits, services, stats, users, courses] = await Promise.all([
      listPendingVisits(),
      listOpenServiceRequests(),
      getDashboardStats(),
      listRecentUsers(6),
      listRecentCourses(4),
    ])

    const solicitations: Solicitation[] = [
      ...visits.map((v): Solicitation => ({
        id: v.id,
        kind: 'visit',
        type: 'Visita técnica',
        user: v.user.name,
        detail: `${v.property?.name ?? '—'} · ${v.reason}`,
        when: formatWhen(v.requestedDate),
      })),
      ...services.map((s): Solicitation => ({
        id: s.id,
        kind: 'service',
        type: s.serviceType,
        user: s.user.name,
        detail: s.description,
        when: formatWhen(s.createdAt),
      })),
    ]

    const recentUsers: DashboardUser[] = users.map((u) => ({
      name: u.name,
      email: u.email,
      plan: u.subscription?.plan?.name ?? '—',
      status: u.subscription?.status ?? 'CANCELED',
      joined: u.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    }))

    const recentCourses: DashboardCourse[] = courses.map((c) => ({
      title: c.title,
      lessons: c.lessons,
      enrolled: c.enrolled,
      published: c.published,
    }))

    return (
      <AdminDashboardView
        initialSolicitations={solicitations}
        preview={false}
        metrics={stats}
        recentUsers={recentUsers}
        recentCourses={recentCourses}
      />
    )
  } catch {
    return <AdminDashboardView initialSolicitations={mockSolicitations} preview={false} />
  }
}
