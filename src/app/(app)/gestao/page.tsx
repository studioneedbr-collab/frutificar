'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  Sprout, Wallet, Tractor, Plus, ArrowUpRight, Trash2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

/* DEV PREVIEW — sem banco. Dados mock da Fazenda Santa Clara (Patrocínio/MG), plano Premium. */

const kpis = [
  {
    icon: Tractor,
    label: 'Custo por hectare',
    value: 'R$ 9.840',
    trend: '+3%',
    trendDir: 'up' as const,
    sub: 'vs safra anterior',
    color: 'oklch(0.62 0.14 75)',
    bg: 'oklch(0.78 0.17 75 / 0.16)',
    trendColor: 'oklch(0.62 0.14 75)',
  },
  {
    icon: DollarSign,
    label: 'Receita estimada',
    value: 'R$ 612 mil',
    trend: '+12%',
    trendDir: 'up' as const,
    sub: 'vs safra anterior',
    color: 'oklch(0.48 0.13 144)',
    bg: 'oklch(0.48 0.13 144 / 0.1)',
    trendColor: 'oklch(0.48 0.13 144)',
  },
  {
    icon: Wallet,
    label: 'Margem',
    value: '38%',
    trend: 'saudável',
    trendDir: 'flat' as const,
    sub: 'lucro sobre receita',
    color: 'oklch(0.55 0.1 220)',
    bg: 'oklch(0.55 0.1 220 / 0.1)',
    trendColor: 'oklch(0.48 0.13 144)',
  },
  {
    icon: Sprout,
    label: 'Produtividade',
    value: '42 sc/ha',
    trend: '+5 sc',
    trendDir: 'up' as const,
    sub: 'vs safra anterior',
    color: 'oklch(0.48 0.13 144)',
    bg: 'oklch(0.48 0.13 144 / 0.1)',
    trendColor: 'oklch(0.48 0.13 144)',
  },
]

const costs = [
  { label: 'Insumos',     pct: 38, value: 'R$ 314.000', color: 'oklch(0.48 0.13 144)' },
  { label: 'Mão de obra', pct: 24, value: 'R$ 198.000', color: 'oklch(0.54 0.12 120)' },
  { label: 'Mecanização', pct: 16, value: 'R$ 132.000', color: 'oklch(0.58 0.12 95)' },
  { label: 'Defensivos',  pct: 14, value: 'R$ 116.000', color: 'oklch(0.62 0.12 75)' },
  { label: 'Outros',      pct: 8,  value: 'R$ 66.000',  color: 'oklch(0.62 0.12 55)' },
]

const yields = [
  { year: '2021', val: 34 },
  { year: '2022', val: 37 },
  { year: '2023', val: 39 },
  { year: '2024', val: 42 },
]
const yieldMax = 48

type Entry = {
  id: number
  date: string
  category: string
  categoryColor: string
  desc: string
  value: string
  type: 'receita' | 'custo'
}

const initialEntries: Entry[] = [
  { id: 1, date: '22 jun', category: 'Receita',     categoryColor: 'oklch(0.48 0.13 144)', desc: 'Venda de café (saca)',      value: '+R$ 48.600', type: 'receita' },
  { id: 2, date: '19 jun', category: 'Insumos',     categoryColor: 'oklch(0.54 0.12 120)', desc: 'Compra de fertilizante NPK', value: 'R$ 12.400', type: 'custo' },
  { id: 3, date: '17 jun', category: 'Mão de obra', categoryColor: 'oklch(0.58 0.12 95)',  desc: 'Diária de colheita',        value: 'R$ 3.850',  type: 'custo' },
  { id: 4, date: '14 jun', category: 'Mecanização', categoryColor: 'oklch(0.62 0.12 75)',  desc: 'Manutenção do trator',      value: 'R$ 2.180',  type: 'custo' },
  { id: 5, date: '11 jun', category: 'Defensivos',  categoryColor: 'oklch(0.6 0.18 25)',   desc: 'Defensivo foliar',          value: 'R$ 1.960',  type: 'custo' },
  { id: 6, date: '08 jun', category: 'Receita',     categoryColor: 'oklch(0.48 0.13 144)', desc: 'Adiantamento safra',        value: '+R$ 25.000', type: 'receita' },
]

