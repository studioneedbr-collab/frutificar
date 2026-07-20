import { env } from '@/env'
import { interpretAsaasEvent } from '@/lib/asaas-webhook'
import * as billing from '@/server/repositories/billing.repository'

export async function POST(request: Request) {
  const token = request.headers.get('asaas-access-token')
  if (env.ASAAS_WEBHOOK_TOKEN && token !== env.ASAAS_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const event = body?.event as string | undefined
  const payment = body?.payment as { id: string; subscription?: string; value: number; billingType: string } | undefined
  if (!event) return new Response('ok', { status: 200 })

  const intent = interpretAsaasEvent(event)
  if (intent.kind === 'ignore' || !payment?.subscription) return new Response('ok', { status: 200 })

  const sub = await billing.getSubscriptionByGatewaySub(payment.subscription)
  if (!sub) return new Response('ok', { status: 200 })

  try {
    if (intent.kind === 'activate') {
      await billing.recordPaymentAndActivate({
        gatewayPaymentId: payment.id, userId: sub.userId, subscriptionId: sub.id,
        amount: payment.value, method: payment.billingType, status: 'ACTIVE',
        periodEnd: new Date(Date.now() + intent.extendDays * 864e5),
      })
    } else if (intent.kind === 'status') {
      await billing.markSubscriptionStatus(sub.id, intent.status)
    }
  } catch (e) {
    console.error('[asaas webhook]', e)
    return new Response('error', { status: 500 })
  }
  return new Response('ok', { status: 200 })
}
