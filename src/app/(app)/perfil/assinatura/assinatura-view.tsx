'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Crown, CheckCircle2, CreditCard, FileText, Download,
  ArrowRight, Calendar, ShieldAlert, ShieldCheck, X, RotateCcw, ExternalLink,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { gerarRecibo } from '@/lib/reports'
import {
  changePlan, upgradePlan, cancelSubscription, reactivateSubscription,
} from '@/server/actions/subscription'

/* Plano, status, forma de pagamento e histórico vêm do banco (page.tsx).
   Dados de cartão NUNCA passam por esta tela: pagamento e troca de cartão
   acontecem só na página segura do Asaas (fatura). */

export type SubStatus = 'PENDING' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
export type PlanOption = { name: string; price: string; amount: number; features: string[] }
type PaymentRow = { date: string; desc: string; value: string; method: string }

const statusInfo: Record<SubStatus, { label: string; bg: string; fg: string; dot: string }> = {
  ACTIVE:   { label: 'Ativo', bg: 'oklch(0.48 0.13 144 / 0.25)', fg: 'oklch(0.83 0.08 144)', dot: 'oklch(0.78 0.14 144)' },
  TRIALING: { label: 'Teste', bg: 'oklch(0.6 0.1 220 / 0.25)', fg: 'oklch(0.85 0.06 220)', dot: 'oklch(0.75 0.1 220)' },
  PENDING:  { label: 'Aguardando pagamento', bg: 'oklch(0.72 0.12 85 / 0.22)', fg: 'oklch(0.88 0.08 85)', dot: 'oklch(0.8 0.12 85)' },
  PAST_DUE: { label: 'Pagamento em atraso', bg: 'oklch(0.72 0.12 55 / 0.22)', fg: 'oklch(0.85 0.1 55)', dot: 'oklch(0.78 0.14 55)' },
  CANCELED: { label: 'Cancelado', bg: 'oklch(0.6 0.18 25 / 0.2)', fg: 'oklch(0.78 0.12 25)', dot: 'oklch(0.7 0.18 25)' },
}

const PLAN_TAG: Record<string, string> = {
  Essencial: 'oklch(0.65 0.12 225)',
  Premium: 'oklch(0.62 0.12 55)',
  Gold: 'oklch(0.78 0.17 75)',
}

type ToastKind = 'success' | 'info' | 'danger'
type Toast = { id: number; title: string; desc?: string; kind: ToastKind }

