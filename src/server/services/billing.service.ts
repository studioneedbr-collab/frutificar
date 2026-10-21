// Cobrança recorrente via Asaas: checkout, sincronização e aplicação dos
// eventos de pagamento (webhook) na assinatura local.
import 'server-only'
import type { PlanName, PaymentStatus, BillingCycle, CouponDuration } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { reportError } from '@/lib/alerts'
import { sendPaymentConfirmedEmail, sendPaymentOverdueEmail, sendPlanUpgradedEmail } from '@/lib/billing-emails'
import * as asaas from '@/lib/asaas'
import type { AsaasBillingType, AsaasPayment } from '@/lib/asaas'

export type CheckoutMethod = Exclude<AsaasBillingType, 'UNDEFINED'>

export type OpenCharge = {
  paymentId: string
  billingType: AsaasBillingType
  value: number
  dueDate: string
  status: string
  invoiceUrl: string | null
  bankSlipUrl: string | null
  pix: { image: string; payload: string } | null
}

// ─── CPF / CNPJ ───────────────────────────────────────────

function cpfValid(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

function cnpjValid(d: string): boolean {
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const sum = w.reduce((acc, wi, i) => acc + Number(d[i]) * wi, 0)
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13])
}

/** Retorna só os dígitos se for um CPF/CNPJ válido; senão null. */
export function normalizeCpfCnpj(input: string): string | null {
  const d = input.replace(/\D/g, '')
  if (d.length === 11) return cpfValid(d) ? d : null
  if (d.length === 14) return cnpjValid(d) ? d : null
  return null
}

// ─── Helpers ──────────────────────────────────────────────

function asaasDate(d: string): Date {
  // Datas do Asaas são dias locais (Brasília); meio-dia evita virar o dia.
  return new Date(`${d}T12:00:00-03:00`)
}

function addCycle(d: Date, cycle: BillingCycle): Date {
  const n = new Date(d)
  if (cycle === 'YEARLY') n.setFullYear(n.getFullYear() + 1)
  else n.setMonth(n.getMonth() + 1)
  return n
}

function mapPaymentStatus(p: AsaasPayment, event?: string): PaymentStatus {
  if (event === 'PAYMENT_DELETED' || p.deleted) return 'FAILED'
  if (asaas.PAID_STATUSES.includes(p.status)) return 'PAID'
  if (asaas.REFUND_STATUSES.includes(p.status)) return 'REFUNDED'
  return 'PENDING'
}

export function planLabel(name: PlanName): string {
  return name.charAt(0) + name.slice(1).toLowerCase()
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDay = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' })
const round2 = (v: number) => Math.round(v * 100) / 100

// O Asaas não emite cobrança abaixo de R$ 5,00.
export const MIN_CHARGE = 5

// ─── Preço, ciclo e cupom ─────────────────────────────────

type PlanPrice = { priceMonthly: unknown; priceYearly: unknown | null }
type CouponLike = { percentOff: number | null; amountOff: unknown | null; duration: CouponDuration }

/** Valor cheio de uma cobrança do plano no ciclo (anual = 10x se não definido). */
export function chargeFor(plan: PlanPrice, cycle: BillingCycle): number {
  const monthly = Number(plan.priceMonthly)
  if (cycle === 'YEARLY') return round2(plan.priceYearly != null ? Number(plan.priceYearly) : monthly * 10)
  return round2(monthly)
}

/** Aplica o cupom a uma cobrança (nunca abaixo do mínimo do Asaas). */
export function applyCoupon(value: number, coupon: CouponLike | null): number {
  if (!coupon) return value
  let v = value
  if (coupon.percentOff) v = value * (1 - Math.min(100, Math.max(0, coupon.percentOff)) / 100)
  else if (coupon.amountOff != null) v = value - Number(coupon.amountOff)
  return round2(Math.max(MIN_CHARGE, v))
}

export class CheckoutError extends Error {}

/** Valida um cupom para um plano. Lança CheckoutError com a mensagem para o aluno. */
export async function findValidCoupon(code: string, plan: PlanName) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } })
  if (!coupon || !coupon.active) throw new CheckoutError('Cupom inválido.')
  if (coupon.expiresAt && coupon.expiresAt <= new Date()) throw new CheckoutError('Este cupom expirou.')
  if (coupon.maxRedemptions != null && coupon.redemptions >= coupon.maxRedemptions) {
    throw new CheckoutError('Este cupom já atingiu o limite de usos.')
  }
  if (coupon.plans.length > 0 && !coupon.plans.includes(plan)) {
    throw new CheckoutError(`Este cupom não vale para o plano ${planLabel(plan)}.`)
  }
  return coupon
}

