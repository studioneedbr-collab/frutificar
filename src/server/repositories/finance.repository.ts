import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { computeMrr, monthlyValue } from '@/lib/revenue'

// Consultas do painel Financeiro (/admin/financeiro).
// Regras gerais:
// - Contas ADMIN nunca entram (nem assinaturas, nem pagamentos).
// - Assinaturas de usuários excluídos (deletedAt) ficam de fora, como na tela de Assinaturas.
//   Pagamentos deles continuam contando como receita (o dinheiro entrou).
// - Meses seguem o fuso America/Sao_Paulo (UTC−3; sem horário de verão desde 2019).
// - Nunca seleciona CPF, e-mail ou ids do gateway.

const SP_TZ = 'America/Sao_Paulo'
const SP_OFFSET_HOURS = 3 // 00:00 em São Paulo = 03:00 UTC

/** Ano/mês (1–12) "agora" em São Paulo. */
function spYearMonth(now: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: SP_TZ, year: 'numeric', month: 'numeric' })
    .formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  return { year, month }
}

/** Instante UTC do dia 1 às 00:00 (São Paulo) do mês `year/month + offset`. */
function spMonthStart(year: number, month: number, offset = 0): Date {
  return new Date(Date.UTC(year, month - 1 + offset, 1, SP_OFFSET_HOURS, 0, 0, 0))
}

