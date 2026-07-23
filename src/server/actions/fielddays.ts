'use server'

import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import { userHasFeature } from '@/lib/access-control'
import * as fieldDaysRepository from '@/server/repositories/fielddays.repository'

/**
 * Registra (ou remove) o interesse do aluno num Dia de Campo. Grava de verdade
 * no banco — a inscrição aparece no admin como contagem de inscritos.
 * Recurso exclusivo do plano Gold (feature 'field_days').
 */
export async function toggleFieldDayInterest(
  fieldDayId: string,
  interested: boolean,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }

  if (!(await userHasFeature(session.user.id, 'field_days'))) {
    return { ok: false, error: 'Dias de Campo é exclusivo do plano Gold.' }
  }

  if (!fieldDayId || typeof fieldDayId !== 'string') {
    return { ok: false, error: 'Evento inválido.' }
  }

  try {
    if (interested) {
      await fieldDaysRepository.registerInterest(session.user.id, fieldDayId)
    } else {
      await fieldDaysRepository.unregisterInterest(session.user.id, fieldDayId)
    }
    revalidatePath('/dias-de-campo')
    revalidatePath('/admin/dias-de-campo')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao registrar interesse.' }
  }
}
