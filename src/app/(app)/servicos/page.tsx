// Server Component: catálogo de serviços (admin → Serviços) e propriedades
// reais do aluno. Em PREVIEW_MODE a view usa dados de demonstração.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listActiveServices } from '@/server/repositories/services.repository'
import { ServicosView, type ServiceItem } from './servicos-view'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function ServicosPage() {
  if (PREVIEW_MODE) return <ServicosView preview />

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let inclusos: ServiceItem[] = []
  let avulsos: ServiceItem[] = []
  let placeOptions: string[] = []
  try {
    const [services, properties] = await Promise.all([
      listActiveServices(),
      prisma.property.findMany({
        where: { userId: session.user.id },
        select: { name: true, plots: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    const toItem = (s: (typeof services)[number]): ServiceItem => ({
      title: s.name,
      desc: s.description,
      price: Number(s.price) > 0 ? brl(Number(s.price)) : undefined,
      badge: s.type === 'INCLUDED' ? 'incluso no plano' : undefined,
    })
    inclusos = services.filter((s) => s.type === 'INCLUDED').map(toItem)
    avulsos = services.filter((s) => s.type !== 'INCLUDED').map(toItem)
    placeOptions = properties.flatMap((p) =>
      p.plots.length ? p.plots.map((pl) => `${p.name} — ${pl.name}`) : [p.name],
    )
  } catch (err) {
    console.error('[servicos] erro ao carregar do banco:', err)
  }

  return <ServicosView preview={false} inclusos={inclusos} avulsos={avulsos} placeOptions={placeOptions} />
}
