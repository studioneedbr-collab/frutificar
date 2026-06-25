import { prisma } from '@/lib/prisma'
import type { PlanName, SubscriptionStatus } from '@prisma/client'

export async function getSubscriptionByUser(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  })
}

export async function getPlanByName(name: PlanName) {
  return prisma.plan.findUnique({
    where: { name },
  })
}

export async function updateSubscription(
  userId: string,
  data: { planId?: string; status?: SubscriptionStatus; currentPeriodEnd?: Date },
) {
  return prisma.subscription.update({
    where: { userId },
    data,
  })
}
