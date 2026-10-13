import type { SubscriptionStatus } from '@prisma/client'

type SubLike = {
  status: SubscriptionStatus
  currentPeriodEnd: Date
  gatewaySubscriptionId?: string | null
}

/**
 * Regra única de acesso por assinatura — só entra quem pagou:
 * - ACTIVE com assinatura no Asaas → acesso; quem corta é o webhook
 *   (cobrança vencida → PAST_DUE).
 * - ACTIVE sem gateway (pagamento manual / cortesia do admin) → acesso até
 *   currentPeriodEnd.
 * - TRIALING (legado) → acesso até currentPeriodEnd.
 * - PENDING / PAST_DUE / CANCELED → sem acesso (vai para o checkout).
 */
export function subscriptionGrantsAccess(
  sub: SubLike | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false
  if (sub.status === 'ACTIVE') {
    if (sub.gatewaySubscriptionId) return true
    return sub.currentPeriodEnd > now
  }
  if (sub.status === 'TRIALING') return sub.currentPeriodEnd > now
  return false
}
