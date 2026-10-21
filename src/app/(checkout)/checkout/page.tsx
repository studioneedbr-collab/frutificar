// Checkout: o aluno escolhe plano + forma de pagamento e paga via Asaas.
// Sem pagamento confirmado o proxy manda todo aluno para cá.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { PlanName } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subscriptionGrantsAccess } from '@/lib/subscription-access'
import { getOpenCharge, syncUserSubscription, type OpenCharge } from '@/server/services/billing.service'
import { CheckoutView, type CheckoutPlan } from './checkout-view'

const PLAN_ORDER: PlanName[] = ['ESSENCIAL', 'PREMIUM', 'GOLD']

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'STUDENT') redirect(session.user.role === 'ADMIN' ? '/admin' : '/dashboard')

  const userId = session.user.id

  // Pode ter pago fora daqui (boleto, fatura por e-mail): sincroniza antes.
  try {
    await syncUserSubscription(userId)
  } catch (err) {
    console.error('[checkout] falha ao sincronizar com o Asaas:', err)
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: { select: { name: true } } },
  })
  if (subscriptionGrantsAccess(sub)) redirect('/dashboard')

  const plansDb = await prisma.plan.findMany()
  const plans: CheckoutPlan[] = PLAN_ORDER.flatMap((name) => {
    const p = plansDb.find((x) => x.name === name)
    if (!p) return []
    const features = Array.isArray(p.features) ? (p.features as string[]) : []
    const price = Number(p.priceMonthly)
    return [{ name, price, yearly: p.priceYearly != null ? Number(p.priceYearly) : price * 10, features }]
  })

  const { plano } = await searchParams
  const wanted = plano?.toUpperCase() as PlanName | undefined
  const initialPlan: PlanName =
    wanted && PLAN_ORDER.includes(wanted) ? wanted : (sub?.plan.name ?? 'ESSENCIAL')

  let initialCharge: OpenCharge | null = null
  try {
    initialCharge = await getOpenCharge(userId)
  } catch (err) {
    console.error('[checkout] falha ao buscar cobrança em aberto:', err)
  }

  return (
    <CheckoutView
      userName={session.user.name ?? ''}
      plans={plans}
      initialPlan={initialPlan}
      needsCpf={!sub?.gatewayCustomerId}
      status={sub?.status ?? 'PENDING'}
      initialCharge={initialCharge}
    />
  )
}