/** Prévia de preço para o checkout (plano + ciclo + cupom opcional). */
export async function quoteCheckout(input: { plan: PlanName; cycle: BillingCycle; couponCode?: string }) {
  const plan = await prisma.plan.findUnique({ where: { name: input.plan } })
  if (!plan) throw new CheckoutError('Plano não encontrado.')
  const full = chargeFor(plan, input.cycle)
  const coupon = input.couponCode ? await findValidCoupon(input.couponCode, input.plan) : null
  const first = applyCoupon(full, coupon)
  const recurring = coupon?.duration === 'FOREVER' ? first : full
  return { full, first, recurring, coupon }
}

// ─── Aplicar um pagamento do Asaas na base local ──────────

/**
 * Idempotente: pode ser chamado pelo webhook e pela sincronização quantas
 * vezes for preciso para a mesma cobrança. Efeitos colaterais (e-mail, cupom,
 * vigência) só acontecem na TRANSIÇÃO de status — reenvios não duplicam nada.
 */
export async function applyAsaasPayment(p: AsaasPayment, event?: string): Promise<void> {
  // Cobrança avulsa de upgrade de plano tem fluxo próprio.
  if (p.externalReference?.startsWith('upgrade:')) return applyUpgradePayment(p, event)

  const sub =
    (p.subscription
      ? await prisma.subscription.findFirst({ where: { gatewaySubscriptionId: p.subscription } })
      : null) ??
    (await prisma.subscription.findFirst({ where: { gatewayCustomerId: p.customer } }))
  if (!sub) {
    console.warn('[billing] cobrança sem assinatura local:', p.id, p.subscription, p.customer)
    return
  }

  const status = mapPaymentStatus(p, event)
  const dueDate = asaasDate(p.dueDate)
  const paidDay = p.clientPaymentDate ?? p.paymentDate ?? p.confirmedDate
  const [plan, previous] = await Promise.all([
    prisma.plan.findUnique({ where: { id: sub.planId } }),
    prisma.payment.findUnique({ where: { gatewayPaymentId: p.id }, select: { status: true } }),
  ])
  const method = asaas.billingTypeLabel[p.billingType] ?? p.billingType

  const data = {
    amount: p.value,
    status,
    method,
    billingType: p.billingType,
    invoiceUrl: p.invoiceUrl ?? null,
    dueDate,
    subscriptionId: sub.id,
    ...(status === 'PAID' ? { paidAt: paidDay ? asaasDate(paidDay) : new Date() } : {}),
  }
  await prisma.payment.upsert({
    where: { gatewayPaymentId: p.id },
    update: data,
    create: {
      ...data,
      userId: sub.userId,
      gatewayPaymentId: p.id,
      description: plan
        ? `Plano ${planLabel(plan.name)} — ${sub.billingCycle === 'YEARLY' ? 'Anual' : 'Mensal'}`
        : 'Mensalidade',
      paidAt: data.paidAt ?? dueDate,
    },
  })

  if (status === 'PAID') {
    const nextEnd = addCycle(dueDate, sub.billingCycle)
    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        canceledAt: null,
        currentPeriodEnd: nextEnd > sub.currentPeriodEnd ? nextEnd : sub.currentPeriodEnd,
      },
    })
    if (previous?.status === 'PAID') return // reenvio do mesmo evento

    // 1º pagamento com cupom: conta o uso e, se o cupom é "só a 1ª", volta o
    // valor cheio para as próximas cobranças.
    if (sub.couponId) {
      const paidCount = await prisma.payment.count({ where: { subscriptionId: sub.id, status: 'PAID' } })
      if (paidCount === 1) {
        await prisma.coupon.update({ where: { id: sub.couponId }, data: { redemptions: { increment: 1 } } })
      }
    }
    if (sub.couponRevertPending && plan && sub.gatewaySubscriptionId) {
      try {
        await asaas.updateSubscription(sub.gatewaySubscriptionId, { value: chargeFor(plan, sub.billingCycle) })
        await prisma.subscription.update({ where: { id: sub.id }, data: { couponRevertPending: false } })
      } catch (err) {
        await reportError('Asaas: voltar valor cheio após cupom', err, { subscriptionId: sub.id })
      }
    }

    const user = await prisma.user.findUnique({ where: { id: sub.userId }, select: { email: true, name: true } })
    if (user && plan) {
      await sendPaymentConfirmedEmail(user, {
        plan: planLabel(plan.name),
        value: brl(p.value),
        method,
        nextCharge: fmtDay(updated.currentPeriodEnd),
        cycle: sub.billingCycle,
      })
    }
    return
  }

  // Cobrança vencida ou estornada corta o acesso — a não ser que já exista
  // um pagamento confirmado mais novo (evento atrasado de um ciclo antigo).
  const overdue = p.status === 'OVERDUE' && event !== 'PAYMENT_DELETED' && !p.deleted
  if ((overdue || status === 'REFUNDED') && sub.status === 'ACTIVE') {
    const newerPaid = await prisma.payment.count({
      where: { subscriptionId: sub.id, status: 'PAID', dueDate: { gt: dueDate } },
    })
    if (newerPaid === 0) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'PAST_DUE' } })
      if (overdue) {
        const user = await prisma.user.findUnique({ where: { id: sub.userId }, select: { email: true, name: true } })
        if (user) await sendPaymentOverdueEmail(user, { value: brl(p.value), invoiceUrl: p.invoiceUrl ?? null })
      }
    }
  }
}

