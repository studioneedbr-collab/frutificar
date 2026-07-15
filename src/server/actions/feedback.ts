'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import * as feedbackRepo from '@/server/repositories/feedback.repository'

const schema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  message: z.string().min(3, 'Escreva um pouco mais no seu feedback.').max(2000),
})

export async function submitFeedback(input: unknown): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  try {
    await feedbackRepo.createFeedback({
      userId: session.user.id,
      userName: session.user.name ?? 'Aluno',
      userEmail: session.user.email ?? '—',
      rating: parsed.data.rating ?? null,
      message: parsed.data.message,
    })
    revalidatePath('/admin/feedbacks')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao enviar feedback. Tente novamente.' }
  }
}
