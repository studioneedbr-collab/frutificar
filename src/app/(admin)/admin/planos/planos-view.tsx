'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Users, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'
import { updatePlanAction, togglePlanActive } from '@/server/actions/admin-plans'
import type { Plan } from './data'

const colorOptions = [
  { value: 'oklch(0.55 0.1 220)', label: 'Azul' },
  { value: 'oklch(0.62 0.12 55)', label: 'Laranja' },
  { value: 'oklch(0.78 0.17 75)', label: 'Dourado' },
  { value: 'oklch(0.48 0.13 144)', label: 'Verde' },
]

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

function formatPrice(price: number) {
  return `R$ ${price}`
}

export function PlanosView({
  initialPlans, preview,
}: {
  initialPlans: Plan[]
  preview: boolean
}) {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>(initialPlans)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setPlans(initialPlans) }, [initialPlans])

  const [nextId, setNextId] = useState(initialPlans.length + 1)

  // Editar plano
  const [editTarget, setEditTarget] = useState<Plan | null>(null)
  const [editColor, setEditColor] = useState<string>(colorOptions[0].value)
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')

  // Novo plano
  const [createOpen, setCreateOpen] = useState(false)
  const [createColor, setCreateColor] = useState<string>(colorOptions[0].value)
  const [createFeatures, setCreateFeatures] = useState<string[]>([])
  const [newCreateFeature, setNewCreateFeature] = useState('')

  /* ── Ações ── */
  function openEdit(plan: Plan) {
    setEditColor(plan.color)
    setEditFeatures([...plan.features])
    setNewFeature('')
    setEditTarget(plan)
  }

  function addEditFeature() {
    const f = newFeature.trim()
    if (!f) return
    setEditFeatures((cur) => [...cur, f])
    setNewFeature('')
  }

  function removeEditFeature(index: number) {
    setEditFeatures((cur) => cur.filter((_, i) => i !== index))
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    const planId = editTarget.id
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim() || editTarget.name
    const price = Number(String(data.get('price') ?? '').trim()) || editTarget.price
    const features = editFeatures

    setPlans((cur) =>
      cur.map((p) =>
        p.id === planId ? { ...p, name, price, color: editColor, features } : p,
      ),
    )
    setEditTarget(null)
    toast.success('Plano atualizado', { description: name })

    if (!preview) {
      const res = await updatePlanAction(planId, { priceMonthly: Number(price), features })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function toggleActive(plan: Plan) {
    const next = !plan.active
    setPlans((cur) => cur.map((p) => (p.id === plan.id ? { ...p, active: next } : p)))
    toast.success(next ? 'Plano ativado' : 'Plano desativado', {
      description: next ? `${plan.name} visível na landing` : `${plan.name} oculto na landing`,
    })

    if (!preview) {
      const res = await togglePlanActive(plan.id, next)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  function addCreateFeature() {
    const f = newCreateFeature.trim()
    if (!f) return
    setCreateFeatures((cur) => [...cur, f])
    setNewCreateFeature('')
  }

  function removeCreateFeature(index: number) {
    setCreateFeatures((cur) => cur.filter((_, i) => i !== index))
  }

  function openCreate() {
    setCreateColor(colorOptions[0].value)
    setCreateFeatures([])
    setNewCreateFeature('')
    setCreateOpen(true)
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    if (!name) return
    const price = Number(String(data.get('price') ?? '').trim()) || 0

    // TODO: sem create action — criação é apenas otimista por enquanto.
    const plan: Plan = {
      id: String(nextId),
      name,
      price,
      color: createColor,
      active: true,
      subscribers: 0,
      revenue: 'R$ 0',
      features: createFeatures,
    }
    setPlans((cur) => [...cur, plan])
    setNextId((n) => n + 1)
    setCreateOpen(false)
    toast.success('Plano criado', { description: name })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Planos</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Configuração dos planos de assinatura da plataforma</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div key={p.id} className="rounded-2xl p-6 flex flex-col" style={{ background: 'white', border: `2px solid ${p.color.replace(')', ' / 0.25)')}`, opacity: p.active ? 1 : 0.6 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${p.color.replace(')', ' / 0.1)')}`, color: p.color }}>
                {p.name.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={p.active
                    ? { background: 'oklch(0.55 0.14 144 / 0.12)', color: 'oklch(0.38 0.1 144)' }
                    : { background: 'oklch(0.94 0.01 144)', color: 'oklch(0.55 0.03 144)' }}>
                  {p.active ? 'Ativo' : 'Inativo'}
                </span>
                <button onClick={() => openEdit(p)} className="text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: 'oklch(0.95 0.01 144)', color: 'oklch(0.48 0.04 144)' }}>
                  <Pencil size={12} /> Editar
                </button>
              </div>
            </div>

            <div className="mb-5">
              <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.04em' }}>{formatPrice(p.price)}</span>
              <span className="text-sm" style={{ color: 'oklch(0.58 0.03 144)' }}>/mês</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl" style={{ background: 'oklch(0.975 0.005 144)' }}>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs mb-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>
                  <Users size={11} />Assinantes
                </div>
                <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>{p.subscribers}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs mb-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>
                  <TrendingUp size={11} />MRR
                </div>
                <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>{p.revenue}</p>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm" style={{ color: 'oklch(0.42 0.04 144)' }}>
                  <Check size={13} style={{ color: p.color, flexShrink: 0 }} strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <button onClick={() => toggleActive(p)}
              className="mt-5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              {p.active ? 'Desativar plano' : 'Ativar plano'}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <h2 className="font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>Resumo de receita</h2>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'oklch(0.975 0.005 144)' }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'oklch(0.52 0.04 144)' }}>{p.name} · {p.subscribers} assinantes</p>
                <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>{p.revenue}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Editar plano */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Pencil size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Editar plano
            </DialogTitle>
            <DialogDescription>Atualize o preço, a cor e os benefícios deste plano.</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEdit} className="space-y-3.5" key={editTarget.id}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome</label>
                  <input name="name" required defaultValue={editTarget.name} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Preço mensal (R$)</label>
                  <input name="price" type="number" min="0" required defaultValue={editTarget.price} placeholder="Ex.: 47" className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Cor do plano</label>
                <SelectField
                  id="edit-color"
                  value={editColor}
                  onValueChange={setEditColor}
                  options={colorOptions}
                  placeholder="Selecione"
                />
              </div>

              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Benefícios</label>
                <div className="flex items-end gap-2">
                  <input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditFeature() } }}
                    placeholder="Ex.: Chat com IA"
                    className={inputClass}
                    style={inputStyle}
                  />
                  <button type="button" onClick={addEditFeature}
                    className="px-4 py-2.5 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-90 shrink-0"
                    style={{ background: 'var(--color-frutificar-green)' }}>
                    Adicionar
                  </button>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pt-2.5">
                  {editFeatures.length === 0 && (
                    <p className="text-sm py-4 text-center" style={{ color: 'oklch(0.55 0.04 144)' }}>
                      Nenhum benefício ainda. Adicione o primeiro acima.
                    </p>
                  )}
                  {editFeatures.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                      <Check size={14} style={{ color: 'var(--color-frutificar-green)', flexShrink: 0 }} strokeWidth={2.5} />
                      <span className="min-w-0 flex-1 text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{f}</span>
                      <button type="button" onClick={() => removeEditFeature(i)} aria-label="Remover benefício"
                        className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)] shrink-0" style={{ color: 'oklch(0.6 0.18 25)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
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

      {/* Novo plano */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo plano
            </DialogTitle>
            <DialogDescription>Cadastre um novo plano de assinatura. Os assinantes começam em zero.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome</label>
                <input name="name" required placeholder="Ex.: Premium" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Preço mensal (R$)</label>
                <input name="price" type="number" min="0" required placeholder="Ex.: 47" className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Cor do plano</label>
              <SelectField
                id="create-color"
                value={createColor}
                onValueChange={setCreateColor}
                options={colorOptions}
                placeholder="Selecione"
              />
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Benefícios</label>
              <div className="flex items-end gap-2">
                <input
                  value={newCreateFeature}
                  onChange={(e) => setNewCreateFeature(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCreateFeature() } }}
                  placeholder="Ex.: Cursos principais"
                  className={inputClass}
                  style={inputStyle}
                />
                <button type="button" onClick={addCreateFeature}
                  className="px-4 py-2.5 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-90 shrink-0"
                  style={{ background: 'var(--color-frutificar-green)' }}>
                  Adicionar
                </button>
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pt-2.5">
                {createFeatures.length === 0 && (
                  <p className="text-sm py-4 text-center" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    Nenhum benefício ainda. Adicione o primeiro acima.
                  </p>
                )}
                {createFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                    <Check size={14} style={{ color: 'var(--color-frutificar-green)', flexShrink: 0 }} strokeWidth={2.5} />
                    <span className="min-w-0 flex-1 text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{f}</span>
                    <button type="button" onClick={() => removeCreateFeature(i)} aria-label="Remover benefício"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)] shrink-0" style={{ color: 'oklch(0.6 0.18 25)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
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
                Criar plano
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
