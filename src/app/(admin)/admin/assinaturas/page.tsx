// Server Component: busca assinaturas reais (Supabase). A interatividade fica
// em AssinaturasView (client).
export const dynamic = 'force-dynamic'

import { listAllSubscriptions } from '@/server/repositories/admin-subscriptions.repository'
import type { Plan, Status, Sub } from './data'
import { AssinaturasView } from './assinaturas-view'

const planValue: Record<Plan, string> = {
  GOLD: 'R$ 197',
  PREMIUM: 'R$ 97',
  ESSENCIAL: 'R$ 47',
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(d)
    .replace('.', '')
}

export default async function AdminAssinaturasPage() {
  // Tenta o banco; em qualquer falha, renderiza a view com lista vazia (sem dados falsos).
  try {
    const rows = await listAllSubscriptions()
    const subscriptions: Sub[] = rows.map((s) => {
      const plan = s.plan.name as Plan
      const status =
        s.status === 'ACTIVE' ? ('ACTIVE' as Status)
        : s.status === 'PAST_DUE' ? ('PAST_DUE' as Status)
        : ('CANCELED' as Status)
      return {
        id: s.id,
        name: s.user.name ?? '—',
        email: s.user.email ?? '—',
        plan,
        value: planValue[plan] ?? `R$ ${Number(s.plan.priceMonthly)}`,
        status,
        renewal: status === 'CANCELED' ? '—' : fmtDate(s.currentPeriodEnd),
        gateway: s.gatewaySubscriptionId ?? '—',
      }
    })

    return <AssinaturasView initialSubscriptions={subscriptions} />
  } catch (err) {
    console.error('[admin/assinaturas] falha ao carregar assinaturas:', err)
    return <AssinaturasView initialSubscriptions={[]} />
  }
}
