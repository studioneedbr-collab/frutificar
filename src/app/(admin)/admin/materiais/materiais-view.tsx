'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, FileText, Table2, File, Pencil, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'
import {
  createResourceAction, updateResourceAction, deleteResourceAction,
} from '@/server/actions/admin-materials'
import { uploadFile, formatFileSize } from '@/lib/upload-client'
import type { Material, MaterialType, MaterialPlan } from './data'

const typeIcon: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  PDF:        { icon: FileText, color: 'oklch(0.52 0.18 27)',  bg: 'oklch(0.95 0.04 27)' },
  SPREADSHEET:{ icon: Table2,   color: 'oklch(0.48 0.13 144)', bg: 'oklch(0.48 0.13 144 / 0.1)' },
  DOC:        { icon: File,     color: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)' },
}
const planStyle: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

const typeOptions = [
  { value: 'PDF', label: 'PDF' },
  { value: 'SPREADSHEET', label: 'Planilha' },
  { value: 'DOC', label: 'Documento' },
]
const planOptions = [
  { value: 'ESSENCIAL', label: 'Essencial' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'GOLD', label: 'Gold' },
]

const filterOptions = [
  { value: 'TODOS', label: 'Todos os tipos' },
  { value: 'PDF', label: 'PDF' },
  { value: 'SPREADSHEET', label: 'Planilha' },
  { value: 'DOC', label: 'Documento' },
]

