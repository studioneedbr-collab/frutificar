'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { SubscriptionStatus, PlanName } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as subscriptionRepository from '@/server/repositories/subscription.repository'

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
    await subscriptionRepository.updateSubscription(session.user.id, {
      status: SubscriptionStatus.ACTIVE,
    })
    revalidatePath('/perfil/assinatura')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao reativar assinatura.' }
  }
}
