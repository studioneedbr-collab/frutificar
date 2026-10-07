'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { SubscriptionStatus, PlanName } from '@prisma/client'
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
    const status = await adminSubscriptionsRepository.statusOnReactivate(id)
    await adminSubscriptionsRepository.setSubscriptionStatus(id, status)
    revalidatePath('/admin/assinaturas')
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[reactivateSubscriptionAdmin]', err)
    return { ok: false, error: 'Erro ao reativar assinatura.' }
  }
}

// ─── Marcar como paga (pagamento manual) ──────────────────

const paidAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .or(z.literal(''))

export async function markSubscriptionPaid(id: string, paidAtIso?: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = paidAtSchema.safeParse(paidAtIso)
  if (!parsed.success) {
    return { ok: false, error: 'Data de pagamento inválida.' }
  }
  // Data escolhida (meio-dia, evita virar o dia por fuso) ou agora.
  const paidAt = parsed.data ? new Date(`${parsed.data}T12:00:00`) : new Date()
  if (paidAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return { ok: false, error: 'A data do pagamento não pode ser no futuro.' }
  }

  try {
    await adminSubscriptionsRepository.registerManualPayment(id, paidAt)
    revalidatePath('/admin/assinaturas')
    revalidatePath('/admin')
    return { ok: true, data: undefined }
  } catch (err) {
    console.error('[markSubscriptionPaid]', err)
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
