'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/action-types'
import { storageConfigured } from '@/lib/storage'
import { deleteOrphans } from '@/server/services/storage-cleanup.service'

const schema = z
  .array(
    z.object({
      bucket: z.string().min(1).max(100),
      path: z.string().min(1).max(500),
    }),
  )
  .min(1, 'Nenhum arquivo selecionado.')
  .max(5000)

/**
 * Apaga arquivos sem uso do Storage. A lista do navegador é só um pedido:
 * o serviço recalcula os órfãos e ignora qualquer arquivo que esteja em uso
 * ou tenha sido modificado nas últimas 24h.
 */
export async function deleteStorageOrphansAction(
  input: unknown,
): Promise<ActionResult<{ deleted: number; bytes: number; skipped: number }>> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return { ok: false, error: 'Acesso negado.' }
  if (!storageConfigured()) return { ok: false, error: 'Storage não configurado.' }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }

  try {
    const result = await deleteOrphans(parsed.data)
    revalidatePath('/admin/armazenamento')
    return { ok: true, data: result }
  } catch (err) {
    console.error('[admin-storage] falha na limpeza:', err)
    return { ok: false, error: 'Erro ao apagar os arquivos. Tente novamente.' }
  }
}
