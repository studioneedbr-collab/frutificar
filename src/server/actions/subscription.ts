'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-types'

const changePlanSchema = z.object({
  plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']),
})

// Mudança de plano self-service está fora do escopo do v1 (exige checkout/repactuação
// no gateway). Mantido apenas para não quebrar imports existentes.
export async function changePlan(input: unknown): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = changePlanSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  return { ok: false, error: 'Para mudar de plano, entre em contato com o suporte.' }
}

// Reativação self-service está fora do escopo do v1 (exige um novo pagamento).
// Mantido apenas para não quebrar imports existentes.
export async function reactivateSubscription(): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  return { ok: false, error: 'Para reativar sua assinatura, finalize um novo pagamento.' }
}
