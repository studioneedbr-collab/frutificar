// Server Component: catálogo de serviços (persistido). CRUD em ServicosAdminView.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listServices } from '@/server/repositories/services.repository'
import { mockServices, type ServiceItem, type ServiceType } from './data'
import { ServicosAdminView } from './servicos-view'

export default async function AdminServicosPage() {
  if (PREVIEW_MODE) {
    return <ServicosAdminView initial={mockServices} preview />
  }
  try {
    const rows = await listServices()
    const services: ServiceItem[] = rows.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      type: s.type as ServiceType,
      price: Number(s.price),
      active: s.active,
    }))
    return <ServicosAdminView initial={services} preview={false} />
  } catch {
    return <ServicosAdminView initial={mockServices} preview />
  }
}
