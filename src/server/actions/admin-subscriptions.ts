'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { SubscriptionStatus } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as adminSubscriptionsRepository from '@/server/repositories/admin-subscriptions.repository'

// ─── Cancelar assinatura ──────────────────────────────────

export async function cancelSubscriptionAdmin(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminSubscriptionsRepository.setSubscriptionStatus(id, SubscriptionStatus.CANCELED)
    revalidatePath('/admin/assinaturas')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao cancelar assinatura.' }
  }
}

// ─── Reativar assinatura ──────────────────────────────────

export async function reactivateSubscriptionAdmin(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminSubscriptionsRepository.setSubscriptionStatus(id, SubscriptionStatus.ACTIVE)
    revalidatePath('/admin/assinaturas')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao reativar assinatura.' }
  }
}

// ─── Marcar como paga (de PAST_DUE) ───────────────────────

export async function markSubscriptionPaid(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await adminSubscriptionsRepository.setSubscriptionStatus(id, SubscriptionStatus.ACTIVE)
    revalidatePath('/admin/assinaturas')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao marcar assinatura como paga.' }
  }
}

// ─── Trocar plano da assinatura ───────────────────────────

const changePlanSchema = z.object({
  plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']),
})

export async function changeSubscriptionPlanAdmin(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = changePlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await adminSubscriptionsRepository.changeSubscriptionPlan(id, parsed.data.plan)
    revalidatePath('/admin/assinaturas')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao trocar plano da assinatura.' }
  }
}
