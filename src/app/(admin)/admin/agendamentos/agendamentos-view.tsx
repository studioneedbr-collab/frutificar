'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Circle, Check, X, CheckCheck, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField, DateField } from '@/components/ui/field-controls'
import { acceptVisit, rejectVisit, completeVisit, assignVisitAction } from '@/server/actions/admin'
import type { Visit, Status } from './data'

const statusStyle: Record<Status, { dot: string; label: string; text: string; bg: string }> = {
  REQUESTED:  { dot: 'oklch(0.55 0.1 220)',  label: 'Solicitado',  text: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)' },
  CONFIRMED:  { dot: 'oklch(0.62 0.12 55)',  label: 'Confirmado',  text: 'oklch(0.44 0.12 55)',  bg: 'oklch(0.62 0.12 55 / 0.1)' },
  COMPLETED:  { dot: 'oklch(0.55 0.14 144)', label: 'Realizado',   text: 'oklch(0.38 0.1 144)',  bg: 'oklch(0.48 0.13 144 / 0.1)' },
  CANCELED:   { dot: 'oklch(0.6 0.1 27)',    label: 'Cancelado',   text: 'oklch(0.45 0.1 27)',   bg: 'oklch(0.95 0.03 27)' },
}

const filterOptions = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'REQUESTED', label: 'Solicitados' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'COMPLETED', label: 'Realizados' },
  { value: 'CANCELED', label: 'Cancelados' },
]

const agronomistOptions = [
  { value: 'Helena Prado', label: 'Helena Prado' },
  { value: 'Marcos Lima', label: 'Marcos Lima' },
  { value: 'Beatriz Nunes', label: 'Beatriz Nunes' },
]

