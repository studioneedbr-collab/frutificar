'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Crown, Sun, CheckCircle2, CreditCard, FileText, Download,
  ArrowRight, Calendar, ShieldAlert, X, RotateCcw, AlertTriangle,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { gerarRecibo } from '@/lib/reports'
import { changePlan, reactivateSubscription } from '@/server/actions/subscription'
import { cancelMySubscription } from '@/server/actions/checkout'

// Status reais vindos do banco (enum SubscriptionStatus) + estado sintético "NONE" (sem assinatura).
export type SubStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'NONE'
// Status reais de pagamento (enum PaymentStatus).
export type PaymentStatusKind = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED'

export type PaymentRow = {
  date: string
  desc: string
  value: string
  method: string
  status: PaymentStatusKind
}

const STATUS_BADGE: Record<SubStatus, { label: string; bg: string; fg: string; dot: string }> = {
  ACTIVE: { label: 'Ativa', bg: 'oklch(0.48 0.13 144 / 0.25)', fg: 'oklch(0.83 0.08 144)', dot: 'oklch(0.78 0.14 144)' },
  PENDING: { label: 'Pagamento pendente', bg: 'oklch(0.75 0.15 75 / 0.22)', fg: 'oklch(0.85 0.1 75)', dot: 'oklch(0.78 0.17 75)' },
  PAST_DUE: { label: 'Em atraso', bg: 'oklch(0.6 0.18 25 / 0.2)', fg: 'oklch(0.78 0.12 25)', dot: 'oklch(0.7 0.18 25)' },
  CANCELED: { label: 'Cancelada', bg: 'oklch(1 0 0 / 0.12)', fg: 'oklch(1 0 0 / 0.6)', dot: 'oklch(1 0 0 / 0.45)' },
  NONE: { label: 'Sem assinatura', bg: 'oklch(1 0 0 / 0.12)', fg: 'oklch(1 0 0 / 0.6)', dot: 'oklch(1 0 0 / 0.45)' },
}

const PAYMENT_BADGE: Record<PaymentStatusKind, { label: string; bg: string; fg: string }> = {
  PAID: { label: 'Pago', bg: 'oklch(0.48 0.13 144 / 0.1)', fg: 'var(--color-frutificar-green)' },
  PENDING: { label: 'Pendente', bg: 'oklch(0.75 0.15 75 / 0.14)', fg: 'oklch(0.55 0.13 75)' },
  FAILED: { label: 'Falhou', bg: 'oklch(0.6 0.18 25 / 0.12)', fg: 'oklch(0.55 0.16 25)' },
  REFUNDED: { label: 'Reembolsado', bg: 'oklch(0.9 0.005 144)', fg: 'oklch(0.5 0.02 144)' },
}

/* Plano atual + status + ações são reais (Server Actions) quando !preview.
   Histórico de pagamentos e forma de pagamento (cartão) permanecem mock (local). */

const benefits = [
  'Tudo do Premium',
  'Diagnóstico ilimitado',
  '2 visitas técnicas/mês',
  'Dias de Campo exclusivos',
  'Laudo técnico mensal',
  'Suporte prioritário',
]

const otherPlans = [
  {
    name: 'Essencial',
    tag: 'ESSENCIAL',
    tagColor: 'oklch(0.65 0.12 225)',
    price: 'R$ 47',
    items: ['Todos os cursos', 'Chat IA (50 msgs/mês)', 'Podcasts e lives gravadas'],
  },
  {
    name: 'Premium',
    tag: 'PREMIUM',
    tagColor: 'oklch(0.62 0.12 55)',
    price: 'R$ 97',
    items: ['Tudo do Essencial', 'Chat IA ilimitado', 'Diagnóstico mensal'],
  },
  {
    name: 'Gold',
    tag: 'GOLD',
    tagColor: 'oklch(0.78 0.17 75)',
    price: 'R$ 197',
    items: ['Tudo do Premium', 'Diagnóstico ilimitado', '2 visitas/mês'],
  },
]

type ToastKind = 'success' | 'info' | 'danger'
type Toast = { id: number; title: string; desc?: string; kind: ToastKind }
type ChangeTarget = { name: string; price: string; tag: string; tagColor: string }

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}

