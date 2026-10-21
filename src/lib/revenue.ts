// Receita recorrente (MRR) — regra única usada pelo admin (Assinaturas, Financeiro).
//
// Regras:
// - MONTHLY → priceMonthly.
// - YEARLY  → priceYearly / 12 (se o plano não tiver preço anual: priceMonthly × 10 / 12,
//   o mesmo "2 meses grátis" do checkout).
// - Cupom FOREVER reduz o valor recorrente: percentOff (%) ou amountOff (R$ por cobrança;
//   no anual a cobrança é 1×/ano, então o desconto mensal equivalente é amountOff / 12).
//   Nunca abaixo de 0.
// - Cupom ONCE só afeta a 1ª cobrança → não muda o MRR.
// - Só assinatura ACTIVE (paga) entra no MRR; contas ADMIN nunca contam.

/** Decimal do Prisma, número ou string numérica. */
type Numeric = number | string | { toString(): string }

export type RevenueCoupon = {
  percentOff: number | null
  amountOff: Numeric | null
  duration: 'ONCE' | 'FOREVER'
}

export type RevenueSubscription = {
  billingCycle: 'MONTHLY' | 'YEARLY'
  plan: { priceMonthly: Numeric; priceYearly: Numeric | null }
  coupon?: RevenueCoupon | null
}

export type MrrSubscription = RevenueSubscription & {
  status: string
  user?: { role?: string | null } | null
}

function toNumber(v: Numeric | null | undefined): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === 'number' ? v : Number(v.toString())
  return Number.isFinite(n) ? n : 0
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Preço cheio cobrado por ciclo (mensal: por mês; anual: por ano), sem cupom. */
export function cyclePrice(sub: RevenueSubscription): number {
  const monthly = toNumber(sub.plan.priceMonthly)
  if (sub.billingCycle === 'YEARLY') {
    return sub.plan.priceYearly !== null && sub.plan.priceYearly !== undefined
      ? toNumber(sub.plan.priceYearly)
      : round2(monthly * 10)
  }
  return monthly
}

/** Valor mensal recorrente de UMA assinatura (independe do status). */
export function monthlyValue(sub: RevenueSubscription): number {
  const yearly = sub.billingCycle === 'YEARLY'
  let value = yearly ? cyclePrice(sub) / 12 : cyclePrice(sub)

  const c = sub.coupon
  if (c && c.duration === 'FOREVER') {
    if (c.percentOff !== null && c.percentOff !== undefined && c.percentOff > 0) {
      value = value * (1 - Math.min(c.percentOff, 100) / 100)
    } else if (c.amountOff !== null && c.amountOff !== undefined) {
      const off = toNumber(c.amountOff)
      value = value - (yearly ? off / 12 : off)
    }
  }
  return round2(Math.max(0, value))
}

/** A assinatura conta para o MRR? (ACTIVE e não-ADMIN) */
export function countsForMrr(sub: MrrSubscription): boolean {
  return sub.status === 'ACTIVE' && sub.user?.role !== 'ADMIN'
}

/** MRR = soma de monthlyValue das assinaturas que contam. */
export function computeMrr(subs: MrrSubscription[]): number {
  return round2(subs.reduce((sum, s) => (countsForMrr(s) ? sum + monthlyValue(s) : sum), 0))
}
