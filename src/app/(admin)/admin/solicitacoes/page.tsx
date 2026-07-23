// Server Component: lista TODAS as solicitações de serviço/tutoria dos alunos.
// Em preview usa mock. Ações de status ficam em SolicitacoesView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listAllServiceRequests } from '@/server/repositories/admin.repository'
import { mockSolicitacoes, type SolicitacaoItem, type SolStatus } from './data'
import { SolicitacoesView } from './solicitacoes-view'

export default async function AdminSolicitacoesPage() {
  if (PREVIEW_MODE) {
    return <SolicitacoesView initial={mockSolicitacoes} preview />
  }

  try {
    const rows = await listAllServiceRequests()
    const items: SolicitacaoItem[] = rows.map((r) => ({
      id: r.id,
      user: r.user.name,
      email: r.user.email,
      type: r.serviceType,
      description: r.description,
      status: r.status as SolStatus,
      date: r.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    }))
    return <SolicitacoesView initial={items} preview={false} />
  } catch (err) {
    console.error('[admin/solicitacoes] falha ao carregar solicitações:', err)
    return <SolicitacoesView initial={[]} preview={false} />
  }
}
