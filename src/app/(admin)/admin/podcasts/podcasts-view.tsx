'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Mic2, Play, Pencil, Trash2, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField, DateField } from '@/components/ui/field-controls'
import {
  createEpisodeAction,
  updateEpisodeAction,
  deleteEpisodeAction,
} from '@/server/actions/admin-podcasts'
import { uploadFile } from '@/lib/upload-client'
import { type Episode } from './data'

type Podcast = {
  name: string
  cover: string
}

const podcasts: Podcast[] = [
  { name: 'Campo em Foco', cover: '#2d7a3e' },
  { name: 'Café com Agro', cover: '#8B5E3C' },
]

const seriesOptions = podcasts.map((p) => ({ value: p.name, label: p.name }))

const MONTHS_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${String(d).padStart(2, '0')} ${MONTHS_ABBR[m - 1]} ${y}`
}

const filters = ['Todos', 'Publicados', 'Rascunho', ...podcasts.map((p) => p.name)]

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

type EpisodeForm = {
  title: string
  series: string
  dur: string
  date: string
  url: string
}

const emptyForm: EpisodeForm = { title: '', series: podcasts[0].name, dur: '', date: '', url: '' }

export function PodcastsView({
  initialEpisodes,
  preview,
}: {
  initialEpisodes: Episode[]
  preview: boolean
}) {
  const router = useRouter()

  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes)
  const [filter, setFilter] = useState<string>('Todos')

  // Reconcilia o estado local quando os dados do servidor mudam (router.refresh).
  useEffect(() => {
    setEpisodes(initialEpisodes)
  }, [initialEpisodes])

  // Novo episódio
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<EpisodeForm>(emptyForm)

  // Editar episódio
  const [editTarget, setEditTarget] = useState<Episode | null>(null)
  const [editForm, setEditForm] = useState<EpisodeForm>(emptyForm)

  // Remover episódio
  const [removeTarget, setRemoveTarget] = useState<Episode | null>(null)

  // Upload de áudio (preenche o campo URL após subir para o Storage)
  const createAudioRef = useRef<HTMLInputElement>(null)
  const editAudioRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function uploadAudio(file: File | undefined, target: 'create' | 'edit') {
    if (!file) return
    if (preview) {
      toast.info('Upload de arquivo disponível apenas com o banco conectado. Use a URL por enquanto.')
      return
    }
    setUploading(true)
    const up = await uploadFile(file, 'podcasts')
    setUploading(false)
    if (!up.ok) {
      toast.error(up.error)
      return
    }
    if (target === 'create') setCreateForm((f) => ({ ...f, url: up.url }))
    else setEditForm((f) => ({ ...f, url: up.url }))
    toast.success('Áudio enviado', { description: file.name })
  }

  const publishedCount = episodes.filter((e) => e.published).length

  const visibleEpisodes = episodes.filter((e) => {
    if (filter === 'Todos') return true
    if (filter === 'Publicados') return e.published
    if (filter === 'Rascunho') return !e.published
    return e.series === filter
  })

  function openCreate(series?: string) {
    setCreateForm({ ...emptyForm, series: series ?? podcasts[0].name })
    setCreateOpen(true)
  }

  /* ── Ações ── */
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const title = createForm.title.trim()
    if (!title) return
    const tempId = `tmp-${Date.now()}`
    const episode: Episode = {
      id: tempId,
      title,
      series: createForm.series,
      dur: createForm.dur.trim() || '0 min',
      date: createForm.date || '',
      url: createForm.url.trim(),
      plays: 0,
      published: true,
    }
    setEpisodes((cur) => [episode, ...cur])
    setCreateOpen(false)
    toast.success('Episódio publicado', { description: title })

    if (!preview) {
      const result = await createEpisodeAction({
        title,
        audioUrl: episode.url || undefined,
        publishedAt: episode.date ? new Date(episode.date) : new Date(),
      })
      if (!result.ok) {
        setEpisodes((cur) => cur.filter((ep) => ep.id !== tempId))
        toast.error(result.error)
        return
      }
      router.refresh()
    }
  }

  function openEdit(ep: Episode) {
    setEditForm({ title: ep.title, series: ep.series, dur: ep.dur, date: ep.date, url: ep.url })
    setEditTarget(ep)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const target = editTarget
    const previous = episodes
    const title = editForm.title.trim() || target.title
    const nextDate = editForm.date
    const nextUrl = editForm.url.trim()
    setEpisodes((cur) =>
      cur.map((ep) =>
        ep.id === target.id
          ? {
              ...ep,
              title,
              series: editForm.series,
              dur: editForm.dur.trim() || ep.dur,
              date: nextDate,
              url: nextUrl,
            }
          : ep,
      ),
    )
    setEditTarget(null)
    toast.success('Episódio atualizado', { description: title })

    if (!preview) {
      const result = await updateEpisodeAction(target.id, {
        title,
        audioUrl: nextUrl || undefined,
        publishedAt: nextDate ? new Date(nextDate) : undefined,
      })
      if (!result.ok) {
        setEpisodes(previous)
        toast.error(result.error)
        return
      }
      router.refresh()
    }
  }

  function togglePublished(ep: Episode) {
    const next = !ep.published
    setEpisodes((cur) => cur.map((e) => (e.id === ep.id ? { ...e, published: next } : e)))
    toast.success(next ? 'Episódio publicado' : 'Episódio despublicado', { description: ep.title })
    // TODO: sem campo published no schema — alteração permanece apenas otimista (sem persistência).
  }

  async function handleRemove() {
    if (!removeTarget) return
    const target = removeTarget
    const previous = episodes
    const title = target.title
    setEpisodes((cur) => cur.filter((e) => e.id !== target.id))
    setRemoveTarget(null)
    toast.success('Episódio removido', { description: title })

    if (!preview) {
      const result = await deleteEpisodeAction(target.id)
      if (!result.ok) {
        setEpisodes(previous)
        toast.error(result.error)
        return
      }
      router.refresh()
    }
  }

  const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Podcasts</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{podcasts.length} programas · {episodes.length} episódios · {publishedCount} publicados</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo episódio
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
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

      <div className="space-y-6">
        {podcasts.map((p) => {
          const eps = visibleEpisodes.filter((e) => e.series === p.name)
          if (filter !== 'Todos' && filter !== 'Publicados' && filter !== 'Rascunho' && filter !== p.name) return null
          if (eps.length === 0 && (filter === 'Publicados' || filter === 'Rascunho')) return null
          const totalForSeries = episodes.filter((e) => e.series === p.name && e.published).length
          return (
            <div key={p.name} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
              <div className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.005 144)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: p.cover }}>
                  <Mic2 size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-[15px]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>{p.name}</h2>
                  <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{totalForSeries} episódios publicados</p>
                </div>
                <button
                  onClick={() => openCreate(p.name)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-85 transition-opacity"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}>
                  <Plus size={12} /> Episódio
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
                {eps.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    Nenhum episódio neste filtro.
                  </div>
                )}
                {eps.map((ep) => (
                  <div key={ep.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[oklch(0.985_0_0)] transition-colors">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                      <Play size={13} style={{ color: 'var(--color-frutificar-green)' }} fill="currentColor" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{ep.title}</p>
                        {!ep.published && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: 'oklch(0.94 0.01 144)', color: 'oklch(0.55 0.03 144)' }}>
                            Rascunho
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>
                        {ep.date ? `${formatDateBR(ep.date)} · ` : ''}{ep.dur}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0">
                      <span className="font-semibold mr-1" style={{ color: 'var(--color-frutificar-green)' }}>{ep.plays.toLocaleString('pt-BR')} plays</span>
                      <button onClick={() => openEdit(ep)} title="Editar"
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => togglePublished(ep)} title={ep.published ? 'Despublicar' : 'Publicar'}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                        style={{ color: 'var(--color-frutificar-green)' }}>
                        {ep.published ? 'Despublicar' : 'Publicar'}
                      </button>
                      <button onClick={() => setRemoveTarget(ep)} title="Remover"
                        className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo episódio */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo episódio
            </DialogTitle>
            <DialogDescription>Publique um novo episódio em uma das séries.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                required placeholder="Ex.: Como aumentar a produtividade" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Série / Categoria</label>
                <SelectField
                  id="create-series"
                  value={createForm.series}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, series: v }))}
                  options={seriesOptions}
                  placeholder="Selecione"
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Duração</label>
                <input
                  value={createForm.dur}
                  onChange={(e) => setCreateForm((f) => ({ ...f, dur: e.target.value }))}
                  placeholder="Ex.: 28 min" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data de publicação</label>
              <DateField
                id="create-date"
                value={createForm.date}
                onChange={(iso) => setCreateForm((f) => ({ ...f, date: iso }))}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>URL do áudio / embed</label>
              <input
                value={createForm.url}
                onChange={(e) => setCreateForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..." className={inputClass} style={inputStyle} />
              <input
                ref={createAudioRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => uploadAudio(e.target.files?.[0] ?? undefined, 'create')}
              />
              <button type="button" onClick={() => createAudioRef.current?.click()} disabled={uploading}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-60"
                style={{ color: 'var(--color-frutificar-green)' }}>
                <Upload size={13} /> {uploading ? 'Enviando…' : 'Ou enviar arquivo de áudio'}
              </button>
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
                Publicar episódio
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar episódio */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar episódio
            </DialogTitle>
            <DialogDescription>Atualize as informações deste episódio.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  required className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Série / Categoria</label>
                  <SelectField
                    id="edit-series"
                    value={editForm.series}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, series: v }))}
                    options={seriesOptions}
                    placeholder="Selecione"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Duração</label>
                  <input
                    value={editForm.dur}
                    onChange={(e) => setEditForm((f) => ({ ...f, dur: e.target.value }))}
                    placeholder="Ex.: 28 min" className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Data de publicação</label>
                <DateField
                  id="edit-date"
                  value={editForm.date}
                  onChange={(iso) => setEditForm((f) => ({ ...f, date: iso }))}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>URL do áudio / embed</label>
                <input
                  value={editForm.url}
                  onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..." className={inputClass} style={inputStyle} />
                <input
                  ref={editAudioRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => uploadAudio(e.target.files?.[0] ?? undefined, 'edit')}
                />
                <button type="button" onClick={() => editAudioRef.current?.click()} disabled={uploading}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ color: 'var(--color-frutificar-green)' }}>
                  <Upload size={13} /> {uploading ? 'Enviando…' : 'Ou enviar arquivo de áudio'}
                </button>
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

      {/* Remover episódio */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover episódio?</DialogTitle>
            <DialogDescription>
              O episódio <strong>{removeTarget?.title}</strong> será removido. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter episódio
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
