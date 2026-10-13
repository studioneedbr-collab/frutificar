// Webhook do Asaas: confirma/vence/estorna cobranças e ativa ou corta o acesso.
// O Asaas envia o token configurado no header "asaas-access-token".
import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import type { AsaasPayment } from '@/lib/asaas'
import { applyAsaasPayment, applyAsaasSubscriptionEnded } from '@/server/services/billing.service'

export const dynamic = 'force-dynamic'

function tokenOk(received: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN
  if (!expected || !received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

type WebhookBody = {
  id?: string
  event?: string
  payment?: AsaasPayment
  subscription?: { id: string }
}

export async function POST(req: Request) {
  if (!tokenOk(req.headers.get('asaas-access-token'))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: WebhookBody
  try {
    body = (await req.json()) as WebhookBody
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const event = body.event ?? ''
  try {
    if (event.startsWith('PAYMENT_') && body.payment) {
      await applyAsaasPayment(body.payment, event)
    } else if (
      (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_INACTIVATED') &&
      body.subscription?.id
    ) {
      await applyAsaasSubscriptionEnded(body.subscription.id)
    }
    // Eventos não tratados também respondem 200 para não travar a fila do Asaas.
    return NextResponse.json({ received: true })
  } catch (err) {
    // 500 faz o Asaas reenviar o evento depois.
    console.error('[webhook/asaas] erro ao processar', event, body.id, err)
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }
}
