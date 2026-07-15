'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Radio, Calendar, Clock, Eye, Pencil, Trash2, X, Play, Square } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField, DateField, TimeField } from '@/components/ui/field-controls'
import {
  createLiveAction, updateLiveAction, setLiveStatusAction, deleteLiveAction,
} from '@/server/actions/admin-lives'
import type { Live, Plan, Status } from './data'

const statusStyle: Record<Status, { dot: string; label: string; text: string; bg: string }> = {
  LIVE:      { dot: 'oklch(0.6 0.2 27)',   label: 'Ao Vivo',   text: 'oklch(0.45 0.18 27)',  bg: 'oklch(0.95 0.04 27)' },
  SCHEDULED: { dot: 'oklch(0.55 0.1 220)', label: 'Agendada',  text: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)' },
  ENDED:     { dot: 'oklch(0.6 0.02 144)', label: 'Encerrada', text: 'oklch(0.52 0.04 144)', bg: 'oklch(0.94 0.01 144)' },
}
const planStyle: Record<Plan, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}

const MONTHS_BR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const pad = (n: number) => String(n).padStart(2, '0')

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${pad(d)} ${MONTHS_BR[m - 1]} ${y}`
}
function formatTimeBR(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':')
  return `${h}h${m}`
}

// Combina os campos de data (yyyy-mm-dd) e horário (HH:MM) num Date para o banco.
function toScheduledAt(date: string, time: string): Date {
  return new Date(`${date || '1970-01-01'}T${time || '00:00'}:00`)
}

// Extrai o ID do vídeo de um link do YouTube (aceita youtu.be, watch?v=, /embed/, /live/
// ou o próprio ID de 11 caracteres colado direto).
function extractYouTubeId(input: string): string {
  const value = input.trim()
  if (!value) return ''
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|live|shorts)\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const re of patterns) {
    const m = value.match(re)
    if (m) return m[1]
  }
  return ''
}

const planOptions = [
  { value: 'ESSENCIAL', label: 'Essencial' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'GOLD', label: 'Gold' },
]
const statusOptions = [
  { value: 'SCHEDULED', label: 'Agendada' },
  { value: 'LIVE', label: 'Ao vivo' },
  { value: 'ENDED', label: 'Encerrada' },
]
const filterOptions = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'SCHEDULED', label: 'Agendadas' },
  { value: 'LIVE', label: 'Ao vivo' },
  { value: 'ENDED', label: 'Encerradas' },
]

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

type FormState = {
  title: string
  agronomist: string
  plan: Plan
  status: Status
  date: string
  time: string
  youtubeUrl: string
}

const emptyForm: FormState = {
  title: '',
  agronomist: '',
  plan: 'ESSENCIAL',
  status: 'SCHEDULED',
  date: '',
  time: '',
  youtubeUrl: '',
}

export function LivesView({
  initialLives, preview,
}: {
  initialLives: Live[]
  preview: boolean
}) {
  const router = useRouter()
  const [lives, setLives] = useState<Live[]>(initialLives)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setLives(initialLives) }, [initialLives])

  const [filter, setFilter] = useState<'TODAS' | Status>('TODAS')

  // Nova live
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<FormState>(emptyForm)

  // Editar live
  const [editTarget, setEditTarget] = useState<Live | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)

  // Remover live
  const [removeTarget, setRemoveTarget] = useState<Live | null>(null)

  const liveCount = lives.filter((l) => l.status === 'LIVE').length
  const scheduledCount = lives.filter((l) => l.status === 'SCHEDULED').length

  const visibleLives = lives.filter((l) => (filter === 'TODAS' ? true : l.status === filter))

  /* ── Ações (otimista + Server Action quando !preview) ── */
  function openCreate() {
    setCreateForm(emptyForm)
    setCreateOpen(true)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const title = createForm.title.trim()
    if (!title) return
    const ytId = extractYouTubeId(createForm.youtubeUrl)
    const tmpId = `tmp-${Date.now()}`
    const live: Live = {
      id: tmpId,
      title,
      agronomist: createForm.agronomist.trim() || 'A definir',
      plan: createForm.plan,
      status: createForm.status,
      date: createForm.date,
      time: createForm.time,
      viewers: 0,
      ytId,
    }
    setLives((cur) => [live, ...cur])
    setCreateOpen(false)
    toast.success('Live agendada', { description: title })

    if (!preview) {
      const res = await createLiveAction({
        title,
        scheduledAt: toScheduledAt(createForm.date, createForm.time),
        status: createForm.status,
        requiredPlan: createForm.plan,
        youtubeVideoId: ytId,
      })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  function openEdit(live: Live) {
    setEditForm({
      title: live.title,
      agronomist: live.agronomist,
      plan: live.plan,
      status: live.status,
      date: live.date,
      time: live.time,
      youtubeUrl: live.ytId ? `https://youtu.be/${live.ytId}` : '',
    })
    setEditTarget(live)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const target = editTarget
    const title = editForm.title.trim() || target.title
    const ytId = extractYouTubeId(editForm.youtubeUrl)
    setLives((cur) =>
      cur.map((l) =>
        l.id === target.id
          ? {
              ...l,
              title,
              agronomist: editForm.agronomist.trim() || target.agronomist,
              plan: editForm.plan,
              status: editForm.status,
              date: editForm.date,
              time: editForm.time,
              ytId,
            }
          : l,
      ),
    )
    setEditTarget(null)
    toast.success('Live atualizada', { description: title })

    if (!preview) {
      const res = await updateLiveAction(target.id, {
        title,
        youtubeVideoId: ytId,
        scheduledAt: toScheduledAt(editForm.date, editForm.time),
        status: editForm.status,
        requiredPlan: editForm.plan,
      })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function changeStatus(live: Live, status: Status, message: string) {
    setLives((cur) => cur.map((l) => (l.id === live.id ? { ...l, status } : l)))
    toast.success(message, { description: live.title })

    if (!preview) {
      const res = await setLiveStatusAction(live.id, status)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    const target = removeTarget
    const title = target.title
    setLives((cur) => cur.filter((l) => l.id !== target.id))
    setRemoveTarget(null)
    toast.success('Live removida', { description: title })

    if (!preview) {
      const res = await deleteLiveAction(target.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Lives</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{liveCount} ao vivo agora · {scheduledCount} agendadas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Agendar live
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold" style={{ color: 'oklch(0.52 0.04 144)' }}>Filtrar por status</span>
        <div className="w-48">
          <SelectField
            id="status-filter"
            value={filter}
            onValueChange={(v) => setFilter(v as 'TODAS' | Status)}
            options={filterOptions}
            placeholder="Todas"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {visibleLives.map((l) => {
          const status = statusStyle[l.status]; const plan = planStyle[l.plan]
          return (
            <div key={l.id} className="rounded-2xl p-5 flex gap-4 items-center"
              style={{ background: 'white', border: `1px solid ${l.status === 'LIVE' ? 'oklch(0.7 0.15 27 / 0.4)' : 'oklch(0.91 0.01 144)'}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: l.status === 'LIVE' ? 'oklch(0.6 0.2 27 / 0.12)' : 'oklch(0.48 0.13 144 / 0.08)' }}>
                <Radio size={18} style={{ color: l.status === 'LIVE' ? 'oklch(0.55 0.2 27)' : 'var(--color-frutificar-green)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.text }}>
                    {l.status === 'LIVE' && '● '}{status.label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: plan.bg, color: plan.text }}>{l.plan}</span>
                </div>
                <p className="font-semibold text-[14px]" style={{ color: 'var(--color-frutificar-deep)' }}>{l.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{l.agronomist}</p>
                  {l.ytId && (
                    <a
                      href={`https://youtu.be/${l.ytId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                      style={{ color: 'oklch(0.55 0.2 27)' }}
                    >
                      <Play size={11} fill="currentColor" /> Assistir
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs flex-shrink-0">
                <span className="flex items-center gap-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Calendar size={12} />{formatDateBR(l.date)}
                </span>
                <span className="flex items-center gap-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Clock size={12} />{formatTimeBR(l.time)}
                </span>
                {l.viewers > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>
                    <Eye size={12} />{l.viewers}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {l.status === 'SCHEDULED' && (
                  <button onClick={() => changeStatus(l, 'LIVE', 'Live iniciada')} title="Iniciar"
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors hover:bg-[oklch(0.6_0.2_27_/_0.08)] inline-flex items-center gap-1"
                    style={{ color: 'oklch(0.55 0.2 27)' }}>
                    <Play size={12} /> Iniciar
                  </button>
                )}
                {l.status === 'LIVE' && (
                  <button onClick={() => changeStatus(l, 'ENDED', 'Live encerrada')} title="Encerrar"
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors hover:bg-gray-100 inline-flex items-center gap-1"
                    style={{ color: 'oklch(0.52 0.04 144)' }}>
                    <Square size={11} /> Encerrar
                  </button>
                )}
                <button onClick={() => openEdit(l)} title="Editar"
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => setRemoveTarget(l)} title="Remover"
                  className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}

        {visibleLives.length === 0 && (
          <div className="rounded-2xl p-10 text-center text-sm" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
            Nenhuma live neste filtro.
          </div>
        )}
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Nova live */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Agendar live
            </DialogTitle>
            <DialogDescription>Programe uma transmissão ao vivo para os assinantes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                required placeholder="Ex.: Colheita do Café: Técnicas Modernas" className={inputClass} style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Técnico</label>
              <input
                value={createForm.agronomist}
                onChange={(e) => setCreateForm((f) => ({ ...f, agronomist: e.target.value }))}
                placeholder="Ex.: Dr. Felipe Moura" className={inputClass} style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Link do YouTube</label>
              <input
                value={createForm.youtubeUrl}
                onChange={(e) => setCreateForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                placeholder="https://youtu.be/... ou https://youtube.com/watch?v=..." className={inputClass} style={inputStyle}
              />
              <p className="text-[11px] mt-1" style={{ color: 'oklch(0.6 0.03 144)' }}>
                Cole o link da transmissão — o vídeo aparece direto no app dos alunos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data</label>
                <DateField
                  id="create-date"
                  value={createForm.date}
                  onChange={(iso) => setCreateForm((f) => ({ ...f, date: iso }))}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Horário</label>
                <TimeField
                  id="create-time"
                  value={createForm.time}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, time: v }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Plano requerido</label>
                <SelectField
                  id="create-plan"
                  value={createForm.plan}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, plan: v as Plan }))}
                  options={planOptions}
                  placeholder="Selecione"
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Status</label>
                <SelectField
                  id="create-status"
                  value={createForm.status}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, status: v as Status }))}
                  options={statusOptions}
                  placeholder="Selecione"
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
                Agendar live
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar live */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar live
            </DialogTitle>
            <DialogDescription>Atualize as informações desta transmissão.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  required className={inputClass} style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Técnico</label>
                <input
                  value={editForm.agronomist}
                  onChange={(e) => setEditForm((f) => ({ ...f, agronomist: e.target.value }))}
                  className={inputClass} style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Link do YouTube</label>
                <input
                  value={editForm.youtubeUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                  placeholder="https://youtu.be/... ou https://youtube.com/watch?v=..." className={inputClass} style={inputStyle}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data</label>
                  <DateField
                    id="edit-date"
                    value={editForm.date}
                    onChange={(iso) => setEditForm((f) => ({ ...f, date: iso }))}
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Horário</label>
                  <TimeField
                    id="edit-time"
                    value={editForm.time}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, time: v }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Plano requerido</label>
                  <SelectField
                    id="edit-plan"
                    value={editForm.plan}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, plan: v as Plan }))}
                    options={planOptions}
                    placeholder="Selecione"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Status</label>
                  <SelectField
                    id="edit-status"
                    value={editForm.status}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as Status }))}
                    options={statusOptions}
                    placeholder="Selecione"
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

      {/* Remover live */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover live?</DialogTitle>
            <DialogDescription>
              A live <strong>{removeTarget?.title}</strong> será removida. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter live
            </button>
            <button onClick={handleRemove}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              <X size={14} /> Confirmar remoção
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
