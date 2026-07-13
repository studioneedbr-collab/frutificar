// Server Component: passa a flag de preview para a view. Em modo real, as
// solicitações de serviço são gravadas no banco (ServiceRequest) via Server Action.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { ServicosView } from './servicos-view'

export default function ServicosPage() {
  return <ServicosView preview={PREVIEW_MODE} />
}