/** Assinatura apagada/inativada no Asaas (painel do Asaas ou cancelamento). */
export async function applyAsaasSubscriptionEnded(gatewaySubscriptionId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { gatewaySubscriptionId, status: { not: 'CANCELED' } },
    data: { status: 'CANCELED', canceledAt: new Date() },
  })
}

// ─── Upgrade de plano (cobra a diferença proporcional) ────

/** externalReference: "upgrade:<subscriptionId>:<PLANO>" */
function parseUpgradeRef(ref: string): { subscriptionId: string; plan: PlanName } | null {
  const [, subscriptionId, plan] = ref.split(':')
  if (!subscriptionId || !['ESSENCIAL', 'PREMIUM', 'GOLD'].includes(plan)) return null
  return { subscriptionId, plan: plan as PlanName }
}

async function applyUpgradePayment(p: AsaasPayment, event?: string): Promise<void> {
  const ref = parseUpgradeRef(p.externalReference ?? '')
  if (!ref) return
  const sub = await prisma.subscription.findUnique({ where: { id: ref.subscriptionId } })
  // Confere que a cobrança é mesmo deste cliente (não confia só na referência).
  if (!sub || sub.gatewayCustomerId !== p.customer) {
    console.warn('[billing] upgrade com referência inválida:', p.id)
    return
  }
  const status = mapPaymentStatus(p, event)
  const previous = await prisma.payment.findUnique({ where: { gatewayPaymentId: p.id }, select: { status: true } })
  const paidDay = p.clientPaymentDate ?? p.paymentDate ?? p.confirmedDate
  const data = {
    amount: p.value,
    status,
    method: asaas.billingTypeLabel[p.billingType] ?? p.billingType,
    billingType: p.billingType,
    invoiceUrl: p.invoiceUrl ?? null,
    dueDate: asaasDate(p.dueDate),
    subscriptionId: sub.id,
    ...(status === 'PAID' ? { paidAt: paidDay ? asaasDate(paidDay) : new Date() } : {}),
  }
  await prisma.payment.upsert({
    where: { gatewayPaymentId: p.id },
    update: data,
    create: {
      ...data,
      userId: sub.userId,
      gatewayPaymentId: p.id,
      description: `Upgrade para o plano ${planLabel(ref.plan)} (proporcional)`,
      paidAt: data.paidAt ?? data.dueDate,
    },
  })
  if (status !== 'PAID' || previous?.status === 'PAID') return
  await finishUpgrade(sub.id, ref.plan)
}

