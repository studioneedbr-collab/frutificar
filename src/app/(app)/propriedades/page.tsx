// Server Component: busca propriedades reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em PropriedadesView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { listPropertiesByUser } from '@/server/repositories/properties.repository'
import { mockProperties, type Property, type Status } from './data'
import { PropriedadesView } from './propriedades-view'

export default async function PropriedadesPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <PropriedadesView initialProperties={mockProperties} preview />
  }

  // Modo real: exige sessão; sem ela, cai no mock para não quebrar.
  const session = await auth()
  if (!session?.user?.id) {
    return <PropriedadesView initialProperties={mockProperties} preview />
  }

  const rows = await listPropertiesByUser(session.user.id)
  const properties: Property[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    location: p.location ?? '—',
    area: `${Number(p.totalAreaHa)} ha`,
    talhoes: p.plots.length,
    cultura: '—',
    altitude: undefined,
    talhoesList: p.plots.map((pl) => ({
      id: pl.id,
      name: pl.name,
      cultura: '—',
      area: `${Number(pl.areaHa)} ha`,
      status: (pl.status as Status) ?? 'Saudável',
    })),
  }))

  return <PropriedadesView initialProperties={properties} preview={false} />
}
