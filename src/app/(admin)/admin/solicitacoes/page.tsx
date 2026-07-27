// Server Component: lista TODAS as solicitações de serviço/tutoria dos alunos.
// Ações de status ficam em SolicitacoesView (client).
export const dynamic = 'force-dynamic'

import { listAllServiceRequests } from '@/server/repositories/admin.repository'
import type { SolicitacaoItem, SolStatus } from './data'
import { SolicitacoesView } from './solicitacoes-view'

export default async function AdminSolicitacoesPage() {
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
    return <SolicitacoesView initial={items} />
  } catch (err) {
    console.error('[admin/solicitacoes] falha ao carregar solicitações:', err)
    return <SolicitacoesView initial={[]} />
  }
}
