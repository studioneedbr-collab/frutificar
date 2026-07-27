// Server Component: carrega as configurações persistidas (AppSetting) e passa para a
// view. Salvar grava no banco via Server Action.
export const dynamic = 'force-dynamic'

import { getAllSettings } from '@/server/repositories/settings.repository'
import { ConfiguracoesView } from './configuracoes-view'

export default async function AdminConfiguracoesPage() {
  try {
    const initial = await getAllSettings()
    return <ConfiguracoesView initial={initial} />
  } catch {
    return <ConfiguracoesView initial={{}} />
  }
}
