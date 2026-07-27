// Server Component: as solicitações de serviço são gravadas no banco (ServiceRequest) via Server Action.
export const dynamic = 'force-dynamic'

import { ServicosView } from './servicos-view'

export default function ServicosPage() {
  return <ServicosView />
}
