// Server Component: busca assinaturas reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em AssinaturasView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listAllSubscriptions } from '@/server/repositories/admin-subscriptions.repository'
import { mockSubscriptions, type Plan, type Status, type Sub } from './data'
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
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <AssinaturasView initialSubscriptions={mockSubscriptions} preview />
  }

  // Modo real: tenta o banco; em qualquer falha, cai no mock para não quebrar.
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

    return <AssinaturasView initialSubscriptions={subscriptions} preview={false} />
  } catch (err) {
    console.error('[admin/assinaturas] falha ao carregar assinaturas:', err)
    return <AssinaturasView initialSubscriptions={[]} preview={false} />
  }
}
