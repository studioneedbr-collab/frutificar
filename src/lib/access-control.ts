import type { PlanName } from '@prisma/client'
import { PLAN_FEATURES, ROUTE_FEATURE_MAP, type Feature } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
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
    select: { status: true, currentPeriodEnd: true, gatewaySubscriptionId: true, plan: { select: { name: true } } },
  })
  if (!subscription || !subscriptionGrantsAccess(subscription)) return null
  return subscription.plan.name
}

/**
 * Para usar dentro de Server Actions e rotas de API (que não passam pela
 * checagem de plano do proxy): exige sessão e o recurso no plano ativo.
 * Admin e instrutor passam sem plano.
 */
export async function requireFeature(
  feature: Feature,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }
  if (session.user.role !== 'STUDENT') return { ok: true, userId: session.user.id }
  // Confere no banco (não confia só no JWT em cache).
  const plan = await getUserActivePlan(session.user.id)
  if (!canAccessFeature(plan, feature)) {
    return { ok: false, error: 'Seu plano não inclui este recurso.' }
  }
  return { ok: true, userId: session.user.id }
}
