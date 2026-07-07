'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MapPin, Sprout, Mountain, Ruler, Layers, Plus, ArrowRight,
  Droplets, CheckCircle2, Trash2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'
import {
  createProperty, deleteProperty, createPlot, deletePlot,
} from '@/server/actions/properties'
import type { Property, Status } from './data'

function statusColors(status: Status) {
  if (status === 'Saudável') return { dot: 'var(--color-frutificar-green)', bg: 'oklch(0.48 0.13 144 / 0.1)', text: 'var(--color-frutificar-green)' }
  if (status === 'Atenção') return { dot: 'oklch(0.7 0.15 70)', bg: 'oklch(0.7 0.15 70 / 0.12)', text: 'oklch(0.55 0.13 70)' }
  return { dot: 'oklch(0.7 0.02 144)', bg: 'oklch(0.7 0.02 144 / 0.1)', text: 'oklch(0.5 0.02 144)' }
}

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const inputClass =
  'w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]'
const labelClass = 'block text-xs font-semibold mb-1.5'

export function PropriedadesView({
  initialProperties, preview,
}: {
  initialProperties: Property[]
  preview: boolean
}) {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>(initialProperties)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setProperties(initialProperties) }, [initialProperties])

  const tmpRef = useRef(0)
  const tmpId = () => `tmp-${++tmpRef.current}`

  const [addOpen, setAddOpen] = useState(false)
  const [talhaoTargetId, setTalhaoTargetId] = useState<string | null>(null)
  const [talhaoStatus, setTalhaoStatus] = useState<Status>('Saudável')
  const [removeTalhao, setRemoveTalhao] = useState<{ propId: string; talhaoId: string } | null>(null)
  const [removeProp, setRemoveProp] = useState<string | null>(null)

  /* ── Ações (otimista + Server Action quando !preview) ── */
  async function handleAddProperty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim() || 'Nova propriedade'
    const location = String(data.get('location') ?? '').trim()
    const area = String(data.get('area') ?? '').trim()
    const cultura = String(data.get('cultura') ?? '').trim()
    const altitude = String(data.get('altitude') ?? '').trim()

    setProperties((prev) => [
      ...prev,
      {
        id: tmpId(), name, location: location || '—',
        area: area ? `${area} ha` : '—', talhoes: 0,
        cultura: cultura || '—', altitude: altitude ? `${altitude} m` : undefined,
        talhoesList: [],
      },
    ])
    setAddOpen(false)
    toast.success('Propriedade adicionada', { description: `${name} foi cadastrada.` })

    if (!preview) {
      const res = await createProperty({ name, location: location || undefined, totalAreaHa: area })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function handleAddTalhao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (talhaoTargetId === null) return
    const propId = talhaoTargetId
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim() || 'Novo talhão'
    const cultura = String(data.get('cultura') ?? '').trim()
    const area = String(data.get('area') ?? '').trim()
    const status = talhaoStatus

    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== propId) return p
        const list = [
          ...p.talhoesList,
          { id: tmpId(), name, cultura: cultura || '—', area: area ? `${area} ha` : '—', status },
        ]
        return { ...p, talhoesList: list, talhoes: list.length }
      }),
    )
    setTalhaoTargetId(null)
    setTalhaoStatus('Saudável')
    toast.success('Talhão adicionado')

    if (!preview) {
      const res = await createPlot(propId, { name, areaHa: area, status })
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function confirmRemoveTalhao() {
    if (!removeTalhao) return
    const { propId, talhaoId } = removeTalhao
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id !== propId) return p
        const list = p.talhoesList.filter((t) => t.id !== talhaoId)
        return { ...p, talhoesList: list, talhoes: list.length }
      }),
    )
    setRemoveTalhao(null)
    toast.success('Talhão removido')

    if (!preview) {
      const res = await deletePlot(talhaoId)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  async function confirmRemoveProperty() {
    if (removeProp === null) return
    const propId = removeProp
    setProperties((prev) => prev.filter((p) => p.id !== propId))
    setRemoveProp(null)
    toast.success('Propriedade removida')

    if (!preview) {
      const res = await deleteProperty(propId)
      if (!res.ok) toast.error(res.error)
      router.refresh()
    }
  }

  function handleDetails(name: string) {
    toast.info(`Abrindo ${name}...`)
  }

  const [primary, ...rest] = properties

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        .talhao-card .talhao-remove { opacity: 0; transition: opacity .2s; }
        .talhao-card:hover .talhao-remove, .talhao-card:focus-within .talhao-remove { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim flex flex-col md:flex-row md:items-end md:justify-between gap-4" style={{ animationDelay: '0.04s' }}>
        <div>
          <div className="text-xs font-bold tracking-widest mb-1.5" style={{ color: 'var(--color-earth)' }}>
            MINHAS PROPRIEDADES
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Propriedades
          </h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>
            Gerencie suas fazendas, talhões e culturas.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm shrink-0 transition-all hover:scale-[1.03] active:scale-[0.98]"
          style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
        >
          <Plus size={16} /> Adicionar propriedade
        </button>
      </header>

      {/* ── Propriedade principal ── */}
      {primary && (
        <section
          className="dash-anim dash-lift rounded-2xl bg-white p-5 md:p-6"
          style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.1s' }}
        >
          <div className="flex flex-col md:flex-row gap-5 md:gap-6">
            {/* Mapa placeholder */}
            <div
              className="relative h-32 md:h-auto md:w-56 shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, var(--color-frutificar-green) 0%, var(--color-frutificar-night) 100%)' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 30% 20%, oklch(1 0 0 / 0.12), transparent 60%)' }}
              />
              <MapPin size={34} className="relative" style={{ color: 'oklch(0.83 0.08 144)' }} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2
                  className="text-xl font-bold"
                  style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
                >
                  {primary.name}
                </h2>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
                >
                  PRINCIPAL
                </span>
              </div>
              <p className="text-sm flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                <MapPin size={14} /> {primary.location}
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { icon: Ruler, label: 'Área total', value: primary.area, color: 'oklch(0.48 0.13 144)', bg: 'oklch(0.48 0.13 144 / 0.1)' },
                  { icon: Layers, label: 'Talhões', value: String(primary.talhoes), color: 'oklch(0.62 0.12 55)', bg: 'oklch(0.62 0.12 55 / 0.1)' },
                  { icon: Sprout, label: 'Cultura', value: primary.cultura, color: 'oklch(0.48 0.13 144)', bg: 'oklch(0.48 0.13 144 / 0.1)' },
                  { icon: Mountain, label: 'Altitude', value: primary.altitude ?? '—', color: 'oklch(0.62 0.14 75)', bg: 'oklch(0.78 0.17 75 / 0.16)' },
                ].map((s) => {
                  const Icon = s.icon
                  return (
                    <div
                      key={s.label}
                      className="rounded-xl p-3"
                      style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.bg }}>
                        <Icon size={15} style={{ color: s.color }} />
                      </div>
                      <div className="text-[11px]" style={{ color: 'oklch(0.55 0.04 144)' }}>{s.label}</div>
                      <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-frutificar-deep)' }}>{s.value}</div>
                    </div>
                  )
                })}
              </div>

              {/* Última atividade */}
              <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: 'oklch(0.5 0.04 144)' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--color-frutificar-green)' }} />
                <span>
                  Última atividade: <strong style={{ color: 'var(--color-frutificar-deep)' }}>diagnóstico de solo</strong> · há 3 dias
                </span>
              </div>

              {/* Ações */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <button
                  onClick={() => handleDetails(primary.name)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                >
                  Ver detalhes <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => { setTalhaoStatus('Saudável'); setTalhaoTargetId(primary.id) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.98_0.008_144)]"
                  style={{ border: '1px solid oklch(0.91 0.01 144)', color: 'var(--color-frutificar-deep)' }}
                >
                  <Plus size={14} /> Novo talhão
                </button>
              </div>
            </div>
          </div>

          {/* ── Talhões ── */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid oklch(0.93 0.01 144)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
              >
                <Layers size={17} style={{ color: 'var(--color-frutificar-green)' }} /> Talhões
              </h3>
              <span className="text-xs font-medium" style={{ color: 'oklch(0.55 0.04 144)' }}>
                {primary.talhoes} talhões · {primary.area}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {primary.talhoesList.map((t) => {
                const c = statusColors(t.status)
                const note =
                  t.status === 'Atenção' ? 'pragas monitoradas' : t.status === 'Pousio' ? 'em descanso' : null
                return (
                  <div
                    key={t.id}
                    className="talhao-card dash-lift relative rounded-xl p-4"
                    style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                          <h4 className="font-bold text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{t.name}</h4>
                        </div>
                        <p className="text-xs mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1" style={{ color: 'oklch(0.55 0.04 144)' }}>
                          <span className="inline-flex items-center gap-1">
                            <Sprout size={13} style={{ color: 'var(--color-frutificar-green)' }} /> {t.cultura}
                          </span>
                          <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span>
                          <span className="inline-flex items-center gap-1"><Ruler size={13} /> {t.area}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: c.bg, color: c.text }}
                        >
                          {t.status}
                        </span>
                        <button
                          onClick={() => setRemoveTalhao({ propId: primary.id, talhaoId: t.id })}
                          aria-label="Remover talhão"
                          className="talhao-remove inline-flex items-center justify-center w-6 h-6 rounded-lg transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.1)]"
                          style={{ color: 'oklch(0.6 0.18 25)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {note && (
                      <p className="text-[11px] mt-2.5 flex items-center gap-1.5" style={{ color: c.text }}>
                        <Droplets size={12} /> {note}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Demais propriedades (compactas) ── */}
      {rest.map((p, i) => (
        <section
          key={p.id}
          className="dash-anim dash-lift rounded-2xl bg-white p-5"
          style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.18 + i * 0.06}s` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: 'linear-gradient(150deg, var(--color-frutificar-green) 0%, var(--color-frutificar-night) 100%)' }}
            >
              <MapPin size={22} style={{ color: 'oklch(0.83 0.08 144)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-base font-bold"
                style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
              >
                {p.name}
              </h2>
              <p className="text-xs mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1" style={{ color: 'oklch(0.55 0.04 144)' }}>
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {p.location}</span>
                <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span>
                <span className="inline-flex items-center gap-1"><Ruler size={12} /> {p.area}</span>
                <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span>
                <span className="inline-flex items-center gap-1"><Sprout size={12} /> {p.cultura}</span>
                <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span>
                <span className="inline-flex items-center gap-1"><Layers size={12} /> {p.talhoes} talhões</span>
              </p>
            </div>
            <button
              onClick={() => { setTalhaoStatus('Saudável'); setTalhaoTargetId(p.id) }}
              aria-label="Novo talhão"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors hover:bg-[oklch(0.98_0.008_144)]"
              style={{ border: '1px solid oklch(0.91 0.01 144)', color: 'var(--color-frutificar-deep)' }}
            >
              <Plus size={15} />
            </button>
            <button
              onClick={() => setRemoveProp(p.id)}
              aria-label="Remover propriedade"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]"
              style={{ color: 'oklch(0.6 0.18 25)' }}
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={() => handleDetails(p.name)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-opacity hover:opacity-85"
              style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
            >
              <span className="hidden sm:inline">Ver detalhes</span> <ArrowRight size={14} />
            </button>
          </div>
        </section>
      ))}

      {/* ── CTA: Adicionar nova propriedade ── */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="dash-anim dash-lift group flex flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center w-full transition-colors hover:bg-[oklch(0.98_0.008_144)]"
        style={{ border: '2px dashed oklch(0.85 0.03 144)', animationDelay: '0.24s' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
          style={{ background: 'oklch(0.62 0.12 55 / 0.1)' }}
        >
          <Plus size={22} style={{ color: 'var(--color-earth)' }} />
        </div>
        <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          Adicionar nova propriedade
        </h3>
        <p className="text-xs max-w-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>
          Cadastre uma fazenda ou sítio para mapear talhões, culturas e acompanhar diagnósticos.
        </p>
      </button>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Adicionar propriedade */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <MapPin size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Adicionar propriedade
            </DialogTitle>
            <DialogDescription>Cadastre uma fazenda ou sítio para mapear talhões e culturas.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProperty} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome</label>
              <input name="name" required placeholder="Ex.: Fazenda Boa Esperança"
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Cidade/UF</label>
              <input name="location" placeholder="Ex.: Patrocínio/MG"
                className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Área (ha)</label>
                <input name="area" inputMode="numeric" placeholder="Ex.: 50"
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Altitude (m)</label>
                <input name="altitude" inputMode="numeric" placeholder="Ex.: 900"
                  className={inputClass} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Cultura principal</label>
              <input name="cultura" placeholder="Ex.: Café arábica"
                className={inputClass} style={inputStyle} />
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setAddOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                Adicionar propriedade
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Novo talhão */}
      <Dialog open={talhaoTargetId !== null} onOpenChange={(o) => { if (!o) { setTalhaoTargetId(null); setTalhaoStatus('Saudável') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Layers size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Novo talhão
            </DialogTitle>
            <DialogDescription>Defina a cultura, a área e o status atual do talhão.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTalhao} className="space-y-3.5">
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Nome do talhão</label>
              <input name="name" required placeholder="Ex.: Talhão C1"
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Cultura</label>
              <input name="cultura" placeholder="Ex.: Café Catuaí"
                className={inputClass} style={inputStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }}>Área (ha)</label>
                <input name="area" inputMode="numeric" placeholder="Ex.: 20"
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--color-frutificar-deep)' }} htmlFor="talhao-status">Status</label>
                <SelectField
                  id="talhao-status"
                  value={talhaoStatus}
                  onValueChange={(val) => setTalhaoStatus(val as Status)}
                  options={[
                    { value: 'Saudável', label: 'Saudável' },
                    { value: 'Atenção', label: 'Atenção' },
                    { value: 'Pousio', label: 'Pousio' },
                  ]}
                  placeholder="Selecione o status"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => { setTalhaoTargetId(null); setTalhaoStatus('Saudável') }}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                Adicionar talhão
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar remoção de talhão */}
      <Dialog open={removeTalhao !== null} onOpenChange={(o) => !o && setRemoveTalhao(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover este talhão?</DialogTitle>
            <DialogDescription>Esta ação não poderá ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveTalhao(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter talhão
            </button>
            <button onClick={confirmRemoveTalhao}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)]"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              Remover talhão
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar remoção de propriedade */}
      <Dialog open={removeProp !== null} onOpenChange={(o) => !o && setRemoveProp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Remover esta propriedade?</DialogTitle>
            <DialogDescription>Todos os talhões cadastrados nela também serão removidos.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setRemoveProp(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter propriedade
            </button>
            <button onClick={confirmRemoveProperty}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)]"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              Remover propriedade
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
