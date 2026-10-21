// Server Component: Estágio Supervisionado (Gold). Lê as candidaturas do aluno
// (ServiceRequest com serviceType "Estágio — …").
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { listServiceRequestsByUser } from '@/server/repositories/appointments.repository'
import { mockEstagios, ESTAGIO_PREFIX, type EstagioItem } from './data'
import { EstagioView } from './estagio-view'

const statusLabel: Record<string, string> = {
  OPEN: 'Candidatura enviada',
  IN_ANALYSIS: 'Em análise',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELED: 'Encerrado',
}

export default async function EstagioPage() {
  if (PREVIEW_MODE) {
    return <EstagioView initial={mockEstagios} preview />
  }

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let items: EstagioItem[] = []
  try {
    const rows = await listServiceRequestsByUser(session.user.id)
    items = rows
      .filter((r) => r.serviceType.startsWith(ESTAGIO_PREFIX))
      .map((r) => ({
        id: r.id,
        area: r.serviceType.replace(/^Estágio\s*[—-]\s*/, '') || 'Estágio',
        description: r.description,
        status: statusLabel[r.status] ?? r.status,
        data: r.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      }))
  } catch (err) {
    console.error('[estagio] erro ao carregar do banco:', err)
    items = []
  }
  return <EstagioView initial={items} preview={false} />
}
