'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import type { ActionResult } from '@/lib/action-types'
import { revalidatePath } from 'next/cache'
import * as propertiesRepository from '@/server/repositories/properties.repository'

const createPropertySchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  totalAreaHa: z.coerce.number().positive('Área total deve ser um número positivo'),
  location: z.string().optional(),
})

const createPlotSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  areaHa: z.coerce.number().positive('Área deve ser um número positivo'),
  status: z.string().default('Saudável'),
})

export async function createProperty(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = createPropertySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const property = await propertiesRepository.createProperty(session.user.id, parsed.data)
    revalidatePath('/propriedades')
    return { ok: true, data: { id: property.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar propriedade.' }
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  try {
    const property = await propertiesRepository.getProperty(id)
    if (!property || property.userId !== session.user.id) {
      return { ok: false, error: 'Acesso negado.' }
    }

    await propertiesRepository.deleteProperty(id)
    revalidatePath('/propriedades')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao excluir propriedade.' }
  }
}

export async function createPlot(
  propertyId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = createPlotSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  try {
    const property = await propertiesRepository.getProperty(propertyId)
    if (!property || property.userId !== session.user.id) {
      return { ok: false, error: 'Acesso negado.' }
    }

    const plot = await propertiesRepository.createPlot(propertyId, parsed.data)
    revalidatePath('/propriedades')
    return { ok: true, data: { id: plot.id } }
  } catch {
    return { ok: false, error: 'Erro ao criar talhão.' }
  }
}

export async function deletePlot(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session) {
    return { ok: false, error: 'Não autenticado.' }
  }

  try {
    const plot = await propertiesRepository.getPlot(id)
    if (!plot || plot.property.userId !== session.user.id) {
      return { ok: false, error: 'Acesso negado.' }
    }

    await propertiesRepository.deletePlot(id)
    revalidatePath('/propriedades')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao excluir talhão.' }
  }
}
