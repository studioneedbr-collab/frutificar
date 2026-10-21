// Server Component: painel financeiro com dados reais (Supabase) quando PREVIEW_MODE=false;
// em PREVIEW_MODE renderiza números de demonstração (sinalizados na tela).
// A autenticação/ADMIN é garantida pelo layout do admin.
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { getFinanceSummary, type FinanceSummary } from '@/server/repositories/finance.repository'
import { FinanceiroView } from './financeiro-view'

function emptySummary(): FinanceSummary {
  return {
    currentMonth: '',
    mrr: 0,
    monthRevenue: 0,
    monthPaymentsCount: 0,
    activeCount: 0,
    pendingCount: 0,
    pastDueCount: 0,
    pastDueOpenAmount: 0,
    canceledThisMonth: 0,
    churnBase: 0,
    churnCanceled: 0,
    churnRate: null,
    ticketAverage: null,
    revenueByMonth: [],
    activeByPlan: [],
    revenueByMethod: [],
    recentPayments: [],
  }
}

// Números fictícios só para o modo demo (PREVIEW_MODE) — nunca usados com banco.
function demoSummary(): FinanceSummary {
  const now = new Date()
  const keys = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  })
  const totals = [3120, 3480, 3390, 3910, 4260, 4105, 4720, 5180, 5045, 5630, 6010, 4870]
  const revenueByMonth = keys.map((key, i) => ({ key, total: totals[i], count: Math.round(totals[i] / 98) }))
  const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - d), 10).toISOString()
  return {
    currentMonth: keys[11],
    mrr: 6235.5,
    monthRevenue: 4870,
    monthPaymentsCount: 50,
    activeCount: 58,
    pendingCount: 7,
    pastDueCount: 4,
    pastDueOpenAmount: 582,
    canceledThisMonth: 3,
    churnBase: 61,
    churnCanceled: 2,
    churnRate: 2 / 61,
    ticketAverage: 97.4,
    revenueByMonth,
    activeByPlan: [
      { plan: 'PREMIUM', count: 27, mrr: 2619 },
      { plan: 'GOLD', count: 13, mrr: 2463.5 },
      { plan: 'ESSENCIAL', count: 18, mrr: 1153 },
    ],
    revenueByMethod: [
      { method: 'Pix', total: 2910, count: 31 },
      { method: 'Cartão de crédito', total: 1470, count: 14 },
      { method: 'Boleto', total: 490, count: 5 },
    ],
    recentPayments: [
      { id: 'd1', paidAt: day(0), student: 'Aluno Demonstração 1', plan: 'GOLD', amount: 197, method: 'Pix' },
      { id: 'd2', paidAt: day(1), student: 'Aluno Demonstração 2', plan: 'PREMIUM', amount: 97, method: 'Cartão de crédito' },
      { id: 'd3', paidAt: day(2), student: 'Aluno Demonstração 3', plan: 'ESSENCIAL', amount: 47, method: 'Boleto' },
      { id: 'd4', paidAt: day(3), student: 'Aluno Demonstração 4', plan: 'PREMIUM', amount: 970, method: 'Pix' },
    ],
  }
}

export default async function AdminFinanceiroPage() {
  let summary: FinanceSummary = emptySummary()
  let loadError = false

  if (PREVIEW_MODE) {
    summary = demoSummary()
  } else {
    try {
      summary = await getFinanceSummary()
    } catch (err) {
      // Nunca mostrar números fictícios em produção: painel zerado + log.
      console.error('[admin/financeiro] erro ao carregar do banco:', err)
      summary = emptySummary()
      loadError = true
    }
  }

  return <FinanceiroView summary={summary} preview={PREVIEW_MODE} loadError={loadError} />
}
