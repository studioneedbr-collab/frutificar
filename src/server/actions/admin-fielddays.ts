'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import * as fieldDaysRepository from '@/server/repositories/fielddays.repository'

const createFieldDaySchema = z.object({
  title: z.string().min(3, 'Título deve ter ao menos 3 caracteres'),
  location: z.string().min(2, 'Local deve ter ao menos 2 caracteres'),
  date: z.coerce.date(),
  instructor: z.string().min(2, 'Instrutor deve ter ao menos 2 caracteres'),
  description: z.string().default(''),
})

const updateFieldDaySchema = createFieldDaySchema.partial()

function revalidateFieldDays() {
  revalidatePath('/admin/dias-de-campo')
  revalidatePath('/dias-de-campo')
}

export async function createFieldDayAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = createFieldDaySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const fieldDay = await fieldDaysRepository.createFieldDay(parsed.data)
    revalidateFieldDays()
    return { ok: true, data: { id: fieldDay.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar dia de campo.' }
  }
}

export async function updateFieldDayAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = updateFieldDaySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    await fieldDaysRepository.updateFieldDay(id, parsed.data)
    revalidateFieldDays()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar dia de campo.' }
  }
}

export async function deleteFieldDayAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    await fieldDaysRepository.deleteFieldDay(id)
    revalidateFieldDays()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao excluir dia de campo.' }
  }
}