/* Cores por categoria, alinhadas ao padrão visual da tela */
const categoryColors: Record<string, string> = {
  'Insumos':     'oklch(0.54 0.12 120)',
  'Mão de obra': 'oklch(0.58 0.12 95)',
  'Mecanização': 'oklch(0.62 0.12 75)',
  'Defensivos':  'oklch(0.6 0.18 25)',
  'Venda':       'oklch(0.48 0.13 144)',
  'Outros':      'oklch(0.62 0.12 55)',
}

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}

export default function GestaoPage() {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [nextId, setNextId] = useState(initialEntries.length + 1)

  const [newOpen, setNewOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<Entry | null>(null)

  /* ── Ações ── */
  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const type = (String(data.get('type') ?? 'custo') === 'receita' ? 'receita' : 'custo') as Entry['type']
    const category = String(data.get('category') ?? 'Outros')
    const desc = String(data.get('desc') ?? '').trim() || 'Lançamento sem descrição'
    const rawValue = String(data.get('value') ?? '').trim()
    const date = String(data.get('date') ?? '')

    const cleanValue = rawValue.replace(/^R\$\s*/i, '').replace(/^\+/, '').trim()
    const value = type === 'receita' ? `+R$ ${cleanValue}` : `R$ ${cleanValue}`

    const entry: Entry = {
      id: nextId,
      date: date || 'hoje',
      category,
      categoryColor: categoryColors[category] ?? 'oklch(0.62 0.12 55)',
      desc,
      value,
      type,
    }

    setEntries((cur) => [entry, ...cur])
    setNextId((n) => n + 1)
    setNewOpen(false)
    toast.success('Lançamento adicionado', { description: `${desc} registrado.` })
  }

  function handleRemove() {
    if (!removeTarget) return
    setEntries((cur) => cur.filter((e) => e.id !== removeTarget.id))
    setRemoveTarget(null)
    toast.success('Lançamento removido')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes barGrow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .bar-fill { transform-origin: left; animation: barGrow 1s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes colGrow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        .col-fill { transform-origin: bottom; animation: colGrow 1s cubic-bezier(.16,1,.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim, .bar-fill, .col-fill { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest block mb-1.5" style={{ color: 'var(--color-earth)' }}>
            GESTÃO RURAL
          </span>
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Gestão da Propriedade
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
            Acompanhe custos, receitas e produtividade da sua safra.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold self-start sm:self-auto shrink-0"
          style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', color: 'var(--color-frutificar-deep)' }}
        >
          <Sprout size={13} style={{ color: 'var(--color-frutificar-green)' }} />
          Safra 2024/25
        </div>
      </header>

      {/* ── KPI cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon
          const TrendIcon = (k.trendDir as 'up' | 'flat' | 'down') === 'down' ? TrendingDown : TrendingUp
          return (
            <div
              key={k.label}
              className="dash-anim dash-lift rounded-2xl p-5 bg-white"
              style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.05 + i * 0.06}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                  <Icon size={18} style={{ color: k.color }} />
                </div>
                {k.trendDir !== 'flat' ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
                    style={{ background: k.trendColor.replace(')', ' / 0.1)'), color: k.trendColor }}
                  >
                    <TrendIcon size={12} /> {k.trend}
                  </span>
                ) : (
                  <span
                    className="text-[11px] font-bold px-2 py-1 rounded-full"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
                  >
                    {k.trend}
                  </span>
                )}
              </div>
              <div
                className="text-2xl font-bold"
                style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
              >
                {k.value}
              </div>
              <div className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--color-frutificar-deep)' }}>{k.label}</div>
              <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)' }}>{k.sub}</div>
            </div>
          )
        })}
      </section>

      {/* ── Charts grid ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Custos por categoria */}
        <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <Wallet size={18} style={{ color: 'var(--color-earth)' }} /> Custos por categoria
            </h2>
            <span className="text-xs font-medium" style={{ color: 'oklch(0.55 0.04 144)' }}>Total R$ 826.000</span>
          </div>
          <div className="space-y-4">
            {costs.map((c, i) => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{c.label}</span>
                  <span className="text-[13px]" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    {c.value} <strong style={{ color: 'var(--color-frutificar-deep)' }}>· {c.pct}%</strong>
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.96 0.008 144)' }}>
                  <div
                    className="bar-fill h-full rounded-full"
                    style={{ width: `${c.pct}%`, background: c.color, animationDelay: `${0.4 + i * 0.08}s` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Produtividade por safra */}
        <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.36s' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <BarChart3 size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Produtividade por safra
            </h2>
            <span className="text-xs font-medium" style={{ color: 'oklch(0.55 0.04 144)' }}>sc/ha</span>
          </div>
          <div
            className="relative flex items-end justify-around gap-3"
            style={{ height: 180, borderBottom: '1px solid oklch(0.91 0.01 144)' }}
          >
            {yields.map((y, i) => (
              <div key={y.year} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
                  {y.val}
                </span>
                <div
                  className="col-fill w-full max-w-[52px] rounded-t-lg"
                  style={{
                    height: `${(y.val / yieldMax) * 100}%`,
                    background: 'linear-gradient(180deg, oklch(0.55 0.13 144), oklch(0.40 0.12 145))',
                    animationDelay: `${0.45 + i * 0.1}s`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-around gap-3 mt-2">
            {yields.map((y) => (
              <span key={y.year} className="flex-1 text-center text-xs font-medium" style={{ color: 'oklch(0.55 0.04 144)' }}>
                {y.year}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* ── Lançamentos recentes ── */}
      <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.42s' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
            <DollarSign size={18} style={{ color: 'var(--color-earth)' }} /> Lançamentos recentes
          </h2>
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
          >
            <Plus size={15} /> Novo lançamento
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.93 0.01 144)' }}>
          {entries.map((e) => (
            <div key={e.id} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="text-xs font-medium w-14 shrink-0 tabular-nums" style={{ color: 'oklch(0.55 0.04 144)' }}>
                {e.date}
              </span>
              <span className="inline-flex items-center gap-1.5 w-32 shrink-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.categoryColor }} />
                <span className="text-xs font-medium truncate" style={{ color: 'oklch(0.48 0.04 144)' }}>{e.category}</span>
              </span>
              <span className="text-[13px] font-medium flex-1 min-w-0 truncate" style={{ color: 'var(--color-frutificar-deep)' }}>
                {e.desc}
              </span>
              <span
                className="text-[13px] font-bold shrink-0 tabular-nums inline-flex items-center gap-1"
                style={{ color: e.type === 'receita' ? 'var(--color-frutificar-green)' : 'oklch(0.45 0.06 25)' }}
              >
                {e.type === 'receita' ? <ArrowUpRight size={13} /> : null}
                {e.value.startsWith('+') || e.value.startsWith('-') ? e.value : (e.type === 'receita' ? `+${e.value}` : `− ${e.value}`)}
              </span>
              <button
                onClick={() => setRemoveTarget(e)}
                aria-label="Remover lançamento"
                className="shrink-0 p-1.5 rounded-lg opacity-40 transition-all hover:opacity-100 hover:bg-[oklch(0.6_0.18_25_/_0.08)]"
                style={{ color: 'oklch(0.6 0.18 25)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo lançamento */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Plus size={18} style={{ color: 'var(--color-earth)' }} /> Novo lançamento
            </DialogTitle>
            <DialogDescription>Registre uma receita ou custo da sua safra.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Tipo</label>
                <select name="type" defaultValue="custo"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle}>
                  <option value="receita">Receita</option>
                  <option value="custo">Custo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Categoria</label>
                <select name="category" defaultValue="Insumos"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle}>
                  <option value="Insumos">Insumos</option>
                  <option value="Mão de obra">Mão de obra</option>
                  <option value="Mecanização">Mecanização</option>
                  <option value="Defensivos">Defensivos</option>
                  <option value="Venda">Venda</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Descrição</label>
              <input name="desc" placeholder="Ex.: Compra de fertilizante NPK"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Valor</label>
                <input name="value" inputMode="decimal" placeholder="1.200,00"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Data</label>
                <input name="date" type="date"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setNewOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                Adicionar lançamento
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar remoção */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={18} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover este lançamento?</DialogTitle>
            <DialogDescription>
              {removeTarget ? <>“{removeTarget.desc}” será removido da lista. Esta ação não pode ser desfeita.</> : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTarget(null)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Cancelar
            </button>
            <button onClick={handleRemove}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'oklch(0.6 0.18 25)', boxShadow: '0 8px 24px oklch(0.6 0.18 25 / 0.3)' }}>
              Remover
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
