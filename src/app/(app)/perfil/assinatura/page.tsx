// Server Component: busca a assinatura real (Supabase). A interatividade fica
// em AssinaturaView (client).
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSubscriptionByUser } from '@/server/repositories/subscription.repository'
import { listPaymentsByUser } from '@/server/repositories/payments.repository'
import { AssinaturaView, type PaymentRow, type SubStatus } from './assinatura-view'

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

  // Sem sessão → login (nunca dados fake).
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
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
      hasSubscription
      bloqueado={bloqueado}
    />
  )
}