/** Chave "YYYY-MM" de um mês relativo. */
function monthKey(year: number, month: number, offset = 0): string {
  const d = new Date(Date.UTC(year, month - 1 + offset, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export type FinanceMonth = { key: string; total: number; count: number }
export type FinancePlanRow = { plan: string; count: number; mrr: number }
export type FinanceMethodRow = { method: string; total: number; count: number }
export type FinancePaymentRow = {
  id: string
  paidAt: string
  student: string
  plan: string | null
  amount: number
  method: string
}

export type FinanceSummary = {
  /** "YYYY-MM" do mês atual (São Paulo). */
  currentMonth: string
  mrr: number
  monthRevenue: number
  monthPaymentsCount: number
  activeCount: number
  pendingCount: number
  pastDueCount: number
  pastDueOpenAmount: number
  canceledThisMonth: number
  /** Base do churn: assinaturas que já existiam no início do mês e estavam pagantes. */
  churnBase: number
  /** Cancelamentos no mês entre as assinaturas da base. */
  churnCanceled: number
  /** 0–1, ou null quando a base é zero. */
  churnRate: number | null
  ticketAverage: number | null
  revenueByMonth: FinanceMonth[]
  activeByPlan: FinancePlanRow[]
  revenueByMethod: FinanceMethodRow[]
  recentPayments: FinancePaymentRow[]
}

const toNum = (v: Prisma.Decimal | number | null | undefined) => (v === null || v === undefined ? 0 : Number(v))

export async function getFinanceSummary(now = new Date()): Promise<FinanceSummary> {
  const { year, month } = spYearMonth(now)
  const monthStart = spMonthStart(year, month)
  const nextMonthStart = spMonthStart(year, month, 1)
  const chartStart = spMonthStart(year, month, -11) // 12 meses incluindo o atual

  const subUser: Prisma.SubscriptionWhereInput = { user: { role: { not: 'ADMIN' }, deletedAt: null } }
  const payUser: Prisma.PaymentWhereInput = { user: { role: { not: 'ADMIN' } } }
  const paidThisMonth: Prisma.PaymentWhereInput = {
    ...payUser,
    status: 'PAID',
    paidAt: { gte: monthStart, lt: nextMonthStart },
  }
  const canceledInMonth = { gte: monthStart, lt: nextMonthStart }

  // Dois lotes de 5 consultas (em vez de 10 de uma vez): não esgota o pool de
  // conexões do Supabase no plano grátis.
  const [activeSubs, statusCounts, monthAgg, byMethod, pastDueOpen] = await Promise.all([
    // Assinaturas pagas — só os campos que o MRR precisa.
    prisma.subscription.findMany({
      where: { ...subUser, status: 'ACTIVE' },
      select: {
        status: true,
        billingCycle: true,
        plan: { select: { name: true, priceMonthly: true, priceYearly: true } },
        coupon: { select: { percentOff: true, amountOff: true, duration: true } },
      },
    }),
    prisma.subscription.groupBy({
      by: ['status'],
      where: subUser,
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: paidThisMonth,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where: paidThisMonth,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    // Em aberto dos inadimplentes: cobranças PENDING de assinaturas PAST_DUE.
    prisma.payment.aggregate({
      where: { ...payUser, status: 'PENDING', subscription: { status: 'PAST_DUE' } },
      _sum: { amount: true },
    }),
  ])
  const [canceledThisMonth, churnBase, churnCanceled, byMonthRows, recent] = await Promise.all([
    prisma.subscription.count({ where: { ...subUser, canceledAt: canceledInMonth } }),
    // Base do churn (aprox., não há histórico de status): criadas antes do início do mês
    // e que hoje estão ACTIVE/PAST_DUE ou foram canceladas durante este mês.
    prisma.subscription.count({
      where: {
        ...subUser,
        createdAt: { lt: monthStart },
        OR: [{ status: { in: ['ACTIVE', 'PAST_DUE'] } }, { canceledAt: canceledInMonth }],
      },
    }),
    prisma.subscription.count({
      where: { ...subUser, createdAt: { lt: monthStart }, canceledAt: canceledInMonth },
    }),
    // Receita por mês (fuso de São Paulo). paidAt é timestamp sem fuso, gravado em UTC.
    prisma.$queryRaw<{ month: string; total: number; count: number }[]>(Prisma.sql`
      SELECT
        to_char(date_trunc('month', (p."paidAt" AT TIME ZONE 'UTC') AT TIME ZONE ${SP_TZ}), 'YYYY-MM') AS month,
        COALESCE(SUM(p."amount"), 0)::float8 AS total,
        COUNT(*)::int AS count
      FROM "Payment" p
      JOIN "User" u ON u."id" = p."userId"
      WHERE p."status" = 'PAID'
        AND u."role" <> 'ADMIN'
        AND p."paidAt" >= ${chartStart}
        AND p."paidAt" < ${nextMonthStart}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.payment.findMany({
      where: { ...payUser, status: 'PAID' },
      orderBy: { paidAt: 'desc' },
      take: 20,
      select: {
        id: true,
        paidAt: true,
        amount: true,
        method: true,
        user: { select: { name: true } },
        subscription: { select: { plan: { select: { name: true } } } },
      },
    }),
  ])

  // MRR e participação por plano (mesma regra da tela de Assinaturas).
  const mrr = computeMrr(activeSubs)
  const planMap = new Map<string, FinancePlanRow>()
  for (const s of activeSubs) {
    const row = planMap.get(s.plan.name) ?? { plan: s.plan.name, count: 0, mrr: 0 }
    row.count += 1
    row.mrr = Math.round((row.mrr + monthlyValue(s)) * 100) / 100
    planMap.set(s.plan.name, row)
  }
  const activeByPlan = [...planMap.values()].sort((a, b) => b.mrr - a.mrr)

  const countOf = (status: string) => statusCounts.find((r) => r.status === status)?._count._all ?? 0

  const monthRevenue = toNum(monthAgg._sum.amount)
  const monthPaymentsCount = monthAgg._count._all

  // Série completa de 12 meses (meses sem receita = 0).
  const byKey = new Map(byMonthRows.map((r) => [r.month, r]))
  const revenueByMonth: FinanceMonth[] = Array.from({ length: 12 }, (_, i) => {
    const key = monthKey(year, month, i - 11)
    const r = byKey.get(key)
    return { key, total: r ? Number(r.total) : 0, count: r ? Number(r.count) : 0 }
  })

  return {
    currentMonth: monthKey(year, month),
    mrr,
    monthRevenue,
    monthPaymentsCount,
    activeCount: countOf('ACTIVE'),
    pendingCount: countOf('PENDING'),
    pastDueCount: countOf('PAST_DUE'),
    pastDueOpenAmount: toNum(pastDueOpen._sum.amount),
    canceledThisMonth,
    churnBase,
    churnCanceled,
    churnRate: churnBase > 0 ? churnCanceled / churnBase : null,
    ticketAverage: monthPaymentsCount > 0 ? monthRevenue / monthPaymentsCount : null,
    revenueByMonth,
    activeByPlan,
    revenueByMethod: byMethod
      .map((r) => ({ method: r.method, total: toNum(r._sum.amount), count: r._count._all }))
      .sort((a, b) => b.total - a.total),
    recentPayments: recent.map((p) => ({
      id: p.id,
      paidAt: p.paidAt.toISOString(),
      student: p.user.name,
      plan: p.subscription?.plan.name ?? null,
      amount: toNum(p.amount),
      method: p.method,
    })),
  }
}
