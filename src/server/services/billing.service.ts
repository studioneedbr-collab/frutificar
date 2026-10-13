// Cobrança recorrente via Asaas: checkout, sincronização e aplicação dos
// eventos de pagamento (webhook) na assinatura local.
import 'server-only'
import type { PlanName, PaymentStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
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

function addOneMonth(d: Date): Date {
  const n = new Date(d)
  n.setMonth(n.getMonth() + 1)
  return n
}

function mapPaymentStatus(p: AsaasPayment, event?: string): PaymentStatus {
  if (event === 'PAYMENT_DELETED' || p.deleted) return 'FAILED'
  if (asaas.PAID_STATUSES.includes(p.status)) return 'PAID'
  if (asaas.REFUND_STATUSES.includes(p.status)) return 'REFUNDED'
  return 'PENDING'
}

function planLabel(name: PlanName): string {
  return name.charAt(0) + name.slice(1).toLowerCase()
}

// ─── Aplicar um pagamento do Asaas na base local ──────────

/**
 * Idempotente: pode ser chamado pelo webhook e pela sincronização quantas
 * vezes for preciso para a mesma cobrança.
 */
export async function applyAsaasPayment(p: AsaasPayment, event?: string): Promise<void> {
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
  const plan = await prisma.plan.findUnique({ where: { id: sub.planId }, select: { name: true } })

  const data = {
    amount: p.value,
    status,
    method: asaas.billingTypeLabel[p.billingType] ?? p.billingType,
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
      description: plan ? `Plano ${planLabel(plan.name)} — Mensal` : 'Mensalidade',
      paidAt: data.paidAt ?? dueDate,
    },
  })

  if (status === 'PAID') {
    const nextEnd = addOneMonth(dueDate)
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        currentPeriodEnd: nextEnd > sub.currentPeriodEnd ? nextEnd : sub.currentPeriodEnd,
      },
    })
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
    }
  }
}

/** Assinatura apagada/inativada no Asaas (painel do Asaas ou cancelamento). */
export async function applyAsaasSubscriptionEnded(gatewaySubscriptionId: string): Promise<void> {
  await prisma.subscription.updateMany({
    where: { gatewaySubscriptionId, status: { not: 'CANCELED' } },
    data: { status: 'CANCELED' },
  })
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
      console.error('[billing] falha ao gerar QR Pix:', err)
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

export class CheckoutError extends Error {}

/**
 * Cria (ou atualiza) a assinatura do aluno no Asaas com o plano e a forma de
 * pagamento escolhidos e devolve a cobrança a pagar.
 */
export async function startCheckout(
  userId: string,
  input: { plan: PlanName; method: CheckoutMethod; cpfCnpj?: string },
): Promise<OpenCharge> {
  if (!asaas.isAsaasConfigured()) {
    throw new CheckoutError('Pagamento temporariamente indisponível. Tente novamente em instantes.')
  }

  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    prisma.plan.findUnique({ where: { name: input.plan } }),
  ])
  if (!user) throw new CheckoutError('Usuário não encontrado.')
  if (!plan) throw new CheckoutError('Plano não encontrado.')
  const value = Number(plan.priceMonthly)
  const description = `Frutificar Digital — Plano ${planLabel(plan.name)} (mensal)`

  // Assinatura local (cria se o aluno ainda não tiver).
  let sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId, planId: plan.id, status: 'PENDING', currentPeriodEnd: new Date() },
    })
  } else if (sub.planId !== plan.id && sub.status !== 'ACTIVE') {
    sub = await prisma.subscription.update({ where: { id: sub.id }, data: { planId: plan.id } })
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
      } else if (remote.billingType !== input.method || Number(remote.value) !== value) {
        await asaas.updateSubscription(gatewaySubId, { billingType: input.method, value, description })
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
    console.error('[billing] falha ao cancelar assinatura no Asaas:', err)
  }
}

/** Atualiza o valor da assinatura no Asaas após troca de plano. Não lança erro. */
export async function updateGatewaySubscriptionPlan(subscriptionId: string): Promise<void> {
  if (!asaas.isAsaasConfigured()) return
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { gatewaySubscriptionId: true, plan: { select: { name: true, priceMonthly: true } } },
  })
  if (!sub?.gatewaySubscriptionId) return
  try {
    await asaas.updateSubscription(sub.gatewaySubscriptionId, {
      value: Number(sub.plan.priceMonthly),
      description: `Frutificar Digital — Plano ${planLabel(sub.plan.name)} (mensal)`,
    })
  } catch (err) {
    console.error('[billing] falha ao atualizar plano no Asaas:', err)
  }
}
