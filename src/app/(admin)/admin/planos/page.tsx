// Server Component: busca os planos reais (Supabase) quando PREVIEW_MODE=false,
// senão renderiza o mock. A interatividade fica em PlanosView (client).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { listPlans } from '@/server/repositories/plans.repository'
import { prisma } from '@/lib/prisma'
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

  // Modo real: lê do banco; em caso de erro, lista vazia (nunca mock) + log.
  let plans: Plan[] = []
  try {
    const [rows, activeSubs] = await Promise.all([
      listPlans(),
      // Assinaturas pagas por plano (contas admin não contam).
      prisma.subscription.findMany({
        where: { status: 'ACTIVE', user: { role: { not: 'ADMIN' } } },
        select: { planId: true, billingCycle: true },
      }),
    ])
    plans = rows.map((p) => ({
      id: p.id,
      name: capitalize(p.name),
      price: Number(p.priceMonthly),
      yearlyPrice: p.priceYearly != null ? Number(p.priceYearly) : null,
      color: planColors[p.name] ?? 'oklch(0.48 0.13 144)',
      active: p.active,
      subscribers: activeSubs.filter((s) => s.planId === p.id).length,
      // Receita mensal estimada (anual dividido por 12; sem descontos de cupom).
      revenue: activeSubs
        .filter((s) => s.planId === p.id)
        .reduce((sum, s) => sum + (s.billingCycle === 'YEARLY'
          ? (p.priceYearly != null ? Number(p.priceYearly) : Number(p.priceMonthly) * 10) / 12
          : Number(p.priceMonthly)), 0)
        .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      features: Array.isArray(p.features) ? (p.features as string[]) : [],
    }))
  } catch (err) {
    // Nunca mostrar mock em produção: lista vazia + log para investigar.
    console.error('[admin/planos] erro ao carregar do banco:', err)
    plans = []
  }
  return <PlanosView initialPlans={plans} preview={false} />
}
