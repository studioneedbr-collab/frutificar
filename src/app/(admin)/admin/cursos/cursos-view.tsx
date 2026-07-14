'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, BookOpen, Users, Pencil, Trash2, Layers, X, PlayCircle, Video, Clock,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'
import {
  createCourseAction, updateCourseAction, togglePublishedAction, deleteCourseAction,
  createModuleAction, updateModuleAction, deleteModuleAction,
  createLessonAction, updateLessonAction, deleteLessonAction,
} from '@/server/actions/admin-courses'
import type { AdminCourse, AdminModule, AdminLesson } from './data'

// Extrai o ID do YouTube no cliente (só para exibição otimista).
function ytId(input: string): string {
  const s = input.trim()
  if (!s) return ''
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  const pats = [/youtu\.be\/([\w-]{11})/, /[?&]v=([\w-]{11})/, /\/embed\/([\w-]{11})/, /\/live\/([\w-]{11})/, /\/shorts\/([\w-]{11})/]
  for (const p of pats) { const m = s.match(p); if (m) return m[1] }
  return ''
}

const inputStyle: React.CSSProperties = { border: '1px solid oklch(0.91 0.01 144)', background: 'oklch(0.99 0.005 144)' }
const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'
const typeOptions = [{ value: 'PRINCIPAL', label: 'Curso principal' }, { value: 'MINICOURSE', label: 'Minicurso' }]
const filters = ['Todos', 'Publicados', 'Rascunho', 'PRINCIPAL', 'MINICOURSE'] as const
type Filter = (typeof filters)[number]
const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

let tmp = 0
const tmpId = () => `tmp-${++tmp}`

