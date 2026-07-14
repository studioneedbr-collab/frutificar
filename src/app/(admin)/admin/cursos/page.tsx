'use client'

import { useState } from 'react'
import { Plus, BookOpen, Users, Clock, Pencil, Trash2, Layers, GripVertical, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'

type CourseType = 'PRINCIPAL' | 'MINICOURSE'

type Course = {
  id: number
  title: string
  type: CourseType
  instructor: string
  published: boolean
  modules: string[]
  enrolled: number
  duration: string
}

const initialCourses: Course[] = [
  {
    id: 1,
    title: 'Cafeicultura Completa: do plantio à xícara',
    type: 'PRINCIPAL',
    instructor: 'Dr. Felipe Moura',
    published: true,
    enrolled: 312,
    duration: '8h 30min',
    modules: [
      'Introdução ao café',
      'Clima, Solo e Regiões',
      'Implantação da lavoura',
      'Manejo da cultura',
      'Pragas e Doenças',
      'Florada e Desenvolvimento',
      'Colheita e Pós-colheita',
      'Comercialização e Qualidade',
    ],
  },
  {
    id: 2,
    title: 'Nutrição',
    type: 'MINICOURSE',
    instructor: 'Eng. Carla Nogueira',
    published: true,
    enrolled: 84,
    duration: '1h 20min',
    modules: ['Nutrição'],
  },
  {
    id: 3,
    title: 'Pragas',
    type: 'MINICOURSE',
    instructor: 'Dr. Felipe Moura',
    published: true,
    enrolled: 61,
    duration: '55min',
    modules: ['Pragas'],
  },
  {
    id: 4,
    title: 'Comercialização',
    type: 'MINICOURSE',
    instructor: 'Dra. Sofia Alves',
    published: false,
    enrolled: 12,
    duration: '1h 05min',
    modules: ['Comercialização'],
  },
  {
    id: 5,
    title: 'Hones',
    type: 'MINICOURSE',
    instructor: 'Eng. Marcos Lima',
    published: false,
    enrolled: 0,
    duration: '40min',
    modules: ['Hones'],
  },
]

const filters = ['Todos', 'Publicados', 'Rascunho', 'PRINCIPAL', 'MINICOURSE'] as const
type Filter = (typeof filters)[number]

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

const typeOptions = [
  { value: 'PRINCIPAL', label: 'Curso principal' },
  { value: 'MINICOURSE', label: 'Minicurso' },
]
const statusOptions = [
  { value: 'Publicado', label: 'Publicado' },
  { value: 'Rascunho', label: 'Rascunho' },
]

// derive an approximate lesson count from module count (in-memory, no DB)
function lessonCount(modules: number) {
  return modules === 0 ? 0 : modules * 3
}

export default function AdminCursosPage() {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [filter, setFilter] = useState<Filter>('Todos')
  const [nextId, setNextId] = useState(initialCourses.length + 1)

  // Novo curso
  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState<CourseType>('PRINCIPAL')
  const [createStatus, setCreateStatus] = useState<'Publicado' | 'Rascunho'>('Rascunho')

  // Editar curso
  const [editTarget, setEditTarget] = useState<Course | null>(null)
  const [editType, setEditType] = useState<CourseType>('PRINCIPAL')
  const [editStatus, setEditStatus] = useState<'Publicado' | 'Rascunho'>('Rascunho')

  // Gerenciar módulos
  const [modulesTargetId, setModulesTargetId] = useState<number | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  // Remover curso
  const [removeTarget, setRemoveTarget] = useState<Course | null>(null)

  const modulesTarget = courses.find((c) => c.id === modulesTargetId) ?? null

  const publishedCount = courses.filter((c) => c.published).length

  const visibleCourses = courses.filter((c) => {
    if (filter === 'Todos') return true
    if (filter === 'Publicados') return c.published
    if (filter === 'Rascunho') return !c.published
    return c.type === filter
  })

  /* ── Ações ── */
  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    if (!title) return
    const type = createType
    const instructor = String(data.get('instructor') ?? '').trim() || 'A definir'
    const published = createStatus === 'Publicado'

    const course: Course = {
      id: nextId,
      title,
      type,
      instructor,
      published,
      modules: [],
      enrolled: 0,
      duration: '0min',
    }
    setCourses((cur) => [course, ...cur])
    setNextId((n) => n + 1)
    setCreateOpen(false)
    toast.success('Curso criado', { description: title })
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') ?? '').trim() || editTarget.title
    const type = editType
    const instructor = String(data.get('instructor') ?? '').trim() || editTarget.instructor
    const published = editStatus === 'Publicado'

    setCourses((cur) =>
      cur.map((c) => (c.id === editTarget.id ? { ...c, title, type, instructor, published } : c)),
    )
    setEditTarget(null)
    toast.success('Curso atualizado', { description: title })
  }

  function togglePublished(course: Course) {
    const next = !course.published
    setCourses((cur) => cur.map((c) => (c.id === course.id ? { ...c, published: next } : c)))
    toast.success(next ? 'Curso publicado' : 'Curso despublicado', { description: course.title })
  }

  function handleRemove() {
    if (!removeTarget) return
    const title = removeTarget.title
    setCourses((cur) => cur.filter((c) => c.id !== removeTarget.id))
    setRemoveTarget(null)
    toast.success('Curso removido', { description: title })
  }

  function addModule() {
    if (!modulesTarget) return
    const title = newModuleTitle.trim()
    if (!title) return
    setCourses((cur) =>
      cur.map((c) => (c.id === modulesTarget.id ? { ...c, modules: [...c.modules, title] } : c)),
    )
    setNewModuleTitle('')
    toast.success('Módulo adicionado', { description: title })
  }

  function removeModule(index: number) {
    if (!modulesTarget) return
    const title = modulesTarget.modules[index]
    setCourses((cur) =>
      cur.map((c) =>
        c.id === modulesTarget.id ? { ...c, modules: c.modules.filter((_, i) => i !== index) } : c,
      ),
    )
    toast.success('Módulo removido', { description: title })
  }

  const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Cursos</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{courses.length} cursos · {publishedCount} publicados</p>
        </div>
        <button
          onClick={() => { setCreateType('PRINCIPAL'); setCreateStatus('Rascunho'); setCreateOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo curso
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
        {visibleCourses.map((c) => (
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
                    style={c.type === 'MINICOURSE'
                      ? { background: 'oklch(0.55 0.1 220 / 0.12)', color: 'oklch(0.4 0.1 220)' }
                      : { background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}>
                    {c.type === 'MINICOURSE' ? 'Minicurso' : 'Curso'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={c.published
                      ? { background: 'oklch(0.55 0.14 144 / 0.12)', color: 'oklch(0.38 0.1 144)' }
                      : { background: 'oklch(0.94 0.01 144)', color: 'oklch(0.55 0.03 144)' }}>
                    {c.published ? 'Publicado' : 'Rascunho'}
                  </span>
                  <button onClick={() => { setModulesTargetId(c.id); setNewModuleTitle('') }} title="Gerenciar módulos"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                    <Layers size={15} />
                  </button>
                  <button onClick={() => { setEditType(c.type); setEditStatus(c.published ? 'Publicado' : 'Rascunho'); setEditTarget(c) }} title="Editar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => togglePublished(c)} title={c.published ? 'Despublicar' : 'Publicar'}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                    style={{ color: 'var(--color-frutificar-green)' }}>
                    {c.published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button onClick={() => setRemoveTarget(c)} title="Remover"
                    className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="text-xs mb-3" style={{ color: 'oklch(0.58 0.03 144)' }}>Instrutor: {c.instructor}</p>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <BookOpen size={12} />{c.modules.length} módulos · {lessonCount(c.modules.length)} aulas
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Clock size={12} />{c.duration}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>
                  <Users size={12} />{c.enrolled} alunos
                </span>
              </div>
            </div>
          </div>
        ))}

        {visibleCourses.length === 0 && (
          <div className="rounded-2xl p-10 text-center text-sm" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
            Nenhum curso neste filtro.
          </div>
        )}
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo curso */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo curso
            </DialogTitle>
            <DialogDescription>Cadastre um curso principal ou minicurso. Os módulos são adicionados depois.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
              <input name="title" required placeholder="Ex.: Cafeicultura Completa" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Tipo</label>
                <SelectField
                  id="create-type"
                  value={createType}
                  onValueChange={(v) => setCreateType(v as CourseType)}
                  options={typeOptions}
                  placeholder="Selecione"
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Status</label>
                <SelectField
                  id="create-status"
                  value={createStatus}
                  onValueChange={(v) => setCreateStatus(v as 'Publicado' | 'Rascunho')}
                  options={statusOptions}
                  placeholder="Selecione"
                />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Instrutor</label>
              <input name="instructor" placeholder="Ex.: Dr. Felipe Moura" className={inputClass} style={inputStyle} />
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
                Criar curso
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar curso */}
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
                  <SelectField
                    id="edit-type"
                    value={editType}
                    onValueChange={(v) => setEditType(v as CourseType)}
                    options={typeOptions}
                    placeholder="Selecione"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Status</label>
                  <SelectField
                    id="edit-status"
                    value={editStatus}
                    onValueChange={(v) => setEditStatus(v as 'Publicado' | 'Rascunho')}
                    options={statusOptions}
                    placeholder="Selecione"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Instrutor</label>
                <input name="instructor" defaultValue={editTarget.instructor} className={inputClass} style={inputStyle} />
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

      {/* Gerenciar módulos */}
      <Dialog open={modulesTargetId !== null} onOpenChange={(o) => !o && setModulesTargetId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Layers size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Gerenciar módulos
            </DialogTitle>
            <DialogDescription>{modulesTarget?.title}</DialogDescription>
          </DialogHeader>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Novo módulo</label>
              <input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModule() } }}
                placeholder="Ex.: Introdução ao café"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <button type="button" onClick={addModule}
              className="px-4 py-2.5 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ background: 'var(--color-frutificar-green)' }}>
              Adicionar módulo
            </button>
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pt-1">
            {modulesTarget && modulesTarget.modules.length === 0 && (
              <p className="text-sm py-6 text-center" style={{ color: 'oklch(0.55 0.04 144)' }}>
                Nenhum módulo ainda. Adicione o primeiro acima.
              </p>
            )}
            {modulesTarget?.modules.map((m, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                <GripVertical size={15} style={{ color: 'oklch(0.7 0.02 144)' }} className="shrink-0" />
                <span className="w-6 shrink-0 text-xs font-bold tabular-nums" style={{ color: 'var(--color-frutificar-green)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{m}</span>
                <button type="button" onClick={() => removeModule(i)} aria-label="Remover módulo"
                  className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)] shrink-0" style={{ color: 'oklch(0.6 0.18 25)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-1">
            <button type="button" onClick={() => setModulesTargetId(null)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Concluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remover curso */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover curso?</DialogTitle>
            <DialogDescription>
              O curso <strong>{removeTarget?.title}</strong> e seus módulos serão removidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter curso
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