export function AssinaturaView({
  planName, planPrice, planAmount, cycle, planFeatures, status, periodEnd, paymentMethod, openInvoiceUrl,
  payerName, payments, plans, preview,
}: {
  planName: string
  planPrice: string
  planAmount: number
  cycle: 'MONTHLY' | 'YEARLY'
  planFeatures: string[]
  status: SubStatus
  periodEnd: string
  paymentMethod: string | null
  openInvoiceUrl: string | null
  payerName: string
  payments: PaymentRow[]
  plans: PlanOption[]
  preview: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [cancelOpen, setCancelOpen] = useState(false)
  const [changeTarget, setChangeTarget] = useState<PlanOption | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  function notify(title: string, desc?: string, kind: ToastKind = 'success') {
    setToasts((t) => [...t, { id: Date.now() + t.length, title, desc, kind }])
  }

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 4000),
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts])

  const cancelled = status === 'CANCELED'
  const per = cycle === 'YEARLY' ? '/ano' : '/mês'
  const st = statusInfo[status] ?? statusInfo.ACTIVE

  /* ── Ações (o servidor é a fonte da verdade; a tela recarrega os dados) ── */
  function handleCancel() {
    setCancelOpen(false)
    if (preview) return notify('Assinatura cancelada (demo)')
    startTransition(async () => {
      const res = await cancelSubscription()
      if (res.ok) notify('Assinatura cancelada', 'As cobranças futuras foram interrompidas.', 'danger')
      else notify('Erro ao cancelar', res.error, 'danger')
      router.refresh()
    })
  }

  function handleReactivate() {
    if (preview) return notify('Assinatura reativada (demo)')
    startTransition(async () => {
      const res = await reactivateSubscription()
      if (res.ok) {
        notify('Assinatura reativada')
        router.refresh()
      } else if (res.error.includes('/checkout')) {
        router.push('/checkout')
      } else {
        notify('Erro ao reativar', res.error, 'danger')
      }
    })
  }

  function handleChangePlan() {
    if (!changeTarget) return
    const target = changeTarget
    setChangeTarget(null)
    if (preview) return notify(`Mudança para o ${target.name} (demo)`, undefined, 'info')
    const planCode = target.name.toUpperCase() as 'ESSENCIAL' | 'PREMIUM' | 'GOLD'
    if (target.amount > planAmount) {
      // Upgrade: paga só a diferença proporcional; o plano muda ao confirmar.
      startTransition(async () => {
        const res = await upgradePlan({ plan: planCode })
        if (!res.ok) return notify('Não foi possível fazer o upgrade', res.error, 'danger')
        if (res.data.applied) {
          notify(`Plano alterado para ${target.name}`, 'Os novos recursos já estão liberados.')
          router.refresh()
        } else {
          window.open(res.data.invoiceUrl, '_blank', 'noopener')
          notify(
            'Pague a diferença para liberar o upgrade',
            `Valor proporcional: ${res.data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. O plano muda assim que o pagamento confirmar.`,
            'info',
          )
        }
      })
      return
    }
    startTransition(async () => {
      const res = await changePlan({
        plan: target.name.toUpperCase() as 'ESSENCIAL' | 'PREMIUM' | 'GOLD',
      })
      if (res.ok) {
        notify(`Plano alterado para ${target.name}`, 'Vale a partir da próxima cobrança.', 'info')
        router.refresh()
      } else {
        notify('Não foi possível mudar de plano', res.error, 'danger')
      }
    })
  }

  function handleReceipt(p: PaymentRow) {
    gerarRecibo({
      plano: planName,
      valor: p.value,
      data: p.date,
      metodo: `${p.method} · Asaas`,
      pagador: payerName || '—',
    })
    notify('Recibo gerado', `Comprovante de ${p.date} (PDF) baixado.`, 'success')
  }

  const card = { background: 'white', border: '1px solid oklch(0.91 0.01 144)' }
  const heading = { color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }

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
        <div className="text-xs font-bold tracking-widest mb-1.5" style={{ color: 'var(--color-earth)' }}>ASSINATURA</div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ ...heading, letterSpacing: '-0.02em' }}>Minha Assinatura</h1>
        <p className="text-sm mt-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>Gerencie seu plano, pagamento e histórico.</p>
      </header>

      {/* ── Plano atual ── */}
      <section
        className="dash-anim relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.24 0.09 144))', animationDelay: '0.08s' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 85% 0%, oklch(0.78 0.17 75 / 0.14), transparent 60%)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.78 0.17 75 / 0.16)' }}>
                <Crown size={17} style={{ color: 'oklch(0.78 0.14 75)' }} />
              </span>
              <span className="text-[11px] font-bold tracking-widest" style={{ color: 'oklch(0.78 0.14 75)' }}>PLANO ATUAL</span>
            </div>
            <div className="flex flex-wrap items-end gap-3 mb-2">
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>{planName}</h2>
              <span className="text-sm mb-1" style={{ color: 'oklch(1 0 0 / 0.7)' }}>
                <strong className="text-white">{planPrice}</strong>{per}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full mb-1 inline-flex items-center gap-1.5" style={{ background: st.bg, color: st.fg }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                {st.label}
              </span>
            </div>
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'oklch(1 0 0 / 0.55)' }}>
              <Calendar size={13} />
              {cancelled
                ? <>Assinatura cancelada · sem novas cobranças</>
                : <>Período atual até <strong style={{ color: 'oklch(1 0 0 / 0.8)' }}>{periodEnd}</strong></>}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {openInvoiceUrl && (
              <a
                href={openInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
              >
                <CreditCard size={16} /> Pagar fatura em aberto <ExternalLink size={13} />
              </a>
            )}
            {cancelled ? (
              <button
                onClick={handleReactivate}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-white/10 disabled:opacity-60"
                style={{ color: 'oklch(0.83 0.08 144)', border: '1px solid oklch(0.48 0.13 144 / 0.4)' }}
              >
                <RotateCcw size={15} /> Reativar plano
              </button>
            ) : (
              <button
                onClick={() => setCancelOpen(true)}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-white/5 disabled:opacity-60"
                style={{ color: 'oklch(0.72 0.12 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}
              >
                Cancelar plano
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Benefícios (do plano real) ── */}
      {planFeatures.length > 0 && (
        <section className="dash-anim rounded-2xl p-6" style={{ ...card, animationDelay: '0.14s' }}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={heading}>
            <CheckCircle2 size={18} style={{ color: 'oklch(0.62 0.14 75)' }} /> Benefícios do seu plano
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
            {planFeatures.map((b) => (
              <div key={b} className="flex items-center gap-2.5">
                <CheckCircle2 size={16} style={{ color: 'oklch(0.62 0.14 75)', flexShrink: 0 }} />
                <span className="text-sm font-medium" style={{ color: 'oklch(0.42 0.04 144)' }}>{b}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Forma de pagamento (sem dados de cartão no nosso site) ── */}
      <section className="dash-anim rounded-2xl p-6" style={{ ...card, animationDelay: '0.2s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={heading}>
          <CreditCard size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Forma de pagamento
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-4" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>
              {paymentMethod ?? 'Ainda sem pagamento confirmado'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Processado com segurança pelo Asaas. Os dados do cartão são digitados só na página do Asaas — nunca aqui.
              {' '}As próximas faturas chegam por e-mail.
            </p>
          </div>
        </div>
      </section>

      {/* ── Histórico de pagamentos ── */}
      <section className="dash-anim rounded-2xl p-6" style={{ ...card, animationDelay: '0.26s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={heading}>
          <FileText size={18} style={{ color: 'var(--color-earth)' }} /> Histórico de pagamentos
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>Nenhum pagamento confirmado ainda.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p, i) => (
              <div key={`${p.date}-${i}`} className="flex items-center gap-3 sm:gap-4 rounded-xl px-3 sm:px-4 py-3" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                <div className="w-[96px] shrink-0 text-sm font-semibold tabular-nums" style={{ color: 'var(--color-frutificar-deep)' }}>{p.date}</div>
                <div className="min-w-0 flex-1 text-sm truncate" style={{ color: 'oklch(0.5 0.04 144)' }}>{p.desc} · {p.method}</div>
                <div className="w-[88px] shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: 'var(--color-frutificar-deep)' }}>{p.value}</div>
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 items-center justify-center w-14" style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}>
                  Pago
                </span>
                <button onClick={() => handleReceipt(p)} className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-opacity hover:opacity-70" style={{ color: 'var(--color-earth)' }}>
                  <Download size={13} /> <span className="hidden sm:inline">Recibo</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Mudar de plano ── */}
      {plans.length > 0 && (
        <section className="dash-anim" style={{ animationDelay: '0.32s' }}>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={heading}>
            <ArrowRight size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Mudar de plano
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {plans.map((p) => {
              const current = p.name === planName
              const tag = PLAN_TAG[p.name] ?? 'oklch(0.55 0.1 144)'
              return (
                <div
                  key={p.name}
                  className={current ? 'rounded-2xl p-5 relative' : 'dash-lift rounded-2xl p-5 relative'}
                  style={current
                    ? { background: 'linear-gradient(160deg, var(--color-frutificar-night), oklch(0.24 0.09 144))', border: '1.5px solid oklch(1 0 0 / 0.12)', boxShadow: '0 18px 48px oklch(0.16 0.07 152 / 0.25)' }
                    : card}
                >
                  {current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ background: 'oklch(0.78 0.17 75)', color: 'oklch(0.24 0.09 144)' }}>
                      Plano atual
                    </div>
                  )}
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-3" style={{ background: `color-mix(in oklch, ${tag} 14%, transparent)`, color: tag }}>
                    {p.name.toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: current ? 'white' : 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>{p.name}</h3>
                  <div className="flex items-end gap-1 mb-4">
                    <span className="text-3xl font-bold tabular-nums" style={{ color: current ? 'white' : 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>{p.price}</span>
                    <span className="text-sm mb-1" style={{ color: current ? 'oklch(1 0 0 / 0.4)' : 'oklch(0.6 0.02 144)' }}>{per}</span>
                  </div>
                  <ul className="space-y-2 mb-5">
                    {p.features.slice(0, 4).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[13px]">
                        <CheckCircle2 size={13} style={{ color: current ? 'oklch(0.78 0.14 75)' : 'var(--color-frutificar-green)', flexShrink: 0 }} />
                        <span style={{ color: current ? 'oklch(1 0 0 / 0.72)' : 'oklch(0.42 0.04 144)' }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {current ? (
                    <div className="block text-center py-2.5 rounded-xl font-bold text-sm w-full" style={{ background: 'oklch(1 0 0 / 0.08)', color: 'oklch(1 0 0 / 0.55)' }}>Seu plano atual</div>
                  ) : (
                    <button
                      onClick={() => setChangeTarget(p)}
                      disabled={pending || cancelled}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm w-full transition-opacity hover:opacity-85 disabled:opacity-50"
                      style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                    >
                      Mudar para <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Cancelar plano */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <ShieldAlert size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={heading}>Cancelar plano {planName}?</DialogTitle>
            <DialogDescription>
              As cobranças futuras param e o acesso à plataforma é encerrado. Você perde:
            </DialogDescription>
          </DialogHeader>
          {planFeatures.length > 0 && (
            <ul className="space-y-2 rounded-xl p-3.5" style={{ background: 'oklch(0.6 0.18 25 / 0.05)', border: '1px solid oklch(0.6 0.18 25 / 0.15)' }}>
              {planFeatures.slice(0, 5).map((it) => (
                <li key={it} className="flex items-center gap-2.5 text-[13px]" style={{ color: 'oklch(0.42 0.04 144)' }}>
                  <X size={14} style={{ color: 'oklch(0.6 0.18 25)', flexShrink: 0 }} /> {it}
                </li>
              ))}
            </ul>
          )}
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setCancelOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: 'var(--color-frutificar-green)' }}>
              Manter meu plano
            </button>
            <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)]" style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              Confirmar cancelamento
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mudar de plano */}
      <Dialog open={changeTarget !== null} onOpenChange={(o) => !o && setChangeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={heading}>Mudar para o plano {changeTarget?.name}?</DialogTitle>
            <DialogDescription>
              {changeTarget && changeTarget.amount > planAmount
                ? 'Você paga agora só a diferença proporcional aos dias que faltam; o novo plano é liberado assim que o pagamento confirmar.'
                : 'O novo valor vale a partir da próxima cobrança.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between rounded-xl p-4" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
            <div className="text-center flex-1">
              <div className="text-[10px] font-bold mb-1" style={{ color: 'oklch(0.55 0.04 144)' }}>ATUAL</div>
              <div className="font-bold" style={heading}>{planName}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>{planPrice}{per}</div>
            </div>
            <ArrowRight size={18} style={{ color: 'var(--color-earth)' }} />
            <div className="text-center flex-1">
              <div className="text-[10px] font-bold mb-1" style={{ color: 'oklch(0.55 0.04 144)' }}>NOVO</div>
              <div className="font-bold" style={heading}>{changeTarget?.name}</div>
              <div className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>{changeTarget?.price}{per}</div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setChangeTarget(null)} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Voltar
            </button>
            <button onClick={handleChangePlan} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: 'var(--color-earth)' }}>
              Confirmar mudança
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2.5 w-[min(92vw,360px)]">
        {toasts.map((t) => {
          const accent = t.kind === 'danger' ? 'oklch(0.6 0.18 25)' : t.kind === 'info' ? 'oklch(0.55 0.1 220)' : 'var(--color-frutificar-green)'
          return (
            <div key={t.id} className="toast-in flex items-start gap-3 rounded-2xl p-3.5 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', boxShadow: '0 16px 44px oklch(0.16 0.07 152 / 0.18)' }} role="status">
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
