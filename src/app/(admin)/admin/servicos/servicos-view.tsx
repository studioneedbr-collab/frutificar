'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Wrench, Pencil, Trash2, X, Circle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'
import {
  createServiceAction, updateServiceAction, toggleServiceActiveAction, deleteServiceAction,
} from '@/server/actions/admin-services'
import type { ServiceItem, ServiceType } from './data'

const typeOptions = [
  { value: 'INCLUDED', label: 'Incluído no plano' },
  { value: 'AVULSO', label: 'Avulso' },
]
const filters = ['Todos', 'Incluído', 'Avulso', 'Ativos', 'Inativos'] as const
type Filter = (typeof filters)[number]

const inputStyle: React.CSSProperties = { border: '1px solid oklch(0.91 0.01 144)', background: 'oklch(0.99 0.005 144)' }
const inputClass = 'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'
const deep = 'var(--color-frutificar-deep)'
const green = 'var(--color-frutificar-green)'
const fmtPrice = (v: number) => `R$ ${v.toLocaleString('pt-BR')}`

let tmp = 0
const tmpId = () => `tmp-${++tmp}`

export function ServicosAdminView({ initial, preview }: { initial: ServiceItem[]; preview: boolean }) {
  const router = useRouter()
  const [services, setServices] = useState<ServiceItem[]>(initial)
  useEffect(() => { setServices(initial) }, [initial])

  const [filter, setFilter] = useState<Filter>('Todos')
  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState<ServiceType>('AVULSO')
  const [editTarget, setEditTarget] = useState<ServiceItem | null>(null)
  const [editType, setEditType] = useState<ServiceType>('AVULSO')
  const [removeTarget, setRemoveTarget] = useState<ServiceItem | null>(null)

  const activeCount = services.filter((s) => s.active).length
  const visible = services.filter((s) => {
    if (filter === 'Incluído') return s.type === 'INCLUDED'
    if (filter === 'Avulso') return s.type === 'AVULSO'
    if (filter === 'Ativos') return s.active
    if (filter === 'Inativos') return !s.active
    return true
  })

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const description = String(data.get('description') ?? '').trim()
    const price = createType === 'INCLUDED' ? 0 : Number(data.get('price') ?? 0)
    if (!name || !description) return
    const optimistic: ServiceItem = { id: tmpId(), name, description, type: createType, price, active: true }
    setServices((cur) => [optimistic, ...cur])
    setCreateOpen(false)
    toast.success('Serviço criado', { description: name })
    if (!preview) {
      const res = await createServiceAction({ name, description, type: createType, price, active: true })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const t = editTarget
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim() || t.name
    const description = String(data.get('description') ?? '').trim() || t.description
    const price = editType === 'INCLUDED' ? 0 : Number(data.get('price') ?? t.price)
    setServices((cur) => cur.map((s) => (s.id === t.id ? { ...s, name, description, type: editType, price } : s)))
    setEditTarget(null)
    toast.success('Serviço atualizado', { description: name })
    if (!preview) {
      const res = await updateServiceAction(t.id, { name, description, type: editType, price })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function toggleActive(s: ServiceItem) {
    const next = !s.active
    setServices((cur) => cur.map((x) => (x.id === s.id ? { ...x, active: next } : x)))
    if (!preview) {
      const res = await toggleServiceActiveAction(s.id, next)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    const t = removeTarget
    setServices((cur) => cur.filter((s) => s.id !== t.id))
    setRemoveTarget(null)
    toast.success('Serviço removido', { description: t.name })
    if (!preview) {
      const res = await deleteServiceAction(t.id)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: deep, letterSpacing: '-0.03em' }}>Serviços</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{services.length} serviços · {activeCount} ativos</p>
        </div>
        <button onClick={() => { setCreateType('AVULSO'); setCreateOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity shrink-0"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo serviço
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={f === filter ? { background: 'var(--color-frutificar-forest)', color: 'white' } : { background: 'white', color: 'oklch(0.52 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-5 flex items-start gap-4" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.active ? 'oklch(0.48 0.13 144 / 0.1)' : 'oklch(0.94 0.01 144)' }}>
              <Wrench size={18} style={{ color: s.active ? green : 'oklch(0.6 0.02 144)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm" style={{ color: deep }}>{s.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={s.type === 'INCLUDED' ? { background: 'oklch(0.48 0.13 144 / 0.1)', color: green } : { background: 'oklch(0.62 0.12 55 / 0.12)', color: 'var(--color-earth)' }}>
                  {s.type === 'INCLUDED' ? 'Incluído' : 'Avulso'}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.5 }}>{s.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-bold" style={{ color: deep }}>{s.type === 'INCLUDED' ? 'Incluído no plano' : fmtPrice(s.price)}</span>
                <button onClick={() => toggleActive(s)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: s.active ? green : 'oklch(0.6 0.03 144)' }}>
                  <Circle size={7} fill="currentColor" />{s.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setEditType(s.type); setEditTarget(s) }} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.6 0.02 144)' }} title="Editar"><Pencil size={15} /></button>
              <button onClick={() => setRemoveTarget(s)} className="p-1.5 rounded-lg hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }} title="Remover"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="sm:col-span-2 rounded-2xl bg-white p-10 text-center text-sm" style={{ border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
            Nenhum serviço neste filtro.
          </div>
        )}
      </div>

      {/* Criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: deep }}><Plus size={18} style={{ color: green }} /> Novo serviço</DialogTitle>
            <DialogDescription>Cadastre um serviço oferecido aos produtores.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div><label className={labelClass} style={{ color: deep }}>Nome</label><input name="name" required placeholder="Ex.: Análise de Solo" className={inputClass} style={inputStyle} /></div>
            <div><label className={labelClass} style={{ color: deep }}>Descrição</label><input name="description" required placeholder="Breve descrição do serviço" className={inputClass} style={inputStyle} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass} style={{ color: deep }}>Tipo</label><SelectField id="create-type" value={createType} onValueChange={(v) => setCreateType(v as ServiceType)} options={typeOptions} placeholder="Selecione" /></div>
              {createType === 'AVULSO' && <div><label className={labelClass} style={{ color: deep }}>Preço (R$)</label><input name="price" type="number" min="0" placeholder="280" className={inputClass} style={inputStyle} /></div>}
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[oklch(0.96_0.01_144)]" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90" style={{ background: green, boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Criar</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: deep }}><Pencil size={18} style={{ color: green }} /> Editar serviço</DialogTitle>
            <DialogDescription>Atualize as informações do serviço.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div><label className={labelClass} style={{ color: deep }}>Nome</label><input name="name" required defaultValue={editTarget.name} className={inputClass} style={inputStyle} /></div>
              <div><label className={labelClass} style={{ color: deep }}>Descrição</label><input name="description" required defaultValue={editTarget.description} className={inputClass} style={inputStyle} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass} style={{ color: deep }}>Tipo</label><SelectField id="edit-type" value={editType} onValueChange={(v) => setEditType(v as ServiceType)} options={typeOptions} placeholder="Selecione" /></div>
                {editType === 'AVULSO' && <div><label className={labelClass} style={{ color: deep }}>Preço (R$)</label><input name="price" type="number" min="0" defaultValue={editTarget.price} className={inputClass} style={inputStyle} /></div>}
              </div>
              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[oklch(0.96_0.01_144)]" style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90" style={{ background: green, boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Salvar</button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Remover */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}><Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} /></div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: deep }}>Remover serviço?</DialogTitle>
            <DialogDescription>O serviço <strong>{removeTarget?.name}</strong> será removido. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90" style={{ background: green, boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>Manter</button>
            <button onClick={handleRemove} className="px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[oklch(0.6_0.18_25_/_0.06)] inline-flex items-center gap-1.5" style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}><X size={14} /> Remover</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
