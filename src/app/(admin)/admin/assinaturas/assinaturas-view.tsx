'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, TrendingUp, TrendingDown, Eye, ArrowLeftRight, Ban, RotateCcw, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField, DateField } from '@/components/ui/field-controls'
import {
  cancelSubscriptionAdmin, reactivateSubscriptionAdmin, markSubscriptionPaid, changeSubscriptionPlanAdmin,
} from '@/server/actions/admin-subscriptions'
import type { Plan, Status, Sub } from './data'

const planValue: Record<Plan, string> = {
  GOLD: 'R$ 197',
  PREMIUM: 'R$ 97',
  ESSENCIAL: 'R$ 47',
}

const planStyle: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}
const statusStyle: Record<string, { dot: string; label: string; text: string }> = {
  ACTIVE:   { dot: 'oklch(0.55 0.14 144)', label: 'Ativa',         text: 'oklch(0.38 0.1 144)' },
  PAST_DUE: { dot: 'oklch(0.7 0.15 55)',   label: 'Inadimplente',  text: 'oklch(0.5 0.12 55)' },
  CANCELED: { dot: 'oklch(0.6 0.1 27)',    label: 'Cancelada',     text: 'oklch(0.45 0.1 27)' },
}

const planFilters = ['Todas', 'GOLD', 'PREMIUM', 'ESSENCIAL'] as const
type PlanFilter = (typeof planFilters)[number]

const planOptions = [
  { value: 'ESSENCIAL', label: 'Essencial' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'GOLD', label: 'Gold' },
]
const statusFilterOptions = [
  { value: 'Todos', label: 'Todos os status' },
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'PAST_DUE', label: 'Inadimplente' },
  { value: 'CANCELED', label: 'Cancelada' },
]

const labelClass = 'block text-xs font-semibold mb-1.5'

