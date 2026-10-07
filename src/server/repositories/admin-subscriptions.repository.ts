import { prisma } from '@/lib/prisma'
import type { PlanName, SubscriptionStatus } from '@prisma/client'

export async function listAllSubscriptions() {
  // Contas ADMIN têm assinatura só para navegar no app — não são clientes.
  return prisma.subscription.findMany({
    where: { user: { role: { not: 'ADMIN' }, deletedAt: null } },
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true, priceMonthly: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function setSubscriptionStatus(id: string, status: SubscriptionStatus) {
  return prisma.subscription.update({
    where: { id },
    data: { status },
  })
}

export async function changeSubscriptionPlan(id: string, planName: PlanName) {
  const plan = await prisma.plan.findUnique({
    where: { name: planName },
    select: { id: true },
  })

  if (!plan) {
    throw new Error(`Plano não encontrado: ${planName}`)
  }

  return prisma.subscription.update({
    where: { id },
    data: { planId: plan.id },
  })
}

/**
 * Status para o qual uma assinatura volta ao ser reativada. Nunca vira ACTIVE
 * sem pagamento: com pagamento confirmado e vigência em dia → ACTIVE; ainda
 * dentro do teste grátis (sem pagamento) → TRIALING; senão → PAST_DUE
 * (aguardando pagamento).
 */
export async function statusOnReactivate(id: string): Promise<SubscriptionStatus> {
  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id },
    select: { userId: true, currentPeriodEnd: true },
  })
  const inPeriod = sub.currentPeriodEnd > new Date()
  if (!inPeriod) return 'PAST_DUE'
  const paid = await prisma.payment.count({
    where: { status: 'PAID', OR: [{ subscriptionId: id }, { userId: sub.userId }] },
  })
  return paid > 0 ? 'ACTIVE' : 'TRIALING'
}

/**
 * Registra um pagamento manual (Pix/transferência fora do gateway) e ativa a
 * assinatura por mais 1 mês a partir do fim da vigência atual (ou da data do
 * pagamento, se a vigência já venceu).
 */
export async function registerManualPayment(id: string, paidAt: Date) {
  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id },
    select: { userId: true, currentPeriodEnd: true, plan: { select: { name: true, priceMonthly: true } } },
  })
  const base = sub.currentPeriodEnd > paidAt ? sub.currentPeriodEnd : paidAt
  const nextEnd = new Date(base)
  nextEnd.setMonth(nextEnd.getMonth() + 1)

  return prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: sub.userId,
        subscriptionId: id,
        amount: sub.plan.priceMonthly,
        status: 'PAID',
        method: 'Manual (admin)',
        description: `Mensalidade ${sub.plan.name}`,
        paidAt,
      },
    }),
    prisma.subscription.update({
      where: { id },
      data: { status: 'ACTIVE', currentPeriodEnd: nextEnd },
    }),
  ])
}
