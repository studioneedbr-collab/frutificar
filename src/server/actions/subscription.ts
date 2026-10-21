'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { SubscriptionStatus, PlanName } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as subscriptionRepository from '@/server/repositories/subscription.repository'
import { statusOnReactivate } from '@/server/repositories/admin-subscriptions.repository'
import { cancelGatewaySubscription, updateGatewaySubscriptionPlan, requestUpgrade, CheckoutError } from '@/server/services/billing.service'
import { reportError } from '@/lib/alerts'
import { rateLimit, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'

const changePlanSchema = z.object({
  plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']),
})

export async function changePlan(input: unknown): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = changePlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const plan = await subscriptionRepository.getPlanByName(parsed.data.plan as PlanName)
    if (!plan) {
      return { ok: false, error: 'Plano não encontrado.' }
    }

    // Upgrade exige pagamento: o aluno não pode ir sozinho para um plano mais caro.
    const current = await subscriptionRepository.getSubscriptionByUser(session.user.id)
    if (!current) {
      return { ok: false, error: 'Você ainda não tem uma assinatura.' }
    }
    if (Number(plan.priceMonthly) > Number(current.plan.priceMonthly)) {
      return {
        ok: false,
        error: 'Para subir de plano use o botão de upgrade (cobra só a diferença).',
      }
    }

    await subscriptionRepository.updateSubscription(session.user.id, { planId: plan.id })
    // Próximas cobranças no Asaas com o valor do novo plano.
    await updateGatewaySubscriptionPlan(current.id)
    revalidatePath('/perfil/assinatura')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao alterar plano.' }
  }
}

export async function cancelSubscription(): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  try {
    const current = await subscriptionRepository.updateSubscription(session.user.id, {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    })
    // Para de gerar cobranças no Asaas.
    await cancelGatewaySubscription(current.id)
    revalidatePath('/perfil/assinatura')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao cancelar assinatura.' }
  }
}

export async function reactivateSubscription(): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  try {
    // Nunca volta para ACTIVE sem pagamento (ver statusOnReactivate).
    const current = await subscriptionRepository.getSubscriptionByUser(session.user.id)
    if (!current) {
      return { ok: false, error: 'Você ainda não tem uma assinatura.' }
    }
    const status = await statusOnReactivate(current.id)
    await subscriptionRepository.updateSubscription(session.user.id, { status, canceledAt: null })
    if (status === SubscriptionStatus.PENDING) {
      revalidatePath('/perfil/assinatura')
      return { ok: false, error: 'Assinatura reativada — conclua o pagamento em /checkout para liberar o acesso.' }
    }
    revalidatePath('/perfil/assinatura')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao reativar assinatura.' }
  }
}

const upgradeSchema = z.object({ plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']) })

/** Upgrade pelo aluno: cobra a diferença proporcional no Asaas. */
export async function upgradePlan(
  input: unknown,
): Promise<ActionResult<{ applied: true } | { applied: false; invoiceUrl: string; value: number }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }
  if (!rateLimit(`upgrade:${session.user.id}`, 5, 10 * 60_000)) return { ok: false, error: RATE_LIMIT_MESSAGE }

  const parsed = upgradeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Plano inválido.' }
  try {
    const res = await requestUpgrade(session.user.id, parsed.data.plan as PlanName)
    revalidatePath('/perfil/assinatura')
    return res.kind === 'applied'
      ? { ok: true, data: { applied: true } }
      : { ok: true, data: { applied: false, invoiceUrl: res.invoiceUrl, value: res.value } }
  } catch (err) {
    if (err instanceof CheckoutError) return { ok: false, error: err.message }
    await reportError('upgrade de plano', err)
    return { ok: false, error: 'Não foi possível gerar o upgrade agora. Tente novamente.' }
  }
}
