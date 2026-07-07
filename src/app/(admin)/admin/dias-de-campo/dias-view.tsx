'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sun, MapPin, Calendar, Users, Pencil, Trash2, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { DateField, TimeField } from '@/components/ui/field-controls'
import {
  createFieldDayAction, updateFieldDayAction, deleteFieldDayAction,
} from '@/server/actions/admin-fielddays'
import type { FieldDayRow } from './data'

const filters = ['Todos', 'Próximos', 'Anteriores'] as const
type Filter = (typeof filters)[number]

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

const MONTHS_BR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const pad = (n: number) => String(n).padStart(2, '0')

function parseISO(s: string): Date | null {
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function formatDateBR(iso: string): string {
  const d = parseISO(iso)
  return d ? `${pad(d.getDate())} ${MONTHS_BR[d.getMonth()]} ${d.getFullYear()}` : iso
}
// "Hoje" para classificar passado/futuro (data atual deste preview)
const TODAY_ISO = '2026-06-25'
function isUpcoming(iso: string): boolean {
  return iso >= TODAY_ISO
}

// Converte data ISO (yyyy-mm-dd) + horário (HH:mm) em um Date para a Server Action.
function toDate(iso: string, time: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  const [hh, mm] = (time || '00:00').split(':').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1, hh || 0, mm || 0)
}

type DraftForm = {
  title: string
  location: string
  date: string
  time: string
  capacity: string
  instructor: string
}

const emptyDraft: DraftForm = {
  title: '', location: '', date: '', time: '', capacity: '', instructor: '',
}

