'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import * as plansRepository from '@/server/repositories/plans.repository'

const updatePlanSchema = z.object({
  priceMonthly: z.coerce.number().nonnegative().optional(),
  features: z.array(z.string()).optional(),
})

export async function updatePlanAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = updatePlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await plansRepository.updatePlan(id, parsed.data)
    revalidatePath('/admin/planos')
    revalidatePath('/planos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar plano.' }
  }
}

export async function togglePlanActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await plansRepository.setPlanActive(id, active)
    revalidatePath('/admin/planos')
    revalidatePath('/planos')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao alterar status do plano.' }
  }
}
