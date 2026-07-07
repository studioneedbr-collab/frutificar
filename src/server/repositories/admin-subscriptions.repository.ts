import { prisma } from '@/lib/prisma'
import type { PlanName, SubscriptionStatus } from '@prisma/client'

export async function listAllSubscriptions() {
  return prisma.subscription.findMany({
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
