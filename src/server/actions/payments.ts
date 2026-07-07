'use server'

import { auth } from '@/lib/auth'
import type { ActionResult } from '@/lib/action-types'
import * as paymentsRepository from '@/server/repositories/payments.repository'

type PaymentList = Awaited<ReturnType<typeof paymentsRepository.listPaymentsByUser>>

export async function listMyPayments(): Promise<ActionResult<PaymentList>> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  try {
    const payments = await paymentsRepository.listPaymentsByUser(session.user.id)
    return { ok: true, data: payments }
  } catch {
    return { ok: false, error: 'Erro ao listar pagamentos.' }
  }
}
