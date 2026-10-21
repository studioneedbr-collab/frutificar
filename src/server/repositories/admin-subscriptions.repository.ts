import { prisma } from '@/lib/prisma'
import { chargeFor, applyCoupon, planLabel } from '@/server/services/billing.service'
import type { PlanName, SubscriptionStatus } from '@prisma/client'

export async function listAllSubscriptions() {
  // Contas ADMIN têm assinatura só para navegar no app — não são clientes.
  return prisma.subscription.findMany({
    where: { user: { role: { not: 'ADMIN' }, deletedAt: null } },
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true, priceMonthly: true, priceYearly: true } },
      // Só o necessário para o MRR (src/lib/revenue.ts).
      coupon: { select: { percentOff: true, amountOff: true, duration: true } },
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
 * sem pagamento: com pagamento confirmado e vigência em dia → ACTIVE; senão →
 * PENDING (o aluno cai no checkout para pagar).
 */
export async function statusOnReactivate(id: string): Promise<SubscriptionStatus> {
  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id },
    select: { userId: true, currentPeriodEnd: true },
  })
  if (sub.currentPeriodEnd <= new Date()) return 'PENDING'
  const paid = await prisma.payment.count({
    where: { status: 'PAID', OR: [{ subscriptionId: id }, { userId: sub.userId }] },
  })
  return paid > 0 ? 'ACTIVE' : 'PENDING'
}

/**
 * Registra um pagamento manual (Pix/transferência fora do gateway) e ativa a
 * assinatura por mais 1 mês a partir do fim da vigência atual (ou da data do
 * pagamento, se a vigência já venceu).
 */
export async function registerManualPayment(id: string, paidAt: Date) {
  const sub = await prisma.subscription.findUniqueOrThrow({
    where: { id },
    select: {
      userId: true,
      currentPeriodEnd: true,
      billingCycle: true,
      plan: { select: { name: true, priceMonthly: true, priceYearly: true } },
      coupon: { select: { percentOff: true, amountOff: true, duration: true } },
    },
  })
  // Mesmo valor e vigência do checkout: ciclo anual = 12 meses; cupom
  // "em todas as cobranças" continua valendo.
  const full = chargeFor(sub.plan, sub.billingCycle)
  const amount = sub.coupon?.duration === 'FOREVER' ? applyCoupon(full, sub.coupon) : full
  const base = sub.currentPeriodEnd > paidAt ? sub.currentPeriodEnd : paidAt
  const nextEnd = new Date(base)
  if (sub.billingCycle === 'YEARLY') nextEnd.setFullYear(nextEnd.getFullYear() + 1)
  else nextEnd.setMonth(nextEnd.getMonth() + 1)

  return prisma.$transaction([
    prisma.payment.create({
      data: {
        userId: sub.userId,
        subscriptionId: id,
        amount,
        status: 'PAID',
        method: 'Manual (admin)',
        description: `${sub.billingCycle === 'YEARLY' ? 'Anuidade' : 'Mensalidade'} ${planLabel(sub.plan.name)}`,
        paidAt,
      },
    }),
    prisma.subscription.update({
      where: { id },
      data: { status: 'ACTIVE', currentPeriodEnd: nextEnd, canceledAt: null },
    }),
  ])
}
