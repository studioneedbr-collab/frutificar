// Server Component: busca os planos reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em PlanosView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listPlans } from '@/server/repositories/plans.repository'
import { mockPlans, type Plan } from './data'
import { PlanosView } from './planos-view'

// Campos visuais que o banco não fornece (cor, assinantes, MRR): mapeados por nome.
const planColors: Record<string, string> = {
  ESSENCIAL: 'oklch(0.55 0.1 220)',
  PREMIUM: 'oklch(0.62 0.12 55)',
  GOLD: 'oklch(0.78 0.17 75)',
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

export default async function AdminPlanosPage() {
  // Modo demo (sem banco): usa o mock.
  if (PREVIEW_MODE) {
    return <PlanosView initialPlans={mockPlans} preview />
  }

  // Modo real: lê do banco; em caso de erro, cai no mock para não quebrar.
  try {
    const rows = await listPlans()
    const plans: Plan[] = rows.map((p) => ({
      id: p.id,
      name: capitalize(p.name),
      price: Number(p.priceMonthly),
      color: planColors[p.name] ?? 'oklch(0.48 0.13 144)',
      active: p.active,
      subscribers: 0,
      revenue: 'R$ 0',
      features: Array.isArray(p.features) ? (p.features as string[]) : [],
    }))

    return <PlanosView initialPlans={plans} preview={false} />
  } catch {
    return <PlanosView initialPlans={mockPlans} preview />
  }
}