function todayBR() {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const gridCols = '2.5fr 0.8fr 0.8fr 1fr 0.8fr auto'

export function MateriaisView({
  initialMaterials, preview,
}: {
  initialMaterials: Material[]
  preview: boolean
}) {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setMaterials(initialMaterials) }, [initialMaterials])

  const [filter, setFilter] = useState<string>('TODOS')

  // Novo material
  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState<MaterialType>('PDF')
  const [createPlan, setCreatePlan] = useState<MaterialPlan>('ESSENCIAL')
  const [createFile, setCreateFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const createFileRef = useRef<HTMLInputElement>(null)

  // Editar material
  const [editTarget, setEditTarget] = useState<Material | null>(null)
  const [editType, setEditType] = useState<MaterialType>('PDF')
  const [editPlan, setEditPlan] = useState<MaterialPlan>('ESSENCIAL')
  const [editFile, setEditFile] = useState<File | null>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  // Remover material
  const [removeTarget, setRemoveTarget] = useState<Material | null>(null)

  const visibleMaterials = materials.filter((m) => filter === 'TODOS' || m.type === filter)

  function openCreate() {
    setCreateType('PDF')
    setCreatePlan('ESSENCIAL')
    setCreateFile(null)
    setCreateOpen(true)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    if (!title) return
    const file = createFile

    // Modo real: sobe o arquivo (se houver) ANTES de fechar o modal, para capturar erro.
    if (!preview) {
      setSaving(true)
      let fileUrl = ''
      if (file) {
        const up = await uploadFile(file, 'materiais')
        if (!up.ok) {
          setSaving(false)
          toast.error(up.error)
          return
        }
        fileUrl = up.url
      }
      const res = await createResourceAction({
        title,
        description: '',
        fileUrl,
        category: createType,
        requiredPlan: createPlan,
      })
      setSaving(false)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setCreateOpen(false)
      toast.success('Material enviado', { description: title })
      router.refresh()
      return
    }

    // Modo preview (sem banco): apenas otimista.
    const tmpId = `tmp-${Date.now()}`
    const material: Material = {
      id: tmpId,
      title,
      type: createType,
      plan: createPlan,
      downloads: 0,
      size: file ? formatFileSize(file.size) : '— MB',
      date: todayBR(),
    }
    setMaterials((cur) => [material, ...cur])
    setCreateOpen(false)
    toast.success('Material enviado', { description: title })
  }

  function openEdit(m: Material) {
    setEditType(m.type)
    setEditPlan(m.plan)
    setEditFile(null)
    setEditTarget(m)
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const target = editTarget
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') ?? '').trim() || target.title
    const file = editFile

    if (!preview) {
      setSaving(true)
      let fileUrl: string | undefined
      if (file) {
        const up = await uploadFile(file, 'materiais')
        if (!up.ok) {
          setSaving(false)
          toast.error(up.error)
          return
        }
        fileUrl = up.url
      }
      const res = await updateResourceAction(target.id, {
        title,
        category: editType,
        requiredPlan: editPlan,
        ...(fileUrl ? { fileUrl } : {}),
      })
      setSaving(false)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setMaterials((cur) =>
        cur.map((m) => (m.id === target.id ? { ...m, title, type: editType, plan: editPlan } : m)),
      )
      setEditTarget(null)
      toast.success('Material atualizado', { description: title })
      router.refresh()
      return
    }

    setMaterials((cur) =>
      cur.map((m) => (m.id === target.id ? { ...m, title, type: editType, plan: editPlan } : m)),
    )
    setEditTarget(null)
    toast.success('Material atualizado', { description: title })
  }

  function handleDownload(m: Material) {
    toast.info('Baixando material', { description: m.title })
  }

  async function handleRemove() {
    if (!removeTarget) return
    const target = removeTarget
    const title = target.title
    setMaterials((cur) => cur.filter((m) => m.id !== target.id))
    setRemoveTarget(null)
    toast.success('Material removido', { description: title })

    if (!preview) {
      const res = await deleteResourceAction(target.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Materiais</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{materials.length} materiais · {visibleMaterials.length} exibidos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo material
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold" style={{ color: 'oklch(0.52 0.04 144)' }}>Filtrar por tipo</span>
        <div className="w-52">
          <SelectField
            id="filter-type"
            value={filter}
            onValueChange={setFilter}
            options={filterOptions}
            placeholder="Todos os tipos"
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <div className="grid gap-4 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.93 0.005 144)', gridTemplateColumns: gridCols }}>
          <span>Material</span><span>Tipo</span><span>Plano</span><span>Downloads</span><span>Tamanho</span><span />
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {visibleMaterials.map((m) => {
            const t = typeIcon[m.type]; const plan = planStyle[m.plan]; const Icon = t.icon
            return (
              <div key={m.id} className="grid gap-4 px-5 py-4 items-center hover:bg-[oklch(0.985_0_0)] transition-colors"
                style={{ gridTemplateColumns: gridCols }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.bg }}>
                    <Icon size={16} style={{ color: t.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{m.title}</p>
                    <p className="text-xs" style={{ color: 'oklch(0.6 0.02 144)' }}>{m.date}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold" style={{ color: t.color }}>{m.type}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: plan.bg, color: plan.text }}>{m.plan}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>
                  <Download size={11} />{m.downloads.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{m.size}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDownload(m)} title="Baixar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--color-frutificar-green)' }}>
                    <Download size={14} />
                  </button>
                  <button onClick={() => openEdit(m)} title="Editar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setRemoveTarget(m)} title="Remover"
                    className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          {visibleMaterials.length === 0 && (
            <div className="px-5 py-10 text-center text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Nenhum material neste filtro.
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo material */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo material
            </DialogTitle>
            <DialogDescription>Envie uma planilha, PDF ou documento para download.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Título</label>
              <input name="title" required placeholder="Ex.: Guia de Adubação" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Tipo</label>
                <SelectField
                  id="create-type"
                  value={createType}
                  onValueChange={(v) => setCreateType(v as MaterialType)}
                  options={typeOptions}
                  placeholder="Selecione"
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Curso / Categoria</label>
                <SelectField
                  id="create-plan"
                  value={createPlan}
                  onValueChange={(v) => setCreatePlan(v as MaterialPlan)}
                  options={planOptions}
                  placeholder="Selecione"
                />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Arquivo</label>
              <input
                ref={createFileRef}
                type="file"
                className="hidden"
                onChange={(e) => setCreateFile(e.target.files?.[0] ?? null)}
              />
              <button type="button" onClick={() => createFileRef.current?.click()}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[oklch(0.97_0.01_144)]"
                style={inputStyle}>
                <Upload size={15} style={{ color: 'var(--color-frutificar-green)' }} />
                <span className="truncate" style={{ color: createFile ? 'var(--color-frutificar-deep)' : 'oklch(0.6 0.03 144)' }}>
                  {createFile?.name || 'Escolher arquivo'}
                </span>
              </button>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setCreateOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                {saving ? 'Enviando…' : 'Enviar material'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar material */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar material
            </DialogTitle>
            <DialogDescription>Atualize as informações deste material.</DialogDescription>
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
                    onValueChange={(v) => setEditType(v as MaterialType)}
                    options={typeOptions}
                    placeholder="Selecione"
                  />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Curso / Categoria</label>
                  <SelectField
                    id="edit-plan"
                    value={editPlan}
                    onValueChange={(v) => setEditPlan(v as MaterialPlan)}
                    options={planOptions}
                    placeholder="Selecione"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Substituir arquivo</label>
                <input
                  ref={editFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                />
                <button type="button" onClick={() => editFileRef.current?.click()}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[oklch(0.97_0.01_144)]"
                  style={inputStyle}>
                  <Upload size={15} style={{ color: 'var(--color-frutificar-green)' }} />
                  <span className="truncate" style={{ color: editFile ? 'var(--color-frutificar-deep)' : 'oklch(0.6 0.03 144)' }}>
                    {editFile?.name || 'Manter arquivo atual'}
                  </span>
                </button>
              </div>
              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                  style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Remover material */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover material?</DialogTitle>
            <DialogDescription>
              O material <strong>{removeTarget?.title}</strong> será removido. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter material
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
