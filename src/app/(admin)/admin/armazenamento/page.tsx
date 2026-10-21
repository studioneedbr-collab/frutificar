// Server Component: uso do Supabase Storage + limpeza de arquivos sem uso (órfãos).
// O cálculo é feito aqui no servidor; a exclusão passa por Server Action (só ADMIN).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { storageConfigured } from '@/lib/storage'
import { findOrphans, type StorageReport } from '@/server/services/storage-cleanup.service'
import { ArmazenamentoView, type StorageState } from './armazenamento-view'

export default async function AdminArmazenamentoPage() {
  let state: StorageState
  if (PREVIEW_MODE) {
    state = { kind: 'preview' }
  } else if (!storageConfigured()) {
    state = { kind: 'unconfigured' }
  } else {
    let report: StorageReport | null = null
    try {
      report = await findOrphans()
    } catch (err) {
      console.error('[admin/armazenamento] erro ao analisar o Storage:', err)
    }
    state = report ? { kind: 'ready', report } : { kind: 'error' }
  }
  return <ArmazenamentoView state={state} />
}
