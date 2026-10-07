import type { PlanName } from '@prisma/client'
import { PLAN_FEATURES, ROUTE_FEATURE_MAP, type Feature } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { subscriptionGrantsAccess } from '@/lib/subscription-access'

export function canAccessFeature(plan: PlanName | null | undefined, feature: Feature): boolean {
  if (!plan) return false
  const features = PLAN_FEATURES[plan] as readonly string[]
  return features.includes(feature)
}

export function getRouteRequiredFeature(pathname: string): Feature | null {
  // Match exact path or prefix (e.g. /cursos/slug matches /cursos)
  const base = '/' + pathname.split('/')[1]
  return (ROUTE_FEATURE_MAP[base] as Feature | undefined) ?? null
}

export async function getUserActivePlan(userId: string): Promise<PlanName | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true, plan: { select: { name: true } } },
  })
  if (!subscription || !subscriptionGrantsAccess(subscription)) return null
  return subscription.plan.name
}