export function CursosAdminView({
  initialCourses, preview,
}: {
  initialCourses: AdminCourse[]
  preview: boolean
}) {
  const router = useRouter()
  const [courses, setCourses] = useState<AdminCourse[]>(initialCourses)
  useEffect(() => { setCourses(initialCourses) }, [initialCourses])

  const [filter, setFilter] = useState<Filter>('Todos')

  // Curso: criar / editar / remover / gerenciar conteúdo
  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState<'PRINCIPAL' | 'MINICOURSE'>('PRINCIPAL')
  const [editTarget, setEditTarget] = useState<AdminCourse | null>(null)
  const [editType, setEditType] = useState<'PRINCIPAL' | 'MINICOURSE'>('PRINCIPAL')
  const [removeTarget, setRemoveTarget] = useState<AdminCourse | null>(null)
  const [contentId, setContentId] = useState<string | null>(null)

  // Aula: criar / editar
  const [lessonDialog, setLessonDialog] = useState<{ moduleId: string; lesson: AdminLesson | null } | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  const contentCourse = courses.find((c) => c.id === contentId) ?? null
  const publishedCount = courses.filter((c) => c.published).length
  const visible = courses.filter((c) => {
    if (filter === 'Todos') return true
    if (filter === 'Publicados') return c.published
    if (filter === 'Rascunho') return !c.published
    return c.type === filter
  })

  function patchCourse(id: string, fn: (c: AdminCourse) => AdminCourse) {
    setCourses((cur) => cur.map((c) => (c.id === id ? fn(c) : c)))
  }

  /* ── Curso ── */
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    const instructor = String(data.get('instructor') ?? '').trim() || 'A definir'
    if (!title) return
    const optimistic: AdminCourse = { id: tmpId(), title, type: createType, instructor, published: false, enrolled: 0, modules: [] }
    setCourses((cur) => [optimistic, ...cur])
    setCreateOpen(false)
    toast.success('Curso criado', { description: title })
    if (!preview) {
      const res = await createCourseAction({ title, type: createType, instructor })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const t = editTarget
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') ?? '').trim() || t.title
    const instructor = String(data.get('instructor') ?? '').trim() || t.instructor
    patchCourse(t.id, (c) => ({ ...c, title, type: editType, instructor }))
    setEditTarget(null)
    toast.success('Curso atualizado', { description: title })
    if (!preview) {
      const res = await updateCourseAction(t.id, { title, type: editType, instructor })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function togglePublished(c: AdminCourse) {
    const next = !c.published
    patchCourse(c.id, (x) => ({ ...x, published: next }))
    toast.success(next ? 'Curso publicado' : 'Curso despublicado', { description: c.title })
    if (!preview) {
      const res = await togglePublishedAction(c.id, next)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    const t = removeTarget
    setCourses((cur) => cur.filter((c) => c.id !== t.id))
    setRemoveTarget(null)
    toast.success('Curso removido', { description: t.title })
    if (!preview) {
      const res = await deleteCourseAction(t.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  /* ── Módulo ── */
  async function addModule() {
    if (!contentCourse) return
    const title = newModuleTitle.trim()
    if (!title) return
    const mod: AdminModule = { id: tmpId(), title, lessons: [] }
    patchCourse(contentCourse.id, (c) => ({ ...c, modules: [...c.modules, mod] }))
    setNewModuleTitle('')
    if (!preview) {
      const res = await createModuleAction(contentCourse.id, title)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function renameModule(moduleId: string, title: string, original: string) {
    if (title.trim() === original || !title.trim()) return
    if (!preview) {
      const res = await updateModuleAction(moduleId, title.trim())
      if (!res.ok) { toast.error(res.error); return }
      router.refresh()
    }
  }

  async function removeModule(moduleId: string) {
    if (!contentCourse) return
    patchCourse(contentCourse.id, (c) => ({ ...c, modules: c.modules.filter((m) => m.id !== moduleId) }))
    if (!preview) {
      const res = await deleteModuleAction(moduleId)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  /* ── Aula ── */
  async function saveLesson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!lessonDialog || !contentCourse) return
    const { moduleId, lesson } = lessonDialog
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    const videoUrl = String(data.get('videoUrl') ?? '').trim()
    const minutesRaw = String(data.get('minutes') ?? '').trim()
    const minutes = minutesRaw ? Number(minutesRaw) : null
    if (!title) return
    if (videoUrl && !ytId(videoUrl)) { toast.error('Link do YouTube inválido', { description: 'Cole a URL do vídeo ou o ID de 11 caracteres.' }); return }
    const videoId = videoUrl ? ytId(videoUrl) : null

    if (lesson) {
      patchCourse(contentCourse.id, (c) => ({
        ...c,
        modules: c.modules.map((m) => m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => l.id === lesson.id ? { ...l, title, videoId, minutes } : l) } : m),
      }))
    } else {
      const newLesson: AdminLesson = { id: tmpId(), title, videoId, minutes }
      patchCourse(contentCourse.id, (c) => ({
        ...c,
        modules: c.modules.map((m) => m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m),
      }))
    }
    setLessonDialog(null)
    toast.success(lesson ? 'Aula atualizada' : 'Aula adicionada', { description: title })
    if (!preview) {
      const payload = { title, videoUrl, minutes: minutes ?? undefined }
      const res = lesson ? await updateLessonAction(lesson.id, payload) : await createLessonAction(moduleId, payload)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function removeLesson(moduleId: string, lessonId: string) {
    if (!contentCourse) return
    patchCourse(contentCourse.id, (c) => ({
      ...c,
      modules: c.modules.map((m) => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m),
    }))
    if (!preview) {
      const res = await deleteLessonAction(lessonId)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  const totalLessons = (c: AdminCourse) => c.modules.reduce((a, m) => a + m.lessons.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Cursos</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{courses.length} cursos · {publishedCount} publicados</p>
        </div>
        <button onClick={() => { setCreateType('PRINCIPAL'); setCreateOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo curso
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={f === filter ? { background: 'var(--color-frutificar-forest)', color: 'white' }
              : { background: 'white', color: 'oklch(0.52 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
            {f === 'PRINCIPAL' ? 'Principais' : f === 'MINICOURSE' ? 'Minicursos' : f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {visible.map((c) => (
          <div key={c.id} className="rounded-2xl p-5 flex gap-5 items-start hover:shadow-sm transition-shadow"
            style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: c.published ? 'oklch(0.48 0.13 144 / 0.1)' : 'oklch(0.94 0.01 144)' }}>
              <BookOpen size={20} style={{ color: c.published ? 'var(--color-frutificar-green)' : 'oklch(0.6 0.02 144)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h3 className="font-semibold text-[15px] leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>{c.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={c.type === 'MINICOURSE' ? { background: 'oklch(0.55 0.1 220 / 0.12)', color: 'oklch(0.4 0.1 220)' } : { background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}>
                    {c.type === 'MINICOURSE' ? 'Minicurso' : 'Curso'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={c.published ? { background: 'oklch(0.55 0.14 144 / 0.12)', color: 'oklch(0.38 0.1 144)' } : { background: 'oklch(0.94 0.01 144)', color: 'oklch(0.55 0.03 144)' }}>
                    {c.published ? 'Publicado' : 'Rascunho'}
                  </span>
                  <button onClick={() => { setEditType(c.type); setEditTarget(c) }} title="Editar curso"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}><Pencil size={15} /></button>
                  <button onClick={() => togglePublished(c)} title={c.published ? 'Despublicar' : 'Publicar'}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors" style={{ color: 'var(--color-frutificar-green)' }}>
                    {c.published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button onClick={() => setRemoveTarget(c)} title="Remover"
                    className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="text-xs mb-3" style={{ color: 'oklch(0.58 0.03 144)' }}>Instrutor: {c.instructor}</p>
              <div className="flex items-center gap-5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Layers size={12} />{c.modules.length} módulos · {totalLessons(c)} aulas
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>
                  <Users size={12} />{c.enrolled} alunos
                </span>
                <button onClick={() => setContentId(c.id)}
                  className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}>
                  <Layers size={13} /> Gerenciar conteúdo
                </button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl p-10 text-center text-sm" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
            Nenhum curso neste filtro.
          </div>
        )}
      </div>

      {/* ═══════ Criar curso ═══════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo curso
            </DialogTitle>
            <DialogDescription>Crie o curso; os módulos e aulas são adicionados depois em “Gerenciar conteúdo”.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
              <input name="title" required placeholder="Ex.: Cafeicultura Completa" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Tipo</label>
                <SelectField id="create-type" value={createType} onValueChange={(v) => setCreateType(v as 'PRINCIPAL' | 'MINICOURSE')} options={typeOptions} placeholder="Selecione" />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Instrutor</label>
                <input name="instructor" placeholder="Ex.: Dr. Felipe Moura" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Criar curso</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════ Editar curso ═══════ */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar curso
            </DialogTitle>
            <DialogDescription>Atualize as informações deste curso.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
                <input name="title" required defaultValue={editTarget.title} className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Tipo</label>
                  <SelectField id="edit-type" value={editType} onValueChange={(v) => setEditType(v as 'PRINCIPAL' | 'MINICOURSE')} options={typeOptions} placeholder="Selecione" />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Instrutor</label>
                  <input name="instructor" defaultValue={editTarget.instructor} className={inputClass} style={inputStyle} />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Salvar</button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════ Gerenciar conteúdo (módulos + aulas) ═══════ */}
      <Dialog open={contentId !== null} onOpenChange={(o) => !o && setContentId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Layers size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Conteúdo do curso
            </DialogTitle>
            <DialogDescription>{contentCourse?.title}</DialogDescription>
          </DialogHeader>

          {/* Adicionar módulo */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Novo módulo</label>
              <input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModule() } }}
                placeholder="Ex.: Introdução ao café" className={inputClass} style={inputStyle} />
            </div>
            <button type="button" onClick={addModule} className="px-4 py-2.5 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-90 shrink-0" style={{ background: 'var(--color-frutificar-green)' }}>Adicionar</button>
          </div>

          {/* Lista de módulos */}
          <div className="space-y-3 pt-1">
            {contentCourse && contentCourse.modules.length === 0 && (
              <p className="text-sm py-6 text-center" style={{ color: 'oklch(0.55 0.04 144)' }}>Nenhum módulo ainda. Adicione o primeiro acima.</p>
            )}
            {contentCourse?.modules.map((m, mi) => (
              <div key={m.id} className="rounded-xl p-4" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-6 shrink-0 text-xs font-bold tabular-nums" style={{ color: 'var(--color-frutificar-green)' }}>{String(mi + 1).padStart(2, '0')}</span>
                  <input defaultValue={m.title} onBlur={(e) => renameModule(m.id, e.target.value, m.title)}
                    className="flex-1 bg-transparent text-sm font-bold outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)] rounded px-1 py-0.5" style={{ color: 'var(--color-frutificar-deep)' }} />
                  <button type="button" onClick={() => removeModule(m.id)} aria-label="Remover módulo"
                    className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)] shrink-0" style={{ color: 'oklch(0.6 0.18 25)' }}><Trash2 size={14} /></button>
                </div>

                {/* Aulas */}
                <div className="space-y-1.5 pl-8">
                  {m.lessons.map((l, li) => (
                    <div key={l.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2" style={{ background: 'white', border: '1px solid oklch(0.93 0.01 144)' }}>
                      <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: 'oklch(0.6 0.03 144)' }}>{li + 1}.</span>
                      {l.videoId
                        ? <Video size={13} className="shrink-0" style={{ color: 'var(--color-frutificar-green)' }} />
                        : <Video size={13} className="shrink-0" style={{ color: 'oklch(0.75 0.03 144)' }} />}
                      <span className="min-w-0 flex-1 text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{l.title}</span>
                      {l.minutes != null && <span className="text-[11px] shrink-0 flex items-center gap-1" style={{ color: 'oklch(0.6 0.03 144)' }}><Clock size={11} />{l.minutes}min</span>}
                      {!l.videoId && <span className="text-[10px] font-bold shrink-0" style={{ color: 'oklch(0.7 0.15 70)' }}>sem vídeo</span>}
                      <button type="button" onClick={() => setLessonDialog({ moduleId: m.id, lesson: l })} aria-label="Editar aula" className="p-1 rounded hover:bg-gray-100 shrink-0" style={iconBtnStyle}><Pencil size={13} /></button>
                      <button type="button" onClick={() => removeLesson(m.id, l.id)} aria-label="Remover aula" className="p-1 rounded transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)] shrink-0" style={{ color: 'oklch(0.6 0.18 25)' }}><X size={13} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setLessonDialog({ moduleId: m.id, lesson: null })}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[oklch(0.48_0.13_144_/_0.08)]" style={{ color: 'var(--color-frutificar-green)' }}>
                    <Plus size={13} /> Adicionar aula
                  </button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-1">
            <button type="button" onClick={() => setContentId(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Concluir</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ Aula (criar/editar) ═══════ */}
      <Dialog open={lessonDialog !== null} onOpenChange={(o) => !o && setLessonDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <PlayCircle size={18} style={{ color: 'var(--color-frutificar-green)' }} /> {lessonDialog?.lesson ? 'Editar aula' : 'Nova aula'}
            </DialogTitle>
            <DialogDescription>Cole o link do vídeo do YouTube da aula (o aluno assiste dentro da plataforma).</DialogDescription>
          </DialogHeader>
          {lessonDialog && (
            <form onSubmit={saveLesson} className="space-y-3.5" key={lessonDialog.lesson?.id ?? 'new'}>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título da aula</label>
                <input name="title" required defaultValue={lessonDialog.lesson?.title ?? ''} placeholder="Ex.: História e origem do café" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Link do vídeo (YouTube)</label>
                <input name="videoUrl" defaultValue={lessonDialog.lesson?.videoId ? `https://youtu.be/${lessonDialog.lesson.videoId}` : ''} placeholder="https://youtu.be/…  ou  ID do vídeo" className={inputClass} style={inputStyle} />
                <p className="text-[11px] mt-1" style={{ color: 'oklch(0.6 0.03 144)' }}>Dica: use vídeos “não listados” no YouTube para conteúdo pago.</p>
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Duração (minutos) — opcional</label>
                <input name="minutes" type="number" min="0" defaultValue={lessonDialog.lesson?.minutes ?? ''} placeholder="Ex.: 12" className={inputClass} style={inputStyle} />
              </div>
              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button type="button" onClick={() => setLessonDialog(null)} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>{lessonDialog.lesson ? 'Salvar aula' : 'Adicionar aula'}</button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════ Remover curso ═══════ */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover curso?</DialogTitle>
            <DialogDescription>O curso <strong>{removeTarget?.title}</strong>, seus módulos e aulas serão removidos. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90" style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Manter curso</button>
            <button onClick={handleRemove} className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5" style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}><X size={14} /> Confirmar remoção</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
