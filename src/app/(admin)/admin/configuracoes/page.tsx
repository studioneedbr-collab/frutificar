// Server Component: carrega as configurações persistidas (AppSetting) e passa para a
// view. Em preview, valores padrão. Salvar grava no banco via Server Action.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { getAllSettings } from '@/server/repositories/settings.repository'
import { ConfiguracoesView } from './configuracoes-view'

export default async function AdminConfiguracoesPage() {
  if (PREVIEW_MODE) {
    return <ConfiguracoesView initial={{}} preview />
  }
  try {
    const initial = await getAllSettings()
    return <ConfiguracoesView initial={initial} preview={false} />
  } catch {
    return <ConfiguracoesView initial={{}} preview={false} />
  }
}
