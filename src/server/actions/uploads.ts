'use server'

import { auth } from '@/lib/auth'
import type { ActionResult } from '@/lib/action-types'
import { uploadToStorage } from '@/lib/storage'

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

// Recebe um arquivo (via FormData) e devolve a URL pública no Supabase Storage.
// Usado pelos formulários do admin (materiais, podcasts, etc.).
export async function uploadFileAction(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado.' }
  }

  const file = formData.get('file')
  const prefixRaw = formData.get('prefix')
  const prefix = typeof prefixRaw === 'string' ? prefixRaw : undefined

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Nenhum arquivo selecionado.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx. 50 MB).' }
  }

  const result = await uploadToStorage(file, { prefix })
  if (!result.ok) return { ok: false, error: result.error }

  return { ok: true, data: { url: result.url } }
}
