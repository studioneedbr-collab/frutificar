'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, TicketPercent, Trash2, Circle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField, DateField } from '@/components/ui/field-controls'
import { createCouponAction, toggleCouponAction, deleteCouponAction } from '@/server/actions/admin-coupons'

export type CouponRow = {
  id: string
  code: string
  discount: string
  duration: 'ONCE' | 'FOREVER'
  plans: string[]
  uses: string
  expires: string
  active: boolean
}

const PLANS = [
  { value: 'ESSENCIAL', label: 'Essencial' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'GOLD', label: 'Gold' },
] as const

const inputStyle: React.CSSProperties = { border: '1px solid oklch(0.91 0.01 144)', background: 'oklch(0.99 0.005 144)' }
const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'
const deep = 'var(--color-frutificar-deep)'
const green = 'var(--color-frutificar-green)'

export function CuponsView({ initial, preview }: { initial: CouponRow[]; preview: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [kind, setKind] = useState<'PERCENT' | 'AMOUNT'>('PERCENT')
  const [duration, setDuration] = useState<'ONCE' | 'FOREVER'>('ONCE')
  const [plans, setPlans] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [removeTarget, setRemoveTarget] = useState<CouponRow | null>(null)

  function openCreate() {
    setKind('PERCENT'); setDuration('ONCE'); setPlans([]); setExpiresAt(''); setCreateOpen(true)
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const payload = {
      code: String(data.get('code') ?? ''),
      kind,
      value: String(data.get('value') ?? ''),
      duration,
      plans,
      maxRedemptions: String(data.get('max') ?? '').trim() ? Number(data.get('max')) : null,
      expiresAt: expiresAt || null,
    }
    if (preview) { setCreateOpen(false); toast.success('Cupom criado (demo)'); return }
    startTransition(async () => {
      const res = await createCouponAction(payload)
      if (!res.ok) { toast.error(res.error); return }
      setCreateOpen(false)
      toast.success('Cupom criado', { description: payload.code.toUpperCase() })
      router.refresh()
    })
  }

  function toggle(c: CouponRow) {
    if (preview) return toast.info('Modo demonstração')
    startTransition(async () => {
      const res = await toggleCouponAction(c.id, !c.active)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    })
  }

  function remove() {
    const c = removeTarget
    if (!c) return
    setRemoveTarget(null)
    if (preview) return toast.info('Modo demonstração')
    startTransition(async () => {
      const res = await deleteCouponAction(c.id)
      if (!res.ok) toast.error(res.error)
      else toast.success(res.data.deleted ? 'Cupom excluído' : 'Cupom já usado: foi desativado para manter o histórico')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: deep, letterSpacing: '-0.03em' }}>Cupons</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Descontos aplicados no checkout pelo aluno</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo cupom
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        {initial.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <TicketPercent size={28} className="mx-auto mb-2" style={{ color: 'oklch(0.7 0.03 144)' }} />
            <p className="text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>Nenhum cupom criado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-bold tracking-wide uppercase text-left" style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.95 0.005 144)' }}>
                  <th className="px-5 py-3">Código</th><th className="px-3 py-3">Desconto</th><th className="px-3 py-3">Vale para</th>
                  <th className="px-3 py-3">Usos</th><th className="px-3 py-3">Expira</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {initial.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid oklch(0.96 0.005 144)' }}>
                    <td className="px-5 py-3 font-mono font-bold" style={{ color: deep }}>{c.code}</td>
                    <td className="px-3 py-3 tabular-nums" style={{ color: deep }}>
                      {c.discount}
                      <span className="block text-[11px]" style={{ color: 'oklch(0.55 0.03 144)' }}>{c.duration === 'ONCE' ? 'só na 1ª cobrança' : 'em todas as cobranças'}</span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'oklch(0.45 0.04 144)' }}>
                      {c.plans.length ? c.plans.map((p) => p.charAt(0) + p.slice(1).toLowerCase()).join(', ') : 'Todos os planos'}
                    </td>
                    <td className="px-3 py-3 tabular-nums" style={{ color: 'oklch(0.45 0.04 144)' }}>{c.uses}</td>
                    <td className="px-3 py-3" style={{ color: 'oklch(0.45 0.04 144)' }}>{c.expires}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: c.active ? 'oklch(0.38 0.1 144)' : 'oklch(0.5 0.03 144)' }}>
                        <Circle size={6} fill={c.active ? 'oklch(0.55 0.14 144)' : 'oklch(0.7 0.02 144)'} style={{ color: 'transparent' }} />
                        {c.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggle(c)} disabled={pending} className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold hover:bg-gray-100 disabled:opacity-50" style={{ color: green }}>
                          {c.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => setRemoveTarget(c)} disabled={pending} title="Excluir" aria-label={`Excluir ${c.code}`} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50" style={{ color: 'oklch(0.6 0.18 25)' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Novo cupom */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: deep }}>Novo cupom</DialogTitle>
            <DialogDescription>O aluno digita o código no checkout.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: deep }} htmlFor="code">Código</label>
              <input id="code" name="code" required maxLength={30} placeholder="EX.: BEMVINDO10" className={`${inputClass} uppercase font-mono`} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: deep }}>Tipo</label>
                <SelectField id="kind" value={kind} onValueChange={(v) => setKind(v as 'PERCENT' | 'AMOUNT')}
                  options={[{ value: 'PERCENT', label: 'Percentual (%)' }, { value: 'AMOUNT', label: 'Valor fixo (R$)' }]} />
              </div>
              <div>
                <label className={labelClass} style={{ color: deep }} htmlFor="value">{kind === 'PERCENT' ? 'Desconto (%)' : 'Desconto (R$)'}</label>
                <input id="value" name="value" type="number" required min={kind === 'PERCENT' ? 1 : 0.01} max={kind === 'PERCENT' ? 100 : 10000} step={kind === 'PERCENT' ? 1 : 0.01} className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: deep }}>Duração</label>
              <SelectField id="duration" value={duration} onValueChange={(v) => setDuration(v as 'ONCE' | 'FOREVER')}
                options={[{ value: 'ONCE', label: 'Só na 1ª cobrança' }, { value: 'FOREVER', label: 'Em todas as cobranças' }]} />
            </div>
            <fieldset>
              <legend className={labelClass} style={{ color: deep }}>Vale para (nenhum marcado = todos)</legend>
              <div className="flex gap-3 flex-wrap">
                {PLANS.map((p) => (
                  <label key={p.value} className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'oklch(0.4 0.04 144)' }}>
                    <input type="checkbox" checked={plans.includes(p.value)}
                      onChange={(e) => setPlans((cur) => e.target.checked ? [...cur, p.value] : cur.filter((x) => x !== p.value))} />
                    {p.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: deep }} htmlFor="max">Limite de usos</label>
                <input id="max" name="max" type="number" min={1} placeholder="Sem limite" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={{ color: deep }}>Expira em</label>
                <DateField id="expires" value={expiresAt} onChange={setExpiresAt} placeholder="Sem validade" />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[oklch(0.96_0.01_144)]" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Cancelar</button>
              <button type="submit" disabled={pending} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 disabled:opacity-60" style={{ background: green }}>Criar cupom</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: deep }}>Excluir cupom {removeTarget?.code}?</DialogTitle>
            <DialogDescription>Se ele já foi usado, será apenas desativado para manter o histórico.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button onClick={() => setRemoveTarget(null)} className="px-4 py-2.5 rounded-xl font-semibold text-sm" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Voltar</button>
            <button onClick={remove} className="px-4 py-2.5 rounded-xl font-semibold text-sm" style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>Excluir</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
