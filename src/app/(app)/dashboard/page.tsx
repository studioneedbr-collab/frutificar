// Server Component: lê alguns valores reais (Supabase). A UI fica em DashboardView (client).
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { listPropertiesByUser } from '@/server/repositories/properties.repository'
import { listLives } from '@/server/repositories/lives.repository'
import { mockDashboard, type DashboardData } from './data'
import { DashboardView } from './dashboard-view'

export default async function DashboardPage() {
  // Exige sessão; sem ela, mostra estado vazio.
  const session = await auth()
  if (!session?.user?.id) {
    return (
      <DashboardView
        data={{ propertyName: '—', propertyLocation: '—', plotsCount: 0, nextLiveTitle: '—', nextLiveWhen: '—' }}
      />
    )
  }

  try {
    const props = await listPropertiesByUser(session.user.id)
    const primary = props[0]

    const lives = await listLives()
    const next = lives.find((l) => l.status === 'SCHEDULED')

    const data: DashboardData = {
      propertyName: primary?.name ?? mockDashboard.propertyName,
      propertyLocation: primary?.location ?? mockDashboard.propertyLocation,
      plotsCount: primary?.plots.length ?? 0,
      nextLiveTitle: next?.title ?? mockDashboard.nextLiveTitle,
      nextLiveWhen: next
        ? next.scheduledAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        : mockDashboard.nextLiveWhen,
    }

    return <DashboardView data={data} />
  } catch (err) {
    console.error('[app/dashboard] falha ao carregar dashboard:', err)
    return (
      <DashboardView
        data={{ propertyName: '—', propertyLocation: '—', plotsCount: 0, nextLiveTitle: '—', nextLiveWhen: '—' }}
      />
    )
  }
}
