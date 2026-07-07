import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function listPlans() {
  return prisma.plan.findMany({
    orderBy: { priceMonthly: 'asc' },
  })
}

export async function updatePlan(
  id: string,
  data: { priceMonthly?: number; features?: string[]; active?: boolean },
) {
  const updateData: Prisma.PlanUpdateInput = {}

  if (data.priceMonthly !== undefined) updateData.priceMonthly = data.priceMonthly
  if (data.features !== undefined) updateData.features = data.features
  if (data.active !== undefined) updateData.active = data.active

  return prisma.plan.update({
    where: { id },
    data: updateData,
  })
}

export async function setPlanActive(id: string, active: boolean) {
  return prisma.plan.update({
    where: { id },
    data: { active },
  })
}
