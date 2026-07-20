import type { SubscriptionStatus } from '@prisma/client'

export type WebhookIntent =
  | { kind: 'activate'; paymentId: string; extendDays: number }
  | { kind: 'status'; status: SubscriptionStatus }
  | { kind: 'ignore' }

export function interpretAsaasEvent(event: string): WebhookIntent {
  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      return { kind: 'activate', paymentId: '', extendDays: 31 }
    case 'PAYMENT_OVERDUE':
      return { kind: 'status', status: 'PAST_DUE' }
    case 'PAYMENT_REFUNDED':
    case 'SUBSCRIPTION_DELETED':
      return { kind: 'status', status: 'CANCELED' }
    default:
      return { kind: 'ignore' }
  }
}
