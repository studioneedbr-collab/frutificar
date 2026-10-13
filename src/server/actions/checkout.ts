'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subscriptionGrantsAccess } from '@/lib/subscription-access'
import { AsaasError } from '@/lib/asaas'
import type { ActionResult } from '@/lib/action-types'
import {
  startCheckout,
  syncUserSubscription,
  CheckoutError,
  type OpenCharge,
} from '@/server/services/billing.service'

const checkoutSchema = z.object({
  plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']),
  method: z.enum(['PIX', 'CREDIT_CARD', 'BOLETO']),
  cpfCnpj: z.string().trim().max(20).optional(),
})

export async function createCheckout(input: unknown): Promise<ActionResult<OpenCharge>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Faça login para continuar.' }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const charge = await startCheckout(session.user.id, {
      plan: parsed.data.plan,
      method: parsed.data.method,
      cpfCnpj: parsed.data.cpfCnpj || undefined,
    })
    return { ok: true, data: charge }
  } catch (err) {
    if (err instanceof CheckoutError) return { ok: false, error: err.message }
    console.error('[createCheckout]', err)
    if (err instanceof AsaasError && err.status < 500) {
      // Mensagens do Asaas já vêm em português (ex.: CPF inválido).
      return { ok: false, error: err.message }
    }
    return { ok: false, error: 'Não foi possível gerar o pagamento agora. Tente novamente em instantes.' }
  }
}

/** Consultado pelo checkout enquanto o aluno paga (Pix/cartão/boleto). */
export async function checkCheckoutStatus(): Promise<ActionResult<{ active: boolean }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Sessão expirada.' }

  try {
    // Fallback do webhook: puxa o status direto do Asaas.
    await syncUserSubscription(session.user.id)
  } catch (err) {
    console.error('[checkCheckoutStatus] falha ao sincronizar com o Asaas:', err)
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { status: true, currentPeriodEnd: true, gatewaySubscriptionId: true },
  })
  return { ok: true, data: { active: subscriptionGrantsAccess(sub) } }
}
