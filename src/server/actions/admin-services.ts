'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import * as services from '@/server/repositories/services.repository'

async function requireAdmin() {
  const session = await auth()
  return session && session.user.role === 'ADMIN' ? session : null
}

const schema = z.object({
  name: z.string().min(2, 'Informe o nome do serviço'),
  description: z.string().min(3, 'Informe uma descrição'),
  type: z.enum(['INCLUDED', 'AVULSO']),
  price: z.coerce.number().min(0).max(1_000_000),
  active: z.boolean().optional().default(true),
})

function revalidate() {
  revalidatePath('/admin/servicos')
  revalidatePath('/servicos')
}

export async function createServiceAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  try {
    const s = await services.createService({
      name: parsed.data.name,
      description: parsed.data.description,
      type: parsed.data.type,
      price: parsed.data.type === 'INCLUDED' ? 0 : parsed.data.price,
      active: parsed.data.active,
    })
    revalidate()
    return { ok: true, data: { id: s.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar serviço.' }
  }
}

export async function updateServiceAction(id: string, input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  const parsed = schema.partial().safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  try {
    const d = parsed.data
    await services.updateService(id, {
      name: d.name, description: d.description, type: d.type, active: d.active,
      price: d.type === 'INCLUDED' ? 0 : d.price,
    })
    revalidate()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar serviço.' }
  }
}

export async function toggleServiceActiveAction(id: string, active: boolean): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  try {
    await services.updateService(id, { active })
    revalidate()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao alterar status.' }
  }
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: 'Acesso negado.' }
  try {
    await services.deleteService(id)
    revalidate()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover serviço.' }
  }
}