const labelClass = 'block text-xs font-semibold mb-1.5'

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
// Converte ISO (yyyy-mm-dd) para o formato exibido na tabela (dd mmm yyyy).
function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${String(d).padStart(2, '0')} ${MONTHS_PT[m - 1]} ${y}`
}

export function AgendamentosView({
  initialVisits, preview,
}: {
  initialVisits: Visit[]
  preview: boolean
}) {
  const router = useRouter()
  const [visits, setVisits] = useState<Visit[]>(initialVisits)
  const [filter, setFilter] = useState<string>('ALL')

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setVisits(initialVisits) }, [initialVisits])

  // Cancelar/Recusar
  const [cancelTarget, setCancelTarget] = useState<Visit | null>(null)

  // Atribuir agrônomo
  const [assignTarget, setAssignTarget] = useState<Visit | null>(null)
  const [assignAgro, setAssignAgro] = useState<string>('')
  const [assignDate, setAssignDate] = useState<string>('')

  const visibleVisits = visits.filter((v) => filter === 'ALL' || v.status === filter)

  const summary = [
    { label: 'Solicitados', value: visits.filter((v) => v.status === 'REQUESTED').length, color: 'oklch(0.55 0.1 220)' },
    { label: 'Confirmados', value: visits.filter((v) => v.status === 'CONFIRMED').length, color: 'oklch(0.62 0.12 55)' },
    { label: 'Realizados',  value: visits.filter((v) => v.status === 'COMPLETED').length, color: 'oklch(0.55 0.14 144)' },
    { label: 'Cancelados',  value: visits.filter((v) => v.status === 'CANCELED').length, color: 'oklch(0.6 0.1 27)' },
  ]

  function setStatus(id: string, status: Status) {
    setVisits((cur) => cur.map((v) => (v.id === id ? { ...v, status } : v)))
  }

  async function handleConfirm(v: Visit) {
    setStatus(v.id, 'CONFIRMED')
    toast.success('Visita confirmada', { description: `${v.user} · ${v.property}` })
    if (!preview) {
      const res = await acceptVisit(v.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleComplete(v: Visit) {
    setStatus(v.id, 'COMPLETED')
    toast.success('Visita concluída', { description: `${v.user} · ${v.property}` })
    if (!preview) {
      const res = await completeVisit(v.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return
    const v = cancelTarget
    setStatus(v.id, 'CANCELED')
    setCancelTarget(null)
    toast.success('Visita cancelada', { description: `${v.user} · ${v.property}` })
    if (!preview) {
      const res = await rejectVisit(v.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  function openAssign(v: Visit) {
    setAssignAgro(v.agronomist ?? '')
    setAssignDate('')
    setAssignTarget(v)
  }

  async function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!assignTarget || !assignAgro) return
    const target = assignTarget
    const newDate = assignDate ? isoToDisplay(assignDate) : target.date
    setVisits((cur) =>
      cur.map((v) => (v.id === target.id ? { ...v, agronomist: assignAgro, date: newDate, status: 'CONFIRMED' } : v)),
    )
    toast.success('Agrônomo atribuído', { description: `${assignAgro} · ${target.user}` })
    setAssignTarget(null)
    if (!preview) {
      const res = await assignVisitAction(target.id, { agronomist: assignAgro, date: assignDate || undefined })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  const iconBtnBase = 'p-1.5 rounded-lg transition-colors'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Agendamentos</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Visitas técnicas solicitadas pelos produtores</p>
        </div>
        <div className="w-52">
          <SelectField
            id="status-filter"
            value={filter}
            onValueChange={setFilter}
            options={filterOptions}
            placeholder="Filtrar status"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
            <Circle size={8} fill={s.color} style={{ color: s.color, flexShrink: 0 }} />
            <div>
              <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.04em' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <div className="grid gap-3 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.93 0.005 144)', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto' }}>
          <span>Produtor</span><span>Motivo</span><span>Data</span><span>Status</span><span />
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {visibleVisits.map((v) => {
            const s = statusStyle[v.status]
            return (
              <div key={v.id} className="grid gap-3 px-5 py-4 items-start hover:bg-[oklch(0.985_0_0)] transition-colors"
                style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{v.user}</p>
                  <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>
                    <MapPin size={10} />{v.property}
                  </span>
                  {v.agronomist && (
                    <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--color-frutificar-green)' }}>
                      <UserCog size={10} />{v.agronomist}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-snug" style={{ color: 'oklch(0.48 0.04 144)' }}>{v.reason}</p>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Calendar size={11} />{v.date}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold w-fit px-2 py-1 rounded-lg"
                  style={{ background: s.bg, color: s.text }}>
                  <Circle size={5} fill={s.dot} style={{ color: s.dot }} />{s.label}
                </span>
                <div className="flex items-center gap-1">
                  {v.status === 'REQUESTED' && (
                    <button onClick={() => handleConfirm(v)} title="Confirmar"
                      className={`${iconBtnBase} hover:bg-[oklch(0.62_0.12_55_/_0.1)]`} style={{ color: 'oklch(0.5 0.12 55)' }}>
                      <Check size={14} />
                    </button>
                  )}
                  {v.status === 'CONFIRMED' && (
                    <button onClick={() => handleComplete(v)} title="Concluir"
                      className={`${iconBtnBase} hover:bg-[oklch(0.48_0.13_144_/_0.1)]`} style={{ color: 'var(--color-frutificar-green)' }}>
                      <CheckCheck size={14} />
                    </button>
                  )}
                  {(v.status === 'REQUESTED' || v.status === 'CONFIRMED') && (
                    <>
                      <button onClick={() => openAssign(v)} title="Atribuir agrônomo"
                        className={`${iconBtnBase} hover:bg-gray-100`} style={{ color: 'oklch(0.6 0.02 144)' }}>
                        <UserCog size={14} />
                      </button>
                      <button onClick={() => setCancelTarget(v)} title={v.status === 'REQUESTED' ? 'Recusar' : 'Cancelar'}
                        className={`${iconBtnBase} hover:bg-[oklch(0.6_0.18_25_/_0.08)]`} style={{ color: 'oklch(0.6 0.18 25)' }}>
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {visibleVisits.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Nenhuma visita neste filtro.
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Recusar / Cancelar */}
      <Dialog open={cancelTarget !== null} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <X size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              {cancelTarget?.status === 'REQUESTED' ? 'Recusar visita?' : 'Cancelar visita?'}
            </DialogTitle>
            <DialogDescription>
              A visita de <strong>{cancelTarget?.user}</strong> em <strong>{cancelTarget?.property}</strong> será marcada como cancelada. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setCancelTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter visita
            </button>
            <button onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              <X size={14} /> {cancelTarget?.status === 'REQUESTED' ? 'Confirmar recusa' : 'Confirmar cancelamento'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atribuir agrônomo */}
      <Dialog open={assignTarget !== null} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <UserCog size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Atribuir agrônomo
            </DialogTitle>
            <DialogDescription>{assignTarget?.user} · {assignTarget?.property}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Agrônomo</label>
              <SelectField
                id="assign-agro"
                value={assignAgro}
                onValueChange={setAssignAgro}
                options={agronomistOptions}
                placeholder="Selecione o agrônomo"
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data da visita</label>
              <DateField
                id="assign-date"
                value={assignDate}
                onChange={setAssignDate}
                placeholder="Manter data atual"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setAssignTarget(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={!assignAgro}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                Atribuir
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
