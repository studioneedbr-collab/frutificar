// Server Component: página de Tutoria (mentoria individual — Gold). Em modo real lê as
// solicitações de tutoria do aluno (ServiceRequest com serviceType "Tutoria — …").
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { PREVIEW_MODE } from '@/lib/preview'
import { listServiceRequestsByUser } from '@/server/repositories/appointments.repository'
import { mockTutorias, TUTORIA_PREFIX, type TutoriaRequest } from './data'
import { TutoringView } from './tutoring-view'

const statusLabel: Record<string, string> = {
  OPEN: 'Solicitado',
  IN_ANALYSIS: 'Em análise',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
}

export default async function TutoringPage() {
  if (PREVIEW_MODE) {
    return <TutoringView initialRequests={mockTutorias} preview />
  }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return <TutoringView initialRequests={[]} preview={false} />
    }

    const rows = await listServiceRequestsByUser(session.user.id)
    const requests: TutoriaRequest[] = rows
      .filter((r) => r.serviceType.startsWith(TUTORIA_PREFIX))
      .map((r) => ({
        id: r.id,
        tema: r.serviceType.replace(/^Tutoria\s*[—-]\s*/, '') || 'Tutoria',
        description: r.description,
        status: statusLabel[r.status] ?? r.status,
        data: r.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      }))

    return <TutoringView initialRequests={requests} preview={false} />
  } catch {
    return <TutoringView initialRequests={[]} preview={false} />
  }
}
