// Server Component: assinatura, forma de pagamento e histórico reais do aluno.
// Em PREVIEW_MODE (demo sem banco) usa dados de exemplo. Nenhum dado de cartão
// passa por aqui: o cartão é digitado só na página segura do Asaas.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import type { PlanName } from '@prisma/client'
import { PREVIEW_MODE } from '@/lib/preview'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { chargeFor } from '@/server/services/billing.service'
import { AssinaturaView, type PlanOption, type SubStatus } from './assinatura-view'

const PLAN_ORDER: PlanName[] = ['ESSENCIAL', 'PREMIUM', 'GOLD']

function planLabel(name: string): string {
  return name.charAt(0) + name.slice(1).toLowerCase()
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function features(raw: unknown): string[] {
  return Array.isArray(raw) ? (raw as string[]).filter((x) => typeof x === 'string') : []
}

// Só para o modo demo.
const DEMO_PLANS: PlanOption[] = [
  { name: 'Essencial', price: 'R$ 47,00', amount: 47, features: ['Curso completo', 'Chat inteligente', 'Diagnóstico por imagem'] },
  { name: 'Premium', price: 'R$ 97,00', amount: 97, features: ['Tudo do Essencial', 'Minicursos', 'Gestão da propriedade'] },
  { name: 'Gold', price: 'R$ 197,00', amount: 197, features: ['Tudo do Premium', 'Dias de campo', 'Tutoria'] },
]

export default async function AssinaturaPage() {
  if (PREVIEW_MODE) {
    return (
      <AssinaturaView
        planName="Gold"
        planPrice="R$ 197,00"
        planAmount={197}
        cycle="MONTHLY"
        planFeatures={DEMO_PLANS[2].features}
        status="ACTIVE"
        periodEnd="12 jul 2026"
        paymentMethod="Pix"
        openInvoiceUrl={null}
        payerName="Aluno Demo"
        payments={[{ date: '12 jun 2026', desc: 'Plano Gold — Mensal', value: 'R$ 197,00', method: 'Pix' }]}
        plans={DEMO_PLANS}
        preview
      />
    )
  }

  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [sub, plansDb, payments] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        currentPeriodEnd: true,
        billingCycle: true,
        plan: { select: { name: true, priceMonthly: true, priceYearly: true, features: true } },
      },
    }),
    prisma.plan.findMany({ select: { name: true, priceMonthly: true, priceYearly: true, features: true } }),
    // Só o necessário para a tela (nada de ids do gateway no navegador).
    prisma.payment.findMany({
      where: { userId },
      orderBy: { paidAt: 'desc' },
      take: 24,
      select: {
        status: true,
        amount: true,
        method: true,
        description: true,
        paidAt: true,
        invoiceUrl: true,
      },
    }),
  ])

  if (!sub) redirect('/checkout')

  const paid = payments.filter((p) => p.status === 'PAID')
  // Fatura em aberto (renovação): o link é a página segura do próprio Asaas.
  const open = payments.find((p) => p.status === 'PENDING' && p.invoiceUrl?.startsWith('https://'))

  // Preços no mesmo ciclo da assinatura (mensal ou anual).
  const cycle = sub.billingCycle
  const plans: PlanOption[] = PLAN_ORDER.flatMap((name) => {
    const p = plansDb.find((x) => x.name === name)
    if (!p) return []
    const amount = chargeFor(p, cycle)
    return [{ name: planLabel(name), price: brl(amount), amount, features: features(p.features) }]
  })

  return (
    <AssinaturaView
      planName={planLabel(sub.plan.name)}
      planPrice={brl(chargeFor(sub.plan, cycle))}
      planAmount={chargeFor(sub.plan, cycle)}
      cycle={cycle}
      planFeatures={features(sub.plan.features)}
      status={sub.status as SubStatus}
      periodEnd={fmtDate(sub.currentPeriodEnd)}
      paymentMethod={paid[0]?.method ?? null}
      openInvoiceUrl={open?.invoiceUrl ?? null}
      payerName={session.user.name ?? ''}
      payments={paid.map((p) => ({
        date: fmtDate(p.paidAt),
        desc: p.description ?? 'Mensalidade',
        value: brl(Number(p.amount)),
        method: p.method,
      }))}
      plans={plans}
      preview={false}
    />
  )
}
