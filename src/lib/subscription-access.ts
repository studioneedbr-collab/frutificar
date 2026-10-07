import type { SubscriptionStatus } from '@prisma/client'

/**
 * Regra única de acesso por assinatura:
 * - ACTIVE   → paga (ou concedida pelo admin): tem acesso.
 * - TRIALING → teste grátis: acesso só até currentPeriodEnd.
 * - PAST_DUE / CANCELED → sem acesso.
 */
export function subscriptionGrantsAccess(
  sub: { status: SubscriptionStatus; currentPeriodEnd: Date } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false
  if (sub.status === 'ACTIVE') return true
  if (sub.status === 'TRIALING') return sub.currentPeriodEnd > now
  return false
}
