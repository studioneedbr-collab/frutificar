'use client'

import { useState } from 'react'
import { Plus, Wrench, Circle, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'

type ServiceType = 'INCLUDED' | 'AVULSO'

type Service = {
  id: number
  name: string
  desc: string
  type: ServiceType
  price: number
  active: boolean
}

const initialServices: Service[] = [
  { id: 1, name: 'Análise de Solo',            desc: 'Análise completa NPK + micronutrientes por talhão',          type: 'AVULSO',   price: 280, active: true },
  { id: 2, name: 'Consultoria Fitossanitária', desc: 'Identificação e controle de pragas e doenças',               type: 'INCLUDED', price: 0,   active: true },
  { id: 3, name: 'Laudo Técnico',              desc: 'Laudo para financiamento bancário — Pronaf',                 type: 'AVULSO',   price: 450, active: true },
  { id: 4, name: 'Projeto de Irrigação',       desc: 'Dimensionamento de sistema de gotejamento',                  type: 'AVULSO',   price: 980, active: true },
  { id: 5, name: 'Acompanhamento Mensal',      desc: 'Visita técnica e relatório de acompanhamento da lavoura',    type: 'INCLUDED', price: 0,   active: false },
]

const typeOptions = [
  { value: 'INCLUDED', label: 'Incluído no plano' },
  { value: 'AVULSO', label: 'Avulso' },
]

const filters = ['Todos', 'Incluído', 'Avulso', 'Ativos', 'Inativos'] as const
type Filter = (typeof filters)[number]
const filterOptions = filters.map((f) => ({ value: f, label: f }))

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

function formatPrice(v: number) {
  return `R$ ${v.toLocaleString('pt-BR')}`
}

export default function AdminServicosPage() {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [filter, setFilter] = useState<Filter>('Todos')
  const [nextId, setNextId] = useState(initialServices.length + 1)

  // Novo serviço
  const [createOpen, setCreateOpen] = useState(false)
  const [createType, setCreateType] = useState<ServiceType>('INCLUDED')

  // Editar serviço
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [editType, setEditType] = useState<ServiceType>('INCLUDED')

  // Remover serviço
  const [removeTarget, setRemoveTarget] = useState<Service | null>(null)

  const activeCount = services.filter((s) => s.active).length

  const visibleServices = services.filter((s) => {
    if (filter === 'Todos') return true
    if (filter === 'Incluído') return s.type === 'INCLUDED'
    if (filter === 'Avulso') return s.type === 'AVULSO'
    if (filter === 'Ativos') return s.active
    return !s.active
  })

  /* ── Ações ── */
  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    if (!name) return
    const desc = String(data.get('desc') ?? '').trim()
    const price = createType === 'AVULSO' ? Number(data.get('price') ?? 0) || 0 : 0

    const service: Service = {
      id: nextId,
      name,
      desc,
      type: createType,
      price,
      active: true,
    }
    setServices((cur) => [service, ...cur])
    setNextId((n) => n + 1)
    setCreateOpen(false)
    toast.success('Serviço criado', { description: name })
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim() || editTarget.name
    const desc = String(data.get('desc') ?? '').trim()
    const price = editType === 'AVULSO' ? Number(data.get('price') ?? 0) || 0 : 0

    setServices((cur) =>
      cur.map((s) => (s.id === editTarget.id ? { ...s, name, desc, type: editType, price } : s)),
    )
    setEditTarget(null)
    toast.success('Serviço atualizado', { description: name })
  }

  function toggleActive(service: Service) {
    const next = !service.active
    setServices((cur) => cur.map((s) => (s.id === service.id ? { ...s, active: next } : s)))
    toast.success(next ? 'Serviço ativado' : 'Serviço desativado', { description: service.name })
  }

  function handleRemove() {
    if (!removeTarget) return
    const name = removeTarget.name
    setServices((cur) => cur.filter((s) => s.id !== removeTarget.id))
    setRemoveTarget(null)
    toast.success('Serviço removido', { description: name })
  }

  const iconBtnStyle: React.CSSProperties = { color: 'oklch(0.6 0.02 144)' }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Serviços</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{services.length} serviços · {activeCount} ativos</p>
        </div>
        <button
          onClick={() => { setCreateType('INCLUDED'); setCreateOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo serviço
        </button>
      </div>

      <div className="w-48">
        <SelectField
          id="services-filter"
          value={filter}
          onValueChange={(v) => setFilter(v as Filter)}
          options={filterOptions}
          placeholder="Filtrar"
        />
      </div>

      <div className="grid gap-4">
        {visibleServices.map((s) => (
          <div key={s.id} className="rounded-2xl p-5 flex gap-4 items-start hover:shadow-sm transition-shadow"
            style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', opacity: s.active ? 1 : 0.7 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.active ? 'oklch(0.48 0.13 144 / 0.08)' : 'oklch(0.94 0.01 144)' }}>
              <Wrench size={16} style={{ color: s.active ? 'var(--color-frutificar-green)' : 'oklch(0.6 0.02 144)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div>
                  <p className="font-semibold text-[14px] leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>{s.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={s.type === 'AVULSO'
                      ? { background: 'oklch(0.55 0.1 220 / 0.12)', color: 'oklch(0.4 0.1 220)' }
                      : { background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}>
                    {s.type === 'AVULSO' ? 'Avulso' : 'Incluído'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={s.active
                      ? { background: 'oklch(0.55 0.14 144 / 0.12)', color: 'oklch(0.38 0.1 144)' }
                      : { background: 'oklch(0.94 0.01 144)', color: 'oklch(0.55 0.03 144)' }}>
                    <Circle size={5} fill={s.active ? 'oklch(0.55 0.14 144)' : 'oklch(0.6 0.02 144)'} style={{ color: s.active ? 'oklch(0.55 0.14 144)' : 'oklch(0.6 0.02 144)' }} />
                    {s.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <button onClick={() => { setEditType(s.type); setEditTarget(s) }} title="Editar"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={iconBtnStyle}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => toggleActive(s)} title={s.active ? 'Desativar' : 'Ativar'}
                    className="px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                    style={{ color: 'var(--color-frutificar-green)' }}>
                    {s.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => setRemoveTarget(s)} title="Remover"
                    className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]" style={{ color: 'oklch(0.6 0.18 25)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: 'oklch(0.48 0.04 144)', lineHeight: 1.5 }}>{s.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'oklch(0.62 0.02 144)' }}>
                  {s.type === 'AVULSO' ? 'Serviço avulso' : 'Incluído no plano'}
                </span>
                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}>
                  {s.type === 'AVULSO' ? formatPrice(s.price) : 'Incluído'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {visibleServices.length === 0 && (
          <div className="rounded-2xl p-10 text-center text-sm" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
            Nenhum serviço neste filtro.
          </div>
        )}
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo serviço */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo serviço
            </DialogTitle>
            <DialogDescription>Cadastre um serviço incluído no plano ou avulso.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome</label>
              <input name="name" required placeholder="Ex.: Análise de Solo" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Descrição</label>
              <input name="desc" placeholder="Ex.: Análise completa NPK + micronutrientes" className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Tipo</label>
                <SelectField
                  id="create-type"
                  value={createType}
                  onValueChange={(v) => setCreateType(v as ServiceType)}
                  options={typeOptions}
                  placeholder="Selecione"
                />
              </div>
              {createType === 'AVULSO' && (
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Preço (R$)</label>
                  <input name="price" type="number" min="0" step="1" placeholder="Ex.: 280" className={inputClass} style={inputStyle} />
                </div>
              )}
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
                Criar serviço
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar serviço */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar serviço
            </DialogTitle>
            <DialogDescription>Atualize as informações deste serviço.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome</label>
                <input name="name" required defaultValue={editTarget.name} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Descrição</label>
                <input name="desc" defaultValue={editTarget.desc} className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Tipo</label>
                  <SelectField
                    id="edit-type"
                    value={editType}
                    onValueChange={(v) => setEditType(v as ServiceType)}
                    options={typeOptions}
                    placeholder="Selecione"
                  />
                </div>
                {editType === 'AVULSO' && (
                  <div>
                    <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Preço (R$)</label>
                    <input name="price" type="number" min="0" step="1" defaultValue={editTarget.price || ''} placeholder="Ex.: 280" className={inputClass} style={inputStyle} />
                  </div>
                )}
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

      {/* Remover serviço */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover serviço?</DialogTitle>
            <DialogDescription>
              O serviço <strong>{removeTarget?.name}</strong> será removido. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter serviço
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