/** Troca o plano e atualiza o valor das próximas cobranças no Asaas. */
async function finishUpgrade(subscriptionId: string, target: PlanName): Promise<void> {
  const [sub, plan] = await Promise.all([
    prisma.subscription.findUnique({ where: { id: subscriptionId } }),
    prisma.plan.findUnique({ where: { name: target } }),
  ])
  if (!sub || !plan) return
  // Upgrade encerra o cupom anterior (o novo valor é o cheio do plano).
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { planId: plan.id, couponId: null, couponRevertPending: false },
  })
  const value = chargeFor(plan, sub.billingCycle)
  if (sub.gatewaySubscriptionId) {
    try {
      await asaas.updateSubscription(sub.gatewaySubscriptionId, {
        value,
        description: `Frutificar Digital — Plano ${planLabel(plan.name)} (${sub.billingCycle === 'YEARLY' ? 'anual' : 'mensal'})`,
      })
    } catch (err) {
      await reportError('Asaas: atualizar valor após upgrade', err, { subscriptionId: sub.id })
    }
  }
  const user = await prisma.user.findUnique({ where: { id: sub.userId }, select: { email: true, name: true } })
  if (user) {
    await sendPlanUpgradedEmail(user, {
      plan: planLabel(plan.name),
      value: `${brl(value)}${sub.billingCycle === 'YEARLY' ? '/ano' : '/mês'}`,
    })
  }
}

export type UpgradeResult =
  | { kind: 'applied' }
  | { kind: 'charge'; invoiceUrl: string; value: number }

/**
 * Upgrade pelo próprio aluno: cobra a diferença proporcional aos dias que
 * faltam no período atual. O plano muda quando o pagamento confirma (webhook).
 * Diferença abaixo do mínimo do Asaas → aplica na hora, sem cobrança.
 */
export async function requestUpgrade(userId: string, target: PlanName): Promise<UpgradeResult> {
  if (!asaas.isAsaasConfigured()) throw new CheckoutError('Pagamento temporariamente indisponível.')
  const sub = await prisma.subscription.findUnique({ where: { userId }, include: { plan: true } })
  if (!sub || sub.status !== 'ACTIVE') throw new CheckoutError('Sua assinatura precisa estar ativa para fazer upgrade.')
  if (!sub.gatewayCustomerId || !sub.gatewaySubscriptionId) {
    throw new CheckoutError('Para mudar este plano, fale com a equipe Frutificar.')
  }
  const targetPlan = await prisma.plan.findUnique({ where: { name: target } })
  if (!targetPlan) throw new CheckoutError('Plano não encontrado.')

  const currentCharge = chargeFor(sub.plan, sub.billingCycle)
  const targetCharge = chargeFor(targetPlan, sub.billingCycle)
  if (targetCharge <= currentCharge) throw new CheckoutError('Escolha um plano superior ao atual.')

  // Upgrade já em andamento para este plano? Reaproveita a cobrança aberta.
  const pending = await prisma.payment.findFirst({
    where: { subscriptionId: sub.id, status: 'PENDING', description: { startsWith: `Upgrade para o plano ${planLabel(target)}` } },
    select: { invoiceUrl: true, amount: true },
  })
  if (pending?.invoiceUrl) return { kind: 'charge', invoiceUrl: pending.invoiceUrl, value: Number(pending.amount) }

  const cycleDays = sub.billingCycle === 'YEARLY' ? 365 : 30
  const msLeft = sub.currentPeriodEnd.getTime() - Date.now()
  const daysLeft = Math.max(0, Math.min(cycleDays, Math.ceil(msLeft / 86_400_000)))
  const diff = round2(((targetCharge - currentCharge) * daysLeft) / cycleDays)

  if (diff < MIN_CHARGE) {
    await finishUpgrade(sub.id, target)
    return { kind: 'applied' }
  }

  const payment = await asaas.createPayment({
    customer: sub.gatewayCustomerId,
    billingType: 'UNDEFINED', // o aluno escolhe Pix, cartão ou boleto na fatura
    value: diff,
    dueDate: asaas.todayInBrazil(),
    description: `Upgrade para o plano ${planLabel(target)} — diferença proporcional (${daysLeft} dias)`,
    externalReference: `upgrade:${sub.id}:${target}`,
  })
  await applyAsaasPayment(payment)
  if (!payment.invoiceUrl) throw new CheckoutError('Cobrança criada, mas sem link de pagamento. Tente novamente.')
  return { kind: 'charge', invoiceUrl: payment.invoiceUrl, value: diff }
}