export function DiasDeCampoView({
  initialEvents, preview,
}: {
  initialEvents: FieldDayRow[]
  preview: boolean
}) {
  const router = useRouter()
  const [days, setDays] = useState<FieldDayRow[]>(initialEvents)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setDays(initialEvents) }, [initialEvents])

  const [filter, setFilter] = useState<Filter>('Todos')

  // Novo / Editar — formulário controlado (DateField/TimeField exigem estado)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDraft, setCreateDraft] = useState<DraftForm>(emptyDraft)

  const [editTarget, setEditTarget] = useState<FieldDayRow | null>(null)
  const [editDraft, setEditDraft] = useState<DraftForm>(emptyDraft)

  // Ver inscritos
  const [viewTarget, setViewTarget] = useState<FieldDayRow | null>(null)

  // Encerrar / Remover
  const [removeTarget, setRemoveTarget] = useState<FieldDayRow | null>(null)

  const upcomingCount = days.filter((d) => isUpcoming(d.date)).length
  const pastCount = days.length - upcomingCount

  const visibleDays = days.filter((d) => {
    if (filter === 'Todos') return true
    if (filter === 'Próximos') return isUpcoming(d.date)
    return !isUpcoming(d.date)
  })

  /* ── Ações (otimista + Server Action quando !preview) ── */
  function openCreate() {
    setCreateDraft(emptyDraft)
    setCreateOpen(true)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const title = createDraft.title.trim()
    if (!title) return
    const location = createDraft.location.trim() || 'A definir'
    const instructor = createDraft.instructor.trim() || 'A definir'
    const tmpId = `tmp-${Date.now()}`
    const event: FieldDayRow = {
      id: tmpId,
      title,
      location,
      date: createDraft.date,
      time: createDraft.time,
      instructor,
      capacity: Math.max(0, Number(createDraft.capacity) || 0),
      registered: 0,
    }
    setDays((cur) => [event, ...cur])
    setCreateOpen(false)
    toast.success('Evento criado', { description: title })

    if (!preview) {
      const res = await createFieldDayAction({
        title,
        location,
        date: toDate(createDraft.date, createDraft.time),
        instructor,
        description: '',
      })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  function openEdit(d: FieldDayRow) {
    setEditDraft({
      title: d.title,
      location: d.location,
      date: d.date,
      time: d.time,
      capacity: String(d.capacity),
      instructor: d.instructor,
    })
    setEditTarget(d)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const target = editTarget
    const title = editDraft.title.trim() || target.title
    const location = editDraft.location.trim() || target.location
    const instructor = editDraft.instructor.trim() || target.instructor
    setDays((cur) =>
      cur.map((d) =>
        d.id === target.id
          ? {
              ...d,
              title,
              location,
              date: editDraft.date,
              time: editDraft.time,
              instructor,
              capacity: Math.max(d.registered, Number(editDraft.capacity) || d.capacity),
            }
          : d,
      ),
    )
    setEditTarget(null)
    toast.success('Evento atualizado', { description: title })

    if (!preview) {
      const res = await updateFieldDayAction(target.id, {
        title,
        location,
        date: toDate(editDraft.date, editDraft.time),
        instructor,
      })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    const target = removeTarget
    setDays((cur) => cur.filter((d) => d.id !== target.id))
    setRemoveTarget(null)
    toast.success('Evento encerrado', { description: target.title })

    if (!preview) {
      const res = await deleteFieldDayAction(target.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Dias de Campo</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Eventos presenciais exclusivos plano Gold · {upcomingCount} próximos · {pastCount} anteriores</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo evento
        </button>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={f === filter ? { background: 'var(--color-frutificar-forest)', color: 'white' }
              : { background: 'white', color: 'oklch(0.52 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {visibleDays.map((d) => {
          const pct = d.capacity > 0 ? Math.round((d.registered / d.capacity) * 100) : 0
          const full = d.registered >= d.capacity
          return (
            <div key={d.id} className="rounded-2xl p-5"
              style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'oklch(0.78 0.17 75 / 0.12)' }}>
                  <Sun size={20} style={{ color: 'oklch(0.62 0.15 75)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[15px] leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>{d.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={full
                          ? { background: 'oklch(0.55 0.14 144 / 0.12)', color: 'oklch(0.38 0.1 144)' }
                          : { background: 'oklch(0.78 0.17 75 / 0.12)', color: 'oklch(0.5 0.14 75)' }}>
                        {full ? 'Lotado' : `${d.capacity - d.registered} vagas`}
                      </span>
                      <button onClick={() => setViewTarget(d)} title="Ver inscritos"
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                        <Eye size={15} />
                      </button>
                      <button onClick={() => openEdit(d)} title="Editar"
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setRemoveTarget(d)} title="Encerrar"
                        className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      <Calendar size={11} />{formatDateBR(d.date)}{d.time ? ` · ${d.time}h` : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      <MapPin size={11} />{d.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      <Users size={11} />{d.instructor}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'oklch(0.93 0.01 144)' }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: full ? 'var(--color-frutificar-green)' : 'oklch(0.78 0.17 75)' }} />
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      {d.registered}/{d.capacity} inscritos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {visibleDays.length === 0 && (
          <div className="rounded-2xl p-10 text-center text-sm" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
            Nenhum evento neste filtro.
          </div>
        )}
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo evento */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo evento
            </DialogTitle>
            <DialogDescription>Cadastre um dia de campo presencial exclusivo do plano Gold.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
              <input
                required
                value={createDraft.title}
                onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ex.: Dia de Campo: Manejo de Pragas"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Local</label>
              <input
                value={createDraft.location}
                onChange={(e) => setCreateDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="Ex.: Fazenda Modelo — Patrocínio/MG"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data</label>
                <DateField
                  id="create-date"
                  value={createDraft.date}
                  onChange={(iso) => setCreateDraft((d) => ({ ...d, date: iso }))}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Horário</label>
                <TimeField
                  id="create-time"
                  value={createDraft.time}
                  onValueChange={(v) => setCreateDraft((d) => ({ ...d, time: v }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Vagas</label>
                <input
                  type="number"
                  min={0}
                  value={createDraft.capacity}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, capacity: e.target.value }))}
                  placeholder="Ex.: 30"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Agrônomos</label>
                <input
                  value={createDraft.instructor}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, instructor: e.target.value }))}
                  placeholder="Ex.: Dr. Felipe Moura"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setCreateOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                Criar evento
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar evento */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar evento
            </DialogTitle>
            <DialogDescription>Atualize as informações deste dia de campo.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
                <input
                  required
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Local</label>
                <input
                  value={editDraft.location}
                  onChange={(e) => setEditDraft((d) => ({ ...d, location: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data</label>
                  <DateField
                    id="edit-date"
                    value={editDraft.date}
                    onChange={(iso) => setEditDraft((d) => ({ ...d, date: iso }))}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Horário</label>
                  <TimeField
                    id="edit-time"
                    value={editDraft.time}
                    onValueChange={(v) => setEditDraft((d) => ({ ...d, time: v }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Vagas</label>
                  <input
                    type="number"
                    min={editTarget.registered}
                    value={editDraft.capacity}
                    onChange={(e) => setEditDraft((d) => ({ ...d, capacity: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Agrônomos</label>
                  <input
                    value={editDraft.instructor}
                    onChange={(e) => setEditDraft((d) => ({ ...d, instructor: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                  style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                  Salvar alterações
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Ver inscritos */}
      <Dialog open={viewTarget !== null} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Users size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Inscritos
            </DialogTitle>
            <DialogDescription>{viewTarget?.title}</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>Ocupação</span>
                <span className="text-sm font-bold" style={{ color: 'var(--color-frutificar-green)' }}>
                  {viewTarget.registered} de {viewTarget.capacity} vagas
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'oklch(0.93 0.01 144)' }}>
                  <div className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${viewTarget.capacity > 0 ? Math.round((viewTarget.registered / viewTarget.capacity) * 100) : 0}%`,
                      background: viewTarget.registered >= viewTarget.capacity ? 'var(--color-frutificar-green)' : 'oklch(0.78 0.17 75)',
                    }} />
                </div>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  {viewTarget.capacity > 0 ? Math.round((viewTarget.registered / viewTarget.capacity) * 100) : 0}%
                </span>
              </div>
              <p className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>
                {viewTarget.registered >= viewTarget.capacity
                  ? 'Evento lotado — sem vagas disponíveis.'
                  : `${viewTarget.capacity - viewTarget.registered} vagas ainda disponíveis.`}
              </p>
            </div>
          )}
          <DialogFooter className="pt-1">
            <button type="button" onClick={() => setViewTarget(null)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encerrar evento */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Encerrar evento?</DialogTitle>
            <DialogDescription>
              O evento <strong>{removeTarget?.title}</strong> e suas inscrições serão removidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter evento
            </button>
            <button onClick={handleRemove}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              <X size={14} /> Confirmar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
