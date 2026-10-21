'use server'

import { auth } from '@/lib/auth'
import type { ActionResult } from '@/lib/action-types'
import { uploadToStorage, toUploadFolder, type FileKind } from '@/lib/storage'

const MAX_BYTES = 4 * 1000 * 1000 // limite da Vercel por requisição

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
  // Pasta só de uma lista fixa (nada de caminho livre vindo do cliente).
  const folder = toUploadFolder(formData.get('prefix'))

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Nenhum arquivo selecionado.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Arquivo muito grande (máx. 4 MB).' }
  }

  const allow: FileKind[] =
    folder === 'podcasts' ? ['audio'] : ['pdf', 'image', 'office', 'audio', 'video']
  const result = await uploadToStorage(file, { folder, allow })
  if (!result.ok) return { ok: false, error: result.error }

  return { ok: true, data: { url: result.url } }
}
