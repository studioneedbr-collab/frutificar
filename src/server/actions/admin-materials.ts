'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromStorage } from '@/lib/storage'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { PlanName } from '@prisma/client'
import type { ActionResult } from '@/lib/action-types'
import * as materialsRepository from '@/server/repositories/materials.repository'

const createResourceSchema = z.object({
  title: z.string().min(2, 'Título deve ter ao menos 2 caracteres'),
  category: z.string().min(2, 'Categoria deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  // Só links http(s) — nada de javascript:/data: em href.
  fileUrl: z.string().trim().max(2000).regex(/^https?:\/\//i, 'Link inválido (use http/https).').optional().or(z.literal('')),
  requiredPlan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']).optional(),
})

const updateResourceSchema = createResourceSchema.partial()

export async function createResourceAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = createResourceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const resource = await materialsRepository.createResource({
      title: parsed.data.title,
      category: parsed.data.category,
      description: parsed.data.description,
      fileUrl: parsed.data.fileUrl,
      requiredPlan: parsed.data.requiredPlan as PlanName | undefined,
    })
    revalidatePath('/admin/materiais')
    return { ok: true, data: { id: resource.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar material.' }
  }
}

export async function updateResourceAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const parsed = updateResourceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const before = await prisma.downloadableResource.findUnique({ where: { id }, select: { fileUrl: true } })
    await materialsRepository.updateResource(id, {
      ...parsed.data,
      requiredPlan: parsed.data.requiredPlan as PlanName | undefined,
    })
    // Arquivo trocado: apaga o antigo do Storage.
    if (parsed.data.fileUrl !== undefined && before?.fileUrl && before.fileUrl !== parsed.data.fileUrl) {
      await deleteFromStorage(before.fileUrl)
    }
    revalidatePath('/admin/materiais')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao atualizar material.' }
  }
}

export async function deleteResourceAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  try {
    const removed = await materialsRepository.deleteResource(id)
    await deleteFromStorage(removed.fileUrl)
    revalidatePath('/admin/materiais')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao excluir material.' }
  }
}