export function AssinaturaView({
  initialPlan, initialPrice, initialStatus, initialPeriodEnd, initialPayments, preview,
  hasSubscription, bloqueado,
}: {
  initialPlan: string
  initialPrice: string
  initialStatus: SubStatus
  initialPeriodEnd: string
  initialPayments: PaymentRow[]
  preview: boolean
  hasSubscription: boolean
  bloqueado?: string
}) {
  const router = useRouter()

  const [status, setStatus] = useState<SubStatus>(initialStatus)
  const [payments, setPayments] = useState(initialPayments)
  const [card, setCard] = useState({ last4: '4242', exp: '09/28' })
  const [canceling, setCanceling] = useState(false)

  // Reconcilia o status com o servidor após cada router.refresh() (modo real).
  useEffect(() => { setStatus(initialStatus) }, [initialStatus])
  // Reconcilia o histórico de pagamentos vindo do servidor.
  useEffect(() => { setPayments(initialPayments) }, [initialPayments])

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [changeTarget, setChangeTarget] = useState<ChangeTarget | null>(null)

  const [toasts, setToasts] = useState<Toast[]>([])

  function notify(title: string, desc?: string, kind: ToastKind = 'success') {
    setToasts((t) => [...t, { id: Date.now() + Math.floor(performance.now()), title, desc, kind }])
  }

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 4000),
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts])

  // Marca o plano atual na grade "Mudar de plano" a partir da prop initialPlan.
  const plans = otherPlans.map((p) => ({ ...p, current: p.name === initialPlan }))

  /* ── Ações ── */
  function handleSaveCard(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const number = String(data.get('number') ?? '').replace(/\s/g, '')
    const exp = String(data.get('exp') ?? '')
    const last4 = number.slice(-4) || card.last4
    setCard({ last4, exp: exp || card.exp })
    setPaymentOpen(false)
    notify('Cartão atualizado', `Terminado em •••• ${last4}`)
  }

  async function handleCancel() {
    setCancelOpen(false)

    if (preview) {
      setStatus('CANCELED')
      notify('Assinatura cancelada', `Você mantém o acesso ${initialPlan} até ${initialPeriodEnd}.`, 'danger')
      return
    }

    setCanceling(true)
    const res = await cancelMySubscription()
    setCanceling(false)
    if (res.ok) {
      setStatus('CANCELED')
      notify('Assinatura cancelada', `Você mantém o acesso ${initialPlan} até ${initialPeriodEnd}.`, 'danger')
      router.refresh()
    } else {
      notify('Erro ao cancelar', res.error, 'danger')
    }
  }

  async function handleReactivate() {
    if (preview) {
      setStatus('ACTIVE')
      notify('Assinatura reativada', 'Sua renovação automática voltou a ficar ativa.')
      return
    }

    const res = await reactivateSubscription()
    if (res.ok) {
      setStatus('ACTIVE')
      notify('Assinatura reativada', 'Sua renovação automática voltou a ficar ativa.')
      router.refresh()
    } else {
      notify('Erro ao reativar', res.error, 'danger')
    }
  }

  async function handleChangePlan() {
    if (!changeTarget) return
    const target = changeTarget
    const name = target.name
    setChangeTarget(null)

    if (preview) {
      notify(`Mudança para o ${name} agendada`, `Entra em vigor no próximo ciclo, em ${initialPeriodEnd}.`, 'info')
      return
    }

    const res = await changePlan({
      plan: target.name.toUpperCase() as 'ESSENCIAL' | 'PREMIUM' | 'GOLD',
    })
    if (res.ok) {
      notify(`Mudança para o ${name} agendada`, `Entra em vigor no próximo ciclo, em ${initialPeriodEnd}.`, 'info')
      router.refresh()
    } else {
      notify('Erro ao mudar de plano', res.error, 'danger')
    }
  }

  function handleReceipt(p: PaymentRow) {
    gerarRecibo({
      plano: initialPlan,
      valor: p.value,
      data: p.date,
      metodo: `${p.method} · Asaas`,
      pagador: 'Douglas Vargas',
    })
    notify('Recibo gerado', `Comprovante de ${p.date} (PDF) baixado.`, 'success')
  }

  const cancelled = status === 'CANCELED'
  const needsPayment = status === 'PENDING' || status === 'PAST_DUE'
  const badge = STATUS_BADGE[status]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes toastIn { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
        .toast-in { animation: toastIn .35s cubic-bezier(.16,1,.3,1); }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim, .toast-in { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim" style={{ animationDelay: '0.02s' }}>
        <div className="text-xs font-bold tracking-widest mb-1.5" style={{ color: 'var(--color-earth)' }}>
          ASSINATURA
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Minha Assinatura
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>
          Gerencie seu plano, pagamento e histórico.
        </p>
      </header>

      {bloqueado && (
        <div
          className="dash-anim flex items-start gap-3 rounded-xl px-4 py-3.5"
          style={{ background: 'oklch(0.75 0.15 75 / 0.1)', border: '1px solid oklch(0.75 0.15 75 / 0.3)', animationDelay: '0.04s' }}
        >
          <AlertTriangle size={17} style={{ color: 'oklch(0.6 0.14 75)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm" style={{ color: 'oklch(0.4 0.06 75)' }}>
            Seu plano atual não inclui <strong>{bloqueado}</strong>. Faça upgrade para desbloquear esse recurso.
          </p>
        </div>
      )}

      {/* ── Current plan banner ── */}
      <section
        className="dash-anim relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.24 0.09 144))', animationDelay: '0.08s' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 0%, oklch(0.78 0.17 75 / 0.14), transparent 60%)' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'oklch(0.78 0.17 75 / 0.16)' }}
              >
                <Crown size={17} style={{ color: 'oklch(0.78 0.14 75)' }} />
              </span>
              <span className="text-[11px] font-bold tracking-widest" style={{ color: 'oklch(0.78 0.14 75)' }}>
                PLANO ATUAL
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                {initialPlan}
              </h2>
              <span className="text-sm mb-1" style={{ color: 'oklch(1 0 0 / 0.7)' }}>
                <strong className="text-white">{initialPrice}</strong>/mês
              </span>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full mb-1 inline-flex items-center gap-1.5"
                style={{ background: badge.bg, color: badge.fg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.dot }} />
                {badge.label}
              </span>
            </div>
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'oklch(1 0 0 / 0.55)' }}>
              <Calendar size={13} />
              {status === 'NONE' ? (
                <>Você ainda não tem uma assinatura ativa.</>
              ) : cancelled ? (
                <>Acesso até <strong style={{ color: 'oklch(1 0 0 / 0.8)' }}>{initialPeriodEnd}</strong> · sem renovação</>
              ) : needsPayment ? (
                <>Vencimento: <strong style={{ color: 'oklch(1 0 0 / 0.8)' }}>{initialPeriodEnd}</strong></>
              ) : (
                <>Próxima cobrança: <strong style={{ color: 'oklch(1 0 0 / 0.8)' }}>{initialPeriodEnd}</strong></>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {status === 'NONE' ? (
              <Link
                href="/planos"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
              >
                Ver planos <ArrowRight size={16} />
              </Link>
            ) : needsPayment ? (
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: 'oklch(0.6 0.18 25)', boxShadow: '0 8px 24px oklch(0.6 0.18 25 / 0.4)' }}
              >
                <AlertTriangle size={16} /> Finalizar pagamento
              </Link>
            ) : (
              <button
                onClick={() => setPaymentOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
              >
                <CreditCard size={16} /> Gerenciar pagamento
              </button>
            )}
            {cancelled ? (
              <button
                onClick={handleReactivate}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-white/10"
                style={{ color: 'oklch(0.83 0.08 144)', border: '1px solid oklch(0.48 0.13 144 / 0.4)' }}
              >
                <RotateCcw size={15} /> Reativar plano
              </button>
            ) : status === 'ACTIVE' ? (
              <button
                onClick={() => setCancelOpen(true)}
                disabled={canceling}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-white/5 disabled:opacity-50"
                style={{ color: 'oklch(0.72 0.12 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}
              >
                {canceling ? 'Cancelando…' : 'Cancelar assinatura'}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Benefícios do seu plano ── */}
      <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.14s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Sun size={18} style={{ color: 'oklch(0.62 0.14 75)' }} /> Benefícios do seu plano
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
          {benefits.map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <CheckCircle2 size={16} style={{ color: 'oklch(0.62 0.14 75)', flexShrink: 0 }} />
              <span className="text-sm font-medium" style={{ color: 'oklch(0.42 0.04 144)' }}>{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Forma de pagamento ── */}
      <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.2s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <CreditCard size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Forma de pagamento
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-4" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
            <CreditCard size={18} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>Cartão de crédito •••• {card.last4}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Vence {card.exp} <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span> processado via Asaas
            </p>
          </div>
          <button
            onClick={() => setPaymentOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85 shrink-0"
            style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
          >
            Atualizar
          </button>
        </div>
      </section>

      {/* ── Histórico de pagamentos ── */}
      <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.26s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <FileText size={18} style={{ color: 'var(--color-earth)' }} /> Histórico de pagamentos
        </h2>
        {payments.length === 0 ? (
          <div
            className="rounded-xl px-4 py-8 text-center text-sm"
            style={{ background: 'oklch(0.98 0.008 144)', border: '1px dashed oklch(0.88 0.01 144)', color: 'oklch(0.55 0.04 144)' }}
          >
            Nenhum pagamento registrado ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p, i) => {
              const pb = PAYMENT_BADGE[p.status]
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 sm:gap-4 rounded-xl px-3 sm:px-4 py-3"
                  style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
                >
                  <div className="w-[88px] shrink-0 text-sm font-semibold tabular-nums" style={{ color: 'var(--color-frutificar-deep)' }}>
                    {p.date}
                  </div>
                  <div className="min-w-0 flex-1 text-sm truncate" style={{ color: 'oklch(0.5 0.04 144)' }}>
                    {p.desc}
                    <span className="hidden md:inline" style={{ color: 'oklch(0.75 0.02 144)' }}> · {p.method}</span>
                  </div>
                  <div className="w-[80px] shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: 'var(--color-frutificar-deep)' }}>
                    {p.value}
                  </div>
                  <span
                    className="hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 items-center justify-center w-[76px]"
                    style={{ background: pb.bg, color: pb.fg }}
                  >
                    {pb.label}
                  </span>
                  <button
                    onClick={() => handleReceipt(p)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-earth)' }}
                  >
                    <Download size={13} /> <span className="hidden sm:inline">Recibo</span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Mudar de plano ── */}
      <section className="dash-anim" style={{ animationDelay: '0.32s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <ArrowRight size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Mudar de plano
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((p) => (
            <div
              key={p.name}
              className={p.current ? 'rounded-2xl p-5 relative' : 'dash-lift rounded-2xl p-5 relative'}
              style={
                p.current
                  ? {
                      background: 'linear-gradient(160deg, var(--color-frutificar-night), oklch(0.24 0.09 144))',
                      border: '1.5px solid oklch(1 0 0 / 0.12)',
                      boxShadow: '0 18px 48px oklch(0.16 0.07 152 / 0.25)',
                    }
                  : { background: 'white', border: '1px solid oklch(0.91 0.01 144)' }
              }
            >
              {p.current && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
                  style={{ background: 'oklch(0.78 0.17 75)', color: 'oklch(0.24 0.09 144)', boxShadow: '0 6px 18px oklch(0.78 0.17 75 / 0.4)' }}
                >
                  Plano atual
                </div>
              )}

              <div
                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-3"
                style={{ background: `${p.tagColor.slice(0, -1)} / 0.14)`, color: p.tagColor }}
              >
                {p.tag}
              </div>

              <h3
                className="text-xl font-bold mb-1"
                style={{ color: p.current ? 'white' : 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
              >
                {p.name}
              </h3>

              <div className="flex items-end gap-1 mb-4">
                <span
                  className="text-3xl font-bold"
                  style={{ color: p.current ? 'white' : 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
                >
                  {p.price}
                </span>
                <span className="text-sm mb-1" style={{ color: p.current ? 'oklch(1 0 0 / 0.4)' : 'oklch(0.6 0.02 144)' }}>
                  /mês
                </span>
              </div>

              <ul className="space-y-2 mb-5">
                {p.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[13px]">
                    <CheckCircle2
                      size={13}
                      style={{ color: p.current ? 'oklch(0.78 0.14 75)' : 'var(--color-frutificar-green)', flexShrink: 0 }}
                    />
                    <span style={{ color: p.current ? 'oklch(1 0 0 / 0.72)' : 'oklch(0.42 0.04 144)' }}>{item}</span>
                  </li>
                ))}
              </ul>

              {p.current ? (
                <div
                  className="block text-center py-2.5 rounded-xl font-bold text-sm w-full"
                  style={{ background: 'oklch(1 0 0 / 0.08)', color: 'oklch(1 0 0 / 0.55)' }}
                >
                  Seu plano atual
                </div>
              ) : (
                <button
                  onClick={() => setChangeTarget({ name: p.name, price: p.price, tag: p.tag, tagColor: p.tagColor })}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm w-full transition-opacity hover:opacity-85"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                >
                  Mudar para <ArrowRight size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Atualizar cartão */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <CreditCard size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Atualizar cartão
            </DialogTitle>
            <DialogDescription>Os dados são processados com segurança via Asaas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCard} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Número do cartão</label>
              <input name="number" inputMode="numeric" defaultValue="4242 4242 4242 4242" placeholder="0000 0000 0000 0000"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Validade</label>
                <input name="exp" defaultValue="09/28" placeholder="MM/AA"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>CVV</label>
                <input name="cvv" inputMode="numeric" maxLength={4} placeholder="123"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Nome impresso no cartão</label>
              <input name="name" defaultValue="Douglas Vargas"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setPaymentOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                Salvar cartão
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancelar plano */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <ShieldAlert size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Cancelar plano {initialPlan}?</DialogTitle>
            <DialogDescription>
              Você manterá o acesso até <strong>{initialPeriodEnd}</strong>. Depois dessa data, perderá:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 rounded-xl p-3.5" style={{ background: 'oklch(0.6 0.18 25 / 0.05)', border: '1px solid oklch(0.6 0.18 25 / 0.15)' }}>
            {['Diagnóstico de solo ilimitado', '2 visitas técnicas por mês', 'Dias de Campo exclusivos', 'Laudo técnico mensal'].map((it) => (
              <li key={it} className="flex items-center gap-2.5 text-[13px]" style={{ color: 'oklch(0.42 0.04 144)' }}>
                <X size={14} style={{ color: 'oklch(0.6 0.18 25)', flexShrink: 0 }} /> {it}
              </li>
            ))}
          </ul>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setCancelOpen(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter meu plano
            </button>
            <button onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)]"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              Confirmar cancelamento
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mudar de plano */}
      <Dialog open={changeTarget !== null} onOpenChange={(o) => !o && setChangeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              Mudar para o plano {changeTarget?.name}?
            </DialogTitle>
            <DialogDescription>A alteração entra em vigor no próximo ciclo de cobrança.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between rounded-xl p-4" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
            <div className="text-center flex-1">
              <div className="text-[10px] font-bold mb-1" style={{ color: 'oklch(0.55 0.04 144)' }}>ATUAL</div>
              <div className="font-bold" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>{initialPlan}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>{initialPrice}/mês</div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--color-earth)' }} />
            <div className="text-center flex-1">
              <div className="text-[10px] font-bold mb-1" style={{ color: changeTarget?.tagColor }}>NOVO</div>
              <div className="font-bold" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>{changeTarget?.name}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>{changeTarget?.price}/mês</div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setChangeTarget(null)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Voltar
            </button>
            <button onClick={handleChangePlan}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
              Confirmar mudança
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ TOASTS ═══════════ */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 w-[min(92vw,360px)]">
        {toasts.map((t) => {
          const accent =
            t.kind === 'danger' ? 'oklch(0.6 0.18 25)' : t.kind === 'info' ? 'oklch(0.55 0.1 220)' : 'var(--color-frutificar-green)'
          return (
            <div
              key={t.id}
              className="toast-in flex items-start gap-3 rounded-2xl p-3.5 bg-white"
              style={{ border: '1px solid oklch(0.91 0.01 144)', boxShadow: '0 16px 44px oklch(0.16 0.07 152 / 0.18)' }}
              role="status"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `color-mix(in oklch, ${accent} 12%, white)` }}>
                <CheckCircle2 size={16} style={{ color: accent }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>{t.title}</p>
                {t.desc && <p className="text-xs mt-0.5" style={{ color: 'oklch(0.5 0.04 144)' }}>{t.desc}</p>}
              </div>
              <button onClick={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} aria-label="Fechar" className="shrink-0 transition-opacity hover:opacity-60">
                <X size={15} style={{ color: 'oklch(0.6 0.04 144)' }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
