import { timingSafeEqual } from 'crypto'
import { env } from '@/env'
import { interpretAsaasEvent } from '@/lib/asaas-webhook'
import * as billing from '@/server/repositories/billing.repository'

// Comparação de tokens em tempo constante (evita timing attack). Só compara
// buffers de mesmo tamanho — tamanhos diferentes já falham cedo.
function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export async function POST(request: Request) {
  const token = request.headers.get('asaas-access-token')
  if (!env.ASAAS_WEBHOOK_TOKEN || !token || !tokensMatch(token, env.ASAAS_WEBHOOK_TOKEN)) {
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
      const planPrice = Number(sub.plan.priceMonthly)
      if (typeof payment.value === 'number' && payment.value + 0.01 < planPrice) {
        console.warn('[asaas webhook] valor abaixo do plano, ativação ignorada', { paymentId: payment.id, value: payment.value, planPrice })
        return new Response('ok', { status: 200 })
      }
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
