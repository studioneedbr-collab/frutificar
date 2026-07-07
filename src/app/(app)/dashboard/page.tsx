// Server Component: lê alguns valores reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A UI fica em DashboardView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { listPropertiesByUser } from '@/server/repositories/properties.repository'
import { listLives } from '@/server/repositories/lives.repository'
import { mockDashboard, type DashboardData } from './data'
import { DashboardView } from './dashboard-view'

export default async function DashboardPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <DashboardView data={mockDashboard} />
  }

  // Modo real: exige sessão; sem ela, cai no mock para não quebrar.
  const session = await auth()
  if (!session?.user?.id) {
    return <DashboardView data={mockDashboard} />
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
  } catch {
    return <DashboardView data={mockDashboard} />
  }
}
