'use server'

import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import { uploadToStorage } from '@/lib/storage'
import { userHasFeature } from '@/lib/access-control'
import * as properties from '@/server/repositories/properties.repository'

const TYPES = ['LICENCA', 'DOCUMENTO', 'HISTORICO']
const MAX_BYTES = 15 * 1024 * 1024

function parseDate(v: string): Date | null {
  const s = v.trim()
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Cria um item de gestão da propriedade (licença / documento / histórico),
 * subindo o arquivo anexado ao Storage quando houver.
 */
export async function createPropertyDocumentAction(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }

  if (!(await userHasFeature(session.user.id, 'management'))) {
    return { ok: false, error: 'Seu plano não inclui a gestão da propriedade.' }
  }

  const propertyId = String(formData.get('propertyId') ?? '')
  const type = String(formData.get('type') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const issuer = String(formData.get('issuer') ?? '').trim()
  const issuedAt = parseDate(String(formData.get('issuedAt') ?? ''))
  const expiresAt = parseDate(String(formData.get('expiresAt') ?? ''))
  const file = formData.get('file')

  if (!propertyId) return { ok: false, error: 'Selecione uma propriedade.' }
  if (!TYPES.includes(type)) return { ok: false, error: 'Tipo inválido.' }
  if (title.length < 2) return { ok: false, error: 'Informe um título.' }

  const ownerId = await properties.getPropertyOwnerUserId(propertyId)
  if (!ownerId) return { ok: false, error: 'Propriedade não encontrada.' }
  if (ownerId !== session.user.id) return { ok: false, error: 'Acesso negado.' }

  let fileUrl: string | null = null
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return { ok: false, error: 'Arquivo muito grande (máx. 15MB).' }
    const up = await uploadToStorage(file, { prefix: 'propriedade' })
    if (!up.ok) return { ok: false, error: up.error }
    fileUrl = up.url
  }

  try {
    const doc = await properties.createPropertyDocument(propertyId, {
      type, title,
      description: description || null,
      fileUrl,
      issuer: issuer || null,
      issuedAt,
      expiresAt,
    })
    revalidatePath('/gestao')
    return { ok: true, data: { id: doc.id } }
  } catch {
    return { ok: false, error: 'Erro ao salvar. Tente novamente.' }
  }
}

export async function deletePropertyDocumentAction(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }

  try {
    const doc = await properties.getPropertyDocument(id)
    if (!doc) return { ok: false, error: 'Item não encontrado.' }
    if (doc.property.userId !== session.user.id) return { ok: false, error: 'Acesso negado.' }
    await properties.deletePropertyDocument(id)
    revalidatePath('/gestao')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erro ao remover.' }
  }
}