// ─── Sincronização (fallback do webhook) ──────────────────

/** Puxa as cobranças da assinatura no Asaas e aplica localmente. */
export async function syncUserSubscription(userId: string): Promise<void> {
  if (!asaas.isAsaasConfigured()) return
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub?.gatewaySubscriptionId) return
  const payments = await asaas.listSubscriptionPayments(sub.gatewaySubscriptionId)
  // Do mais antigo para o mais novo, para o status final refletir o último ciclo.
  payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  for (const p of payments) await applyAsaasPayment(p)
}

// ─── Checkout ─────────────────────────────────────────────

async function openChargeFor(gatewaySubscriptionId: string): Promise<OpenCharge | null> {
  const payments = await asaas.listSubscriptionPayments(gatewaySubscriptionId)
  const open = payments
    .filter((p) => !p.deleted && (p.status === 'PENDING' || p.status === 'OVERDUE'))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  if (!open) return null

  await applyAsaasPayment(open)

  let pix: OpenCharge['pix'] = null
  if (open.billingType === 'PIX') {
    try {
      const qr = await asaas.getPixQrCode(open.id)
      pix = { image: qr.encodedImage, payload: qr.payload }
    } catch (err) {
      // Ex.: conta sem chave Pix cadastrada — a fatura do Asaas ainda funciona.
      await reportError('Asaas: gerar QR Pix', err)
    }
  }

  return {
    paymentId: open.id,
    billingType: open.billingType,
    value: open.value,
    dueDate: open.dueDate,
    status: open.status,
    invoiceUrl: open.invoiceUrl ?? null,
    bankSlipUrl: open.bankSlipUrl ?? null,
    pix,
  }
}

/** Cobrança em aberto do aluno (para reexibir ao voltar ao checkout). */
export async function getOpenCharge(userId: string): Promise<OpenCharge | null> {
  if (!asaas.isAsaasConfigured()) return null
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub?.gatewaySubscriptionId) return null
  return openChargeFor(sub.gatewaySubscriptionId)
}

/**
 * Cria (ou atualiza) a assinatura do aluno no Asaas com o plano, o ciclo, o
 * cupom e a forma de pagamento escolhidos e devolve a cobrança a pagar.
 */
