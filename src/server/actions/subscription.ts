'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { SubscriptionStatus, PlanName } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as subscriptionRepository from '@/server/repositories/subscription.repository'
import { statusOnReactivate } from '@/server/repositories/admin-subscriptions.repository'

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
        error: 'Para fazer upgrade é preciso confirmar o pagamento. Fale com a equipe Frutificar.',
      }
    }

    await subscriptionRepository.updateSubscription(session.user.id, { planId: plan.id })
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
    await subscriptionRepository.updateSubscription(session.user.id, {
      status: SubscriptionStatus.CANCELED,
    })
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
    await subscriptionRepository.updateSubscription(session.user.id, { status })
    if (status === SubscriptionStatus.PAST_DUE) {
      revalidatePath('/perfil/assinatura')
      return { ok: false, error: 'Assinatura reativada, mas aguardando pagamento para liberar o acesso.' }
    }
    revalidatePath('/perfil/assinatura')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao reativar assinatura.' }
  }
}
