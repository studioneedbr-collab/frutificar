// Server Component: busca a assinatura real (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em AssinaturaView (client).
// Histórico de pagamentos + forma de pagamento permanecem mock (sem tabela no schema).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { getSubscriptionByUser } from '@/server/repositories/subscription.repository'
import { listPaymentsByUser } from '@/server/repositories/payments.repository'
import { AssinaturaView } from './assinatura-view'

// Valores mock usados no modo demo e como fallback quando não há assinatura.
const MOCK = {
  initialPlan: 'Gold',
  initialPrice: 'R$ 197',
  initialStatus: 'Ativo' as const,
  initialPeriodEnd: '12 jul 2026',
}

// Histórico de pagamentos mock — usado no modo demo, sem sessão ou quando não há pagamentos reais.
const MOCK_PAYMENTS = [
  { date: '12 jun 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00' },
  { date: '12 mai 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00' },
  { date: '12 abr 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00' },
  { date: '12 mar 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00' },
  { date: '12 fev 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00' },
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

export default async function AssinaturaPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <AssinaturaView {...MOCK} initialPayments={MOCK_PAYMENTS} preview />
  }

  // Modo real: exige sessão; sem ela, cai no mock para não quebrar.
  const session = await auth()
  if (!session?.user?.id) {
    return <AssinaturaView {...MOCK} initialPayments={MOCK_PAYMENTS} preview />
  }

  // Histórico real de pagamentos; cai no mock quando ainda não há registros.
  const rows = await listPaymentsByUser(session.user.id)
  const payments = rows.length
    ? rows.map((p) => ({
        date: p.paidAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        desc: p.description ?? 'Plano — Mensal',
        value: `R$ ${Number(p.amount).toFixed(2).replace('.', ',')}`,
      }))
    : MOCK_PAYMENTS

  const sub = await getSubscriptionByUser(session.user.id)
  if (!sub) {
    return <AssinaturaView {...MOCK} initialPayments={payments} preview={false} />
  }

  return (
    <AssinaturaView
      initialPlan={capitalizePlan(sub.plan.name)}
      initialPrice={`R$ ${Number(sub.plan.priceMonthly)}`}
      initialStatus={sub.status === 'CANCELED' ? 'Cancelado' : 'Ativo'}
      initialPeriodEnd={formatPeriodEnd(sub.currentPeriodEnd)}
      initialPayments={payments}
      preview={false}
    />
  )
}