export function AssinaturasView({
  initialSubscriptions, preview,
}: {
  initialSubscriptions: Sub[]
  preview: boolean
}) {
  const router = useRouter()
  const [subs, setSubs] = useState<Sub[]>(initialSubscriptions)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setSubs(initialSubscriptions) }, [initialSubscriptions])

  const [planFilter, setPlanFilter] = useState<PlanFilter>('Todas')
  const [statusFilter, setStatusFilter] = useState<string>('Todos')

  // Ver detalhes
  const [detailTarget, setDetailTarget] = useState<Sub | null>(null)

  // Alterar plano
  const [planTarget, setPlanTarget] = useState<Sub | null>(null)
  const [newPlan, setNewPlan] = useState<Plan>('ESSENCIAL')

  // Cancelar / Reativar
  const [toggleTarget, setToggleTarget] = useState<Sub | null>(null)

  // Marcar como pago
  const [payTarget, setPayTarget] = useState<Sub | null>(null)
  const [payDate, setPayDate] = useState('')

  const visibleSubs = subs.filter((s) => {
    if (planFilter !== 'Todas' && s.plan !== planFilter) return false
    if (statusFilter !== 'Todos' && s.status !== statusFilter) return false
    return true
  })

  const activeCount = subs.filter((s) => s.status === 'ACTIVE').length
  const pastDueCount = subs.filter((s) => s.status === 'PAST_DUE').length

  const metrics = [
    { label: 'MRR',           value: 'R$ 38.420', trend: '+8%',   up: true },
    { label: 'Assinaturas',   value: String(activeCount),  trend: '+12',   up: true },
    { label: 'Inadimplentes', value: String(pastDueCount), trend: '+3',    up: false },
    { label: 'Churn mensal',  value: '2,4%',      trend: '-0.3%', up: true },
  ]

  /* ── Ações (otimista + Server Action quando !preview) ── */
  async function handleChangePlan() {
    if (!planTarget) return
    const id = planTarget.id
    const name = planTarget.name
    const plan = newPlan
    setSubs((cur) =>
      cur.map((s) => (s.id === id ? { ...s, plan, value: planValue[plan] } : s)),
    )
    setPlanTarget(null)
    toast.success('Plano alterado', { description: `${name} · ${planValue[plan]}/mês` })

    if (!preview) {
      const res = await changeSubscriptionPlanAdmin(id, { plan })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleToggleStatus() {
    if (!toggleTarget) return
    const id = toggleTarget.id
    const wasCanceled = toggleTarget.status === 'CANCELED'
    const next: Status = wasCanceled ? 'ACTIVE' : 'CANCELED'
    const name = toggleTarget.name
    setSubs((cur) => cur.map((s) => (s.id === id ? { ...s, status: next } : s)))
    setToggleTarget(null)
    toast.success(next === 'CANCELED' ? 'Assinatura cancelada' : 'Assinatura reativada', { description: name })

    if (!preview) {
      const res = wasCanceled
        ? await reactivateSubscriptionAdmin(id)
        : await cancelSubscriptionAdmin(id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleMarkPaid() {
    if (!payTarget) return
    const id = payTarget.id
    const name = payTarget.name
    setSubs((cur) => cur.map((s) => (s.id === id ? { ...s, status: 'ACTIVE' } : s)))
    setPayTarget(null)
    setPayDate('')
    toast.success('Pagamento confirmado', { description: name })

    if (!preview) {
      const res = await markSubscriptionPaid(id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Assinaturas</h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Gestão de receita recorrente</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.58 0.03 144)' }}>{m.label}</span>
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: m.up ? 'oklch(0.48 0.13 144)' : 'oklch(0.52 0.18 27)' }}>
                {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{m.trend}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.04em' }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b gap-3 flex-wrap" style={{ borderColor: 'oklch(0.93 0.005 144)' }}>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>Assinaturas ativas</h2>
          <div className="flex gap-2 items-center">
            <div className="flex gap-2">
              {planFilters.map((f) => (
                <button key={f} onClick={() => setPlanFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={f === planFilter ? { background: 'var(--color-frutificar-forest)', color: 'white' }
                    : { background: 'oklch(0.96 0.01 144)', color: 'oklch(0.52 0.04 144)' }}>
                  {f}
                </button>
              ))}
            </div>
            <div className="w-44">
              <SelectField
                id="status-filter"
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={statusFilterOptions}
                placeholder="Status"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.95 0.005 144)', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.4fr' }}>
          <span>Assinante</span><span>Plano</span><span>Valor</span><span>Status</span><span>Renovação</span><span className="text-right">Ações</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {visibleSubs.map((s) => {
            const plan = planStyle[s.plan]; const status = statusStyle[s.status]
            return (
              <div key={s.id} className="grid gap-4 px-5 py-3.5 items-center hover:bg-[oklch(0.985_0_0)] transition-colors"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.4fr' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--color-frutificar-forest)' }}>
                    {s.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{s.name}</p>
                    <p className="text-[11px]" style={{ color: 'oklch(0.6 0.02 144)' }}>{s.gateway}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full w-fit" style={{ background: plan.bg, color: plan.text }}>{s.plan}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{s.value}<span className="text-xs font-normal" style={{ color: 'oklch(0.58 0.03 144)' }}>/mês</span></span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: status.text }}>
                  <Circle size={6} fill={status.dot} style={{ color: status.dot }} />{status.label}
                </span>
                <span className="text-xs" style={{ color: 'oklch(0.62 0.02 144)' }}>{s.renewal}</span>
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setDetailTarget(s)} title="Ver detalhes"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'oklch(0.6 0.02 144)' }}>
                    <Eye size={15} />
                  </button>
                  <button onClick={() => { setNewPlan(s.plan); setPlanTarget(s) }} title="Alterar plano"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'oklch(0.6 0.02 144)' }}>
                    <ArrowLeftRight size={15} />
                  </button>
                  {s.status === 'PAST_DUE' && (
                    <button onClick={() => { setPayDate(''); setPayTarget(s) }} title="Marcar como pago"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.55_0.14_144_/_0.1)]" style={{ color: 'var(--color-frutificar-green)' }}>
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                  {s.status === 'CANCELED' ? (
                    <button onClick={() => setToggleTarget(s)} title="Reativar"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.55_0.14_144_/_0.1)]" style={{ color: 'var(--color-frutificar-green)' }}>
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button onClick={() => setToggleTarget(s)} title="Cancelar"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                      <Ban size={15} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {visibleSubs.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Nenhuma assinatura neste filtro.
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Ver detalhes */}
      <Dialog open={detailTarget !== null} onOpenChange={(o) => !o && setDetailTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Eye size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Detalhes da assinatura
            </DialogTitle>
            <DialogDescription>{detailTarget?.gateway}</DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-3">
              {[
                { label: 'Usuário', node: <span className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{detailTarget.name}</span> },
                { label: 'Plano', node: (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: planStyle[detailTarget.plan].bg, color: planStyle[detailTarget.plan].text }}>
                    {detailTarget.plan} · {detailTarget.value}/mês
                  </span>
                ) },
                { label: 'Status', node: (
                  <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: statusStyle[detailTarget.status].text }}>
                    <Circle size={6} fill={statusStyle[detailTarget.status].dot} style={{ color: statusStyle[detailTarget.status].dot }} />
                    {statusStyle[detailTarget.status].label}
                  </span>
                ) },
                { label: 'Próxima cobrança', node: <span className="text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{detailTarget.renewal}</span> },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'oklch(0.58 0.03 144)' }}>{row.label}</span>
                  {row.node}
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="pt-1">
            <button type="button" onClick={() => setDetailTarget(null)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alterar plano */}
      <Dialog open={planTarget !== null} onOpenChange={(o) => !o && setPlanTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <ArrowLeftRight size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Alterar plano
            </DialogTitle>
            <DialogDescription>{planTarget?.name}</DialogDescription>
          </DialogHeader>
          {planTarget && (
            <div className="space-y-3.5">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Novo plano</label>
                <SelectField
                  id="change-plan"
                  value={newPlan}
                  onValueChange={(v) => setNewPlan(v as Plan)}
                  options={planOptions}
                  placeholder="Selecione"
                />
              </div>
              <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)', color: 'oklch(0.52 0.04 144)' }}>
                Novo valor: <strong style={{ color: 'var(--color-frutificar-deep)' }}>{planValue[newPlan]}/mês</strong>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button type="button" onClick={() => setPlanTarget(null)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleChangePlan}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Salvar plano
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancelar / Reativar */}
      <Dialog open={toggleTarget !== null} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {toggleTarget?.status === 'CANCELED' ? (
              <>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.55 0.14 144 / 0.12)' }}>
                  <RotateCcw size={20} style={{ color: 'var(--color-frutificar-green)' }} />
                </div>
                <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Reativar assinatura?</DialogTitle>
                <DialogDescription>
                  A assinatura de <strong>{toggleTarget?.name}</strong> voltará ao status ativo.
                </DialogDescription>
              </>
            ) : (
              <>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
                  <Ban size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
                </div>
                <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Cancelar assinatura?</DialogTitle>
                <DialogDescription>
                  A assinatura de <strong>{toggleTarget?.name}</strong> será marcada como cancelada.
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setToggleTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Voltar
            </button>
            {toggleTarget?.status === 'CANCELED' ? (
              <button onClick={handleToggleStatus}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.55_0.14_144_/_0.08)] inline-flex items-center gap-1.5"
                style={{ color: 'var(--color-frutificar-green)', border: '1px solid oklch(0.55 0.14 144 / 0.35)' }}>
                <RotateCcw size={14} /> Confirmar reativação
              </button>
            ) : (
              <button onClick={handleToggleStatus}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5"
                style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
                <X size={14} /> Confirmar cancelamento
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Marcar como pago */}
      <Dialog open={payTarget !== null} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Marcar como pago
            </DialogTitle>
            <DialogDescription>
              Confirme o pagamento de <strong>{payTarget?.name}</strong>. A assinatura voltará ao status ativo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)', color: 'oklch(0.52 0.04 144)' }}>
              Valor: <strong style={{ color: 'var(--color-frutificar-deep)' }}>{payTarget?.value}/mês</strong>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data do pagamento</label>
              <DateField id="pay-date" value={payDate} onChange={setPayDate} placeholder="Selecione a data" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button type="button" onClick={() => setPayTarget(null)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleMarkPaid}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Confirmar pagamento
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
