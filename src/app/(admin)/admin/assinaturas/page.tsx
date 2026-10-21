// Server Component: busca assinaturas reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em AssinaturasView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { cyclePrice, monthlyValue } from '@/lib/revenue'
import { listAllSubscriptions } from '@/server/repositories/admin-subscriptions.repository'
import { mockSubscriptions, type Plan, type Status, type Sub } from './data'
import { AssinaturasView } from './assinaturas-view'

// Valor cobrado por ciclo, no estilo "R$ 197" (centavos só quando houver).
function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 2,
  })
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

  // Modo real: tenta o banco; em qualquer falha, lista vazia (nunca mock) + log.
  let subscriptions: Sub[] = []
  try {
    const rows = await listAllSubscriptions()
    subscriptions = rows.map((s) => {
      const plan = s.plan.name as Plan
      const status = s.status as Status
      return {
        id: s.id,
        name: s.user.name ?? '—',
        email: s.user.email ?? '—',
        plan,
        // Preço cheio do ciclo (mensal: /mês; anual: /ano).
        value: fmtBRL(cyclePrice(s)),
        cycle: s.billingCycle,
        status,
        renewal: status === 'CANCELED' ? '—' : fmtDate(s.currentPeriodEnd),
        gateway: s.gatewaySubscriptionId ?? '—',
        // Valor mensal recorrente (anual ÷ 12, cupom FOREVER aplicado) — base do MRR.
        price: monthlyValue(s),
      }
    })
  } catch (err) {
    // Nunca mostrar mock em produção: lista vazia + log para investigar.
    console.error('[admin/assinaturas] erro ao carregar do banco:', err)
    subscriptions = []
  }
  return <AssinaturasView initialSubscriptions={subscriptions} preview={false} />
}
