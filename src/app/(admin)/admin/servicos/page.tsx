// Server Component: catálogo de serviços (persistido). CRUD em ServicosAdminView.
export const dynamic = 'force-dynamic'

import { listServices } from '@/server/repositories/services.repository'
import type { ServiceItem, ServiceType } from './data'
import { ServicosAdminView } from './servicos-view'

export default async function AdminServicosPage() {
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
    return <ServicosAdminView initial={services} />
  } catch (err) {
    console.error('[admin/servicos] falha ao carregar serviços:', err)
    return <ServicosAdminView initial={[]} />
  }
}