export async function startCheckout(
  userId: string,
  input: { plan: PlanName; method: CheckoutMethod; cycle: BillingCycle; cpfCnpj?: string; couponCode?: string },
): Promise<OpenCharge> {
  if (!asaas.isAsaasConfigured()) {
    throw new CheckoutError('Pagamento temporariamente indisponível. Tente novamente em instantes.')
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } })
  if (!user) throw new CheckoutError('Usuário não encontrado.')
  const quote = await quoteCheckout({ plan: input.plan, cycle: input.cycle, couponCode: input.couponCode })
  const plan = (await prisma.plan.findUnique({ where: { name: input.plan } }))!
  const value = quote.first
  const description = `Frutificar Digital — Plano ${planLabel(plan.name)} (${input.cycle === 'YEARLY' ? 'anual' : 'mensal'})`

  // Assinatura local (cria se o aluno ainda não tiver).
  let sub = await prisma.subscription.findUnique({ where: { userId } })
  if (sub?.status === 'ACTIVE') throw new CheckoutError('Sua assinatura já está ativa.')
  const couponData = {
    couponId: quote.coupon?.id ?? null,
    couponRevertPending: Boolean(quote.coupon && quote.coupon.duration === 'ONCE' && quote.first < quote.full),
  }
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId, planId: plan.id, status: 'PENDING', currentPeriodEnd: new Date(), billingCycle: input.cycle, ...couponData },
    })
  } else {
    sub = await prisma.subscription.update({
      where: { id: sub.id },
      data: { planId: plan.id, billingCycle: input.cycle, ...couponData },
    })
  }

  // Cliente no Asaas (o CPF/CNPJ é obrigatório para emitir cobrança).
  const cpfCnpj = input.cpfCnpj ? normalizeCpfCnpj(input.cpfCnpj) : null
  if (input.cpfCnpj && !cpfCnpj) throw new CheckoutError('CPF ou CNPJ inválido.')
  let customerId = sub.gatewayCustomerId
  if (!customerId) {
    if (!cpfCnpj) throw new CheckoutError('Informe seu CPF ou CNPJ para emitir a cobrança.')
    const customer = await asaas.createCustomer({
      name: user.name,
      email: user.email,
      cpfCnpj,
      externalReference: user.id,
    })
    customerId = customer.id
    sub = await prisma.subscription.update({ where: { id: sub.id }, data: { gatewayCustomerId: customerId } })
  } else if (cpfCnpj) {
    await asaas.updateCustomer(customerId, { cpfCnpj })
  }

  // Reaproveita a assinatura do Asaas se ainda estiver ativa lá; senão cria outra.
  let gatewaySubId = sub.gatewaySubscriptionId
  if (gatewaySubId) {
    try {
      const remote = await asaas.getSubscription(gatewaySubId)
      if (remote.deleted || remote.status !== 'ACTIVE') {
        gatewaySubId = null
      } else if (
        remote.billingType !== input.method ||
        Number(remote.value) !== value ||
        (remote.cycle && remote.cycle !== input.cycle)
      ) {
        await asaas.updateSubscription(gatewaySubId, { billingType: input.method, value, description, cycle: input.cycle })
      }
    } catch (err) {
      if (err instanceof asaas.AsaasError && err.status === 404) gatewaySubId = null
      else throw err
    }
  }
  if (!gatewaySubId) {
    const created = await asaas.createSubscription({
      customer: customerId,
      billingType: input.method,
      value,
      nextDueDate: asaas.todayInBrazil(),
      description,
      externalReference: sub.id,
      cycle: input.cycle,
    })
    gatewaySubId = created.id
    await prisma.subscription.update({ where: { id: sub.id }, data: { gatewaySubscriptionId: gatewaySubId } })
  }

  const charge = await openChargeFor(gatewaySubId)
  if (!charge) {
    throw new CheckoutError('A cobrança ainda está sendo gerada. Aguarde alguns segundos e tente de novo.')
  }
  return charge
}

/** Cancela a assinatura no Asaas (para de gerar cobranças). Não lança erro. */
export async function cancelGatewaySubscription(subscriptionId: string): Promise<void> {
  if (!asaas.isAsaasConfigured()) return
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { gatewaySubscriptionId: true },
  })
  if (!sub?.gatewaySubscriptionId) return
  try {
    await asaas.deleteSubscription(sub.gatewaySubscriptionId)
  } catch (err) {
    await reportError('Asaas: cancelar assinatura', err, { subscriptionId })
  }
}

/** Atualiza o valor da assinatura no Asaas após troca de plano. Não lança erro. */
export async function updateGatewaySubscriptionPlan(subscriptionId: string): Promise<void> {
  if (!asaas.isAsaasConfigured()) return
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { gatewaySubscriptionId: true, billingCycle: true, plan: true },
  })
  if (!sub?.gatewaySubscriptionId) return
  try {
    await asaas.updateSubscription(sub.gatewaySubscriptionId, {
      value: chargeFor(sub.plan, sub.billingCycle),
      description: `Frutificar Digital — Plano ${planLabel(sub.plan.name)} (${sub.billingCycle === 'YEARLY' ? 'anual' : 'mensal'})`,
    })
  } catch (err) {
    await reportError('Asaas: atualizar plano', err, { subscriptionId })
  }
}
