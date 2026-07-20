// Server Component: busca a assinatura real (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em AssinaturaView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { getSubscriptionByUser } from '@/server/repositories/subscription.repository'
import { listPaymentsByUser } from '@/server/repositories/payments.repository'
import { AssinaturaView, type PaymentRow, type SubStatus } from './assinatura-view'

// Valores mock usados no modo demo (sem banco/sessão).
const MOCK = {
  initialPlan: 'Gold',
  initialPrice: 'R$ 197,00',
  initialStatus: 'ACTIVE' as SubStatus,
  initialPeriodEnd: '12 jul 2026',
  hasSubscription: true,
}

// Histórico de pagamentos mock — usado apenas no modo demo.
const MOCK_PAYMENTS: PaymentRow[] = [
  { date: '12 jun 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00', method: 'Cartão de crédito', status: 'PAID' },
  { date: '12 mai 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00', method: 'Cartão de crédito', status: 'PAID' },
  { date: '12 abr 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00', method: 'Cartão de crédito', status: 'PAID' },
  { date: '12 mar 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00', method: 'Cartão de crédito', status: 'PAID' },
  { date: '12 fev 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00', method: 'Cartão de crédito', status: 'PAID' },
]

function capitalizePlan(name: string): string {
  if (name === 'ESSENCIAL') return 'Essencial'
  if (name === 'PREMIUM') return 'Premium'
  if (name === 'GOLD') return 'Gold'
  return name
}

function formatPeriodEnd(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueado?: string }>
}) {
  const { bloqueado } = await searchParams

  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <AssinaturaView {...MOCK} initialPayments={MOCK_PAYMENTS} preview bloqueado={bloqueado} />
  }

  // Modo real: exige sessão; sem ela, cai no mock para não quebrar.
  const session = await auth()
  if (!session?.user?.id) {
    return <AssinaturaView {...MOCK} initialPayments={MOCK_PAYMENTS} preview bloqueado={bloqueado} />
  }

  const [sub, rows] = await Promise.all([
    getSubscriptionByUser(session.user.id),
    listPaymentsByUser(session.user.id),
  ])

  const payments: PaymentRow[] = rows.map((p) => ({
    date: p.paidAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    desc: p.description ?? 'Assinatura — Mensal',
    value: formatBRL(Number(p.amount)),
    method: p.method,
    status: p.status,
  }))

  if (!sub) {
    return (
      <AssinaturaView
        initialPlan="—"
        initialPrice="—"
        initialStatus="NONE"
        initialPeriodEnd="—"
        initialPayments={payments}
        preview={false}
        hasSubscription={false}
        bloqueado={bloqueado}
      />
    )
  }

  return (
    <AssinaturaView
      initialPlan={capitalizePlan(sub.plan.name)}
      initialPrice={formatBRL(Number(sub.plan.priceMonthly))}
      initialStatus={sub.status}
      initialPeriodEnd={formatPeriodEnd(sub.currentPeriodEnd)}
      initialPayments={payments}
      preview={false}
      hasSubscription
      bloqueado={bloqueado}
    />
  )
}
