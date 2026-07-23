import type { PlanName } from '@prisma/client'
import { PLAN_FEATURES, ROUTE_FEATURE_MAP, type Feature } from '@/lib/constants'
import { prisma } from '@/lib/prisma'

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
    select: { status: true, plan: { select: { name: true } } },
  })
  if (!subscription || subscription.status !== 'ACTIVE') return null
  return subscription.plan.name
}

/**
 * Checagem de entitlement no servidor (defesa em profundidade). O proxy
 * (src/proxy.ts) só protege a NAVEGAÇÃO; mutações via Server Action precisam
 * revalidar o plano por conta própria — senão um usuário de plano inferior
 * consegue disparar a action a partir de uma página que ele pode acessar.
 */
export async function userHasFeature(userId: string, feature: Feature): Promise<boolean> {
  const plan = await getUserActivePlan(userId)
  return canAccessFeature(plan, feature)
}
