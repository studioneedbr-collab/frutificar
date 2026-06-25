'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Sun, MapPin, Calendar, Users, Clock, ArrowUpRight,
  CheckCircle2, Camera, Ticket, ShieldAlert,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

/* DEV PREVIEW — sem banco. Dados mock dos Dias de Campo Gold, com ações em memória. */

type FieldEvent = {
  id: string
  title: string
  local: string
  date: string
  time: string
  vagasTotal: number
  vagasPreenchidas: number
  inscrito: boolean
  // campos visuais opcionais (cards "Próximos")
  day?: string
  month?: string
}

const initialEvents: FieldEvent[] = [
  {
    id: 'featured',
    title: 'Cafeicultura de Precisão a Campo',
    local: 'Fazenda Modelo, Patrocínio/MG',
    date: '12 jul 2026',
    time: '08h–16h',
    vagasTotal: 50,
    vagasPreenchidas: 32,
    inscrito: false,
  },
  {
    id: 'up-1',
    day: '26', month: 'JUL',
    title: 'Manejo de Solo e Calagem',
    local: 'Araxá/MG',
    date: '26 jul 2026',
    time: '08h–15h',
    vagasTotal: 30,
    vagasPreenchidas: 16,
    inscrito: false,
  },
  {
    id: 'up-2',
    day: '09', month: 'AGO',
    title: 'Colheita e Pós-colheita do Café',
    local: 'Patrocínio/MG',
    date: '09 ago 2026',
    time: '07h–16h',
    vagasTotal: 40,
    vagasPreenchidas: 18,
    inscrito: false,
  },
  {
    id: 'up-3',
    day: '23', month: 'AGO',
    title: 'Irrigação e Fertirrigação',
    local: 'Uberaba/MG',
    date: '23 ago 2026',
    time: '08h–17h',
    vagasTotal: 25,
    vagasPreenchidas: 16,
    inscrito: false,
  },
]

const past = [
  { title: 'Pragas do Cafezal', when: 'mai/26' },
  { title: 'Gestão da Fazenda', when: 'abr/26' },
  { title: 'Nutrição de Plantas', when: 'mar/26' },
]

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}

export default function DiasDeCampoPage() {
  const [events, setEvents] = useState<FieldEvent[]>(initialEvents)
  const [signupTarget, setSignupTarget] = useState<FieldEvent | null>(null)
  const [cancelTarget, setCancelTarget] = useState<FieldEvent | null>(null)

  const featured = events.find((e) => e.id === 'featured')!
  const upcoming = events.filter((e) => e.id !== 'featured')

  function vagasRestantes(e: FieldEvent) {
    return Math.max(0, e.vagasTotal - e.vagasPreenchidas)
  }

  function confirmSignup() {
    if (!signupTarget) return
    const target = signupTarget
    setEvents((cur) =>
      cur.map((e) =>
        e.id === target.id
          ? { ...e, vagasPreenchidas: e.vagasPreenchidas + 1, inscrito: true }
          : e,
      ),
    )
    setSignupTarget(null)
    toast.success('Inscrição confirmada!', {
      description: `${target.title} — ${target.date}. Enviamos os detalhes por e-mail.`,
    })
  }

  function confirmCancel() {
    if (!cancelTarget) return
    const target = cancelTarget
    setEvents((cur) =>
      cur.map((e) =>
        e.id === target.id
          ? { ...e, vagasPreenchidas: Math.max(0, e.vagasPreenchidas - 1), inscrito: false }
          : e,
      ),
    )
    setCancelTarget(null)
    toast.success('Inscrição cancelada')
  }

  function handleEventAction(e: FieldEvent) {
    if (e.inscrito) {
      setCancelTarget(e)
    } else {
      setSignupTarget(e)
    }
  }

  function handleGallery(title: string) {
    toast.info('Abrindo galeria...', { description: title })
  }

  const featuredPct = Math.round((featured.vagasPreenchidas / featured.vagasTotal) * 100)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes barGrow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .bar-fill { transform-origin: left; animation: barGrow 1s cubic-bezier(.16,1,.3,1) forwards; }
        @keyframes blobFloat { 0%,100% { transform: translate(20%,-30%) scale(1) } 50% { transform: translate(24%,-26%) scale(1.08) } }
        .blob-float { animation: blobFloat 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim, .bar-fill, .blob-float { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim" style={{ animationDelay: '0.02s' }}>
        <span
          className="text-xs font-bold tracking-widest"
          style={{ color: 'oklch(0.62 0.14 75)' }}
        >
          EVENTOS EXCLUSIVOS GOLD
        </span>
        <h1
          className="text-2xl md:text-3xl font-bold mt-1.5"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Dias de{' '}
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, color: 'oklch(0.62 0.14 75)' }}>
            Campo
          </span>
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
          Encontros presenciais com agrônomos, demonstrações e networking no campo.
        </p>
      </header>

      {/* ── Featured event hero ── */}
      <section
        className="dash-anim relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.24 0.09 144) 100%)', animationDelay: '0.08s' }}
      >
        <div
          className="blob-float absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.78 0.17 75 / 0.2) 0%, transparent 70%)', transform: 'translate(20%,-30%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 10%, oklch(0.78 0.17 75 / 0.12), transparent 55%)' }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sun size={15} style={{ color: 'oklch(0.78 0.14 75)' }} />
              <span className="text-[11px] font-bold tracking-widest" style={{ color: 'oklch(0.78 0.14 75)' }}>
                PRÓXIMO EVENTO
              </span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              {featured.title}
            </h2>

            <div className="flex flex-wrap gap-x-6 gap-y-2.5 mt-4">
              <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'oklch(1 0 0 / 0.72)' }}>
                <MapPin size={15} style={{ color: 'oklch(0.78 0.14 75)' }} /> {featured.local}
              </span>
              <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'oklch(1 0 0 / 0.72)' }}>
                <Calendar size={15} style={{ color: 'oklch(0.78 0.14 75)' }} /> {featured.date} · {featured.time}
              </span>
              <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'oklch(1 0 0 / 0.72)' }}>
                <Users size={15} style={{ color: 'oklch(0.78 0.14 75)' }} /> Agrônomos: Helena Prado e Marcos Lima
              </span>
            </div>

            {/* progress */}
            <div className="mt-5 max-w-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'oklch(1 0 0 / 0.7)' }}>
                  {featured.vagasPreenchidas} de {featured.vagasTotal} vagas preenchidas
                </span>
                <span className="text-xs font-bold" style={{ color: 'oklch(0.78 0.14 75)' }}>{featuredPct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 0.12)' }}>
                <div
                  className="bar-fill h-full rounded-full"
                  style={{ width: `${featuredPct}%`, background: 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.17 75))', transition: 'width .5s cubic-bezier(.16,1,.3,1)' }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            {featured.inscrito ? (
              <button
                onClick={() => handleEventAction(featured)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: 'oklch(0.48 0.13 144 / 0.25)', color: 'oklch(0.86 0.1 144)', border: '1px solid oklch(0.48 0.13 144 / 0.4)' }}
              >
                <CheckCircle2 size={16} /> Inscrito
              </button>
            ) : (
              <button
                onClick={() => handleEventAction(featured)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: 'linear-gradient(130deg, oklch(0.55 0.14 75), oklch(0.62 0.12 55))', boxShadow: '0 10px 28px oklch(0.62 0.12 55 / 0.4)' }}
              >
                <Ticket size={16} /> Garantir minha vaga
              </button>
            )}
            <span className="text-xs font-medium" style={{ color: 'oklch(1 0 0 / 0.55)' }}>
              {vagasRestantes(featured)} vagas restantes
            </span>
          </div>
        </div>
      </section>

      {/* ── Próximos Dias de Campo ── */}
      <section className="space-y-4">
        <h2
          className="text-lg font-bold flex items-center gap-2 dash-anim"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', animationDelay: '0.16s' }}
        >
          <Calendar size={18} style={{ color: 'oklch(0.62 0.14 75)' }} /> Próximos Dias de Campo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcoming.map((e, i) => (
            <div
              key={e.id}
              className="dash-anim dash-lift rounded-2xl bg-white overflow-hidden flex flex-col"
              style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.2 + i * 0.06}s` }}
            >
              {/* gradient top strip */}
              <div
                className="h-1.5"
                style={{ background: 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.17 75))' }}
              />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start gap-4">
                  {/* date block */}
                  <div
                    className="shrink-0 w-14 rounded-xl flex flex-col items-center justify-center py-2"
                    style={{ background: 'oklch(0.78 0.17 75 / 0.16)' }}
                  >
                    <span className="text-xl font-bold leading-none" style={{ color: 'oklch(0.55 0.14 75)', fontFamily: 'var(--font-heading)' }}>
                      {e.day}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider mt-1" style={{ color: 'oklch(0.62 0.14 75)' }}>
                      {e.month}
                    </span>
                  </div>
                  <h3 className="font-bold text-[15px] leading-snug pt-0.5" style={{ color: 'var(--color-frutificar-deep)' }}>
                    {e.title}
                  </h3>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs inline-flex items-center gap-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    <MapPin size={13} style={{ color: 'var(--color-frutificar-green)' }} /> {e.local}
                  </p>
                  <p className="text-xs inline-flex items-center gap-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    <Clock size={13} style={{ color: 'var(--color-frutificar-green)' }} /> {e.time}
                  </p>
                  <p className="text-xs inline-flex items-center gap-2 font-medium" style={{ color: 'oklch(0.55 0.14 75)' }}>
                    <Ticket size={13} style={{ color: 'oklch(0.62 0.14 75)' }} /> {vagasRestantes(e)} vagas restantes
                  </p>
                </div>

                {e.inscrito ? (
                  <button
                    onClick={() => handleEventAction(e)}
                    className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.12)', color: 'var(--color-frutificar-green)' }}
                  >
                    <CheckCircle2 size={15} /> Inscrito
                  </button>
                ) : (
                  <button
                    onClick={() => handleEventAction(e)}
                    className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                  >
                    Inscrever-se <ArrowUpRight size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Edições anteriores ── */}
      <section className="space-y-4">
        <h2
          className="text-lg font-bold flex items-center gap-2 dash-anim"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', animationDelay: '0.38s' }}
        >
          <Camera size={18} style={{ color: 'var(--color-earth)' }} /> Edições anteriores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {past.map((p, i) => (
            <div
              key={p.title}
              className="dash-anim dash-lift rounded-2xl bg-white overflow-hidden"
              style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.42 + i * 0.06}s` }}
            >
              {/* photo placeholder */}
              <div
                className="relative h-32 flex items-center justify-center"
                style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.24 0.09 144))' }}
              >
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 30%, oklch(0.78 0.17 75 / 0.14), transparent 60%)' }} />
                <Camera size={26} style={{ color: 'oklch(1 0 0 / 0.35)' }} />
                <span
                  className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.9)', color: 'white' }}
                >
                  <CheckCircle2 size={11} /> Concluído
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{p.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs inline-flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    <Calendar size={12} /> {p.when}
                  </span>
                  <button
                    onClick={() => handleGallery(p.title)}
                    className="text-xs font-semibold inline-flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-earth)' }}
                  >
                    <Camera size={13} /> Ver galeria
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Inscrição — confirmação */}
      <Dialog open={signupTarget !== null} onOpenChange={(o) => !o && setSignupTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Ticket size={18} style={{ color: 'oklch(0.62 0.14 75)' }} /> Inscrição — {signupTarget?.title}
            </DialogTitle>
            <DialogDescription>
              Confirme sua presença neste Dia de Campo. As vagas são limitadas.
            </DialogDescription>
          </DialogHeader>

          {signupTarget && (
            <div className="space-y-2.5 rounded-xl p-4" style={inputStyle}>
              <p className="text-sm inline-flex items-center gap-2 w-full" style={{ color: 'oklch(0.42 0.04 144)' }}>
                <MapPin size={15} style={{ color: 'var(--color-frutificar-green)', flexShrink: 0 }} /> {signupTarget.local}
              </p>
              <p className="text-sm inline-flex items-center gap-2 w-full" style={{ color: 'oklch(0.42 0.04 144)' }}>
                <Calendar size={15} style={{ color: 'var(--color-frutificar-green)', flexShrink: 0 }} /> {signupTarget.date}
              </p>
              <p className="text-sm inline-flex items-center gap-2 w-full" style={{ color: 'oklch(0.42 0.04 144)' }}>
                <Clock size={15} style={{ color: 'var(--color-frutificar-green)', flexShrink: 0 }} /> {signupTarget.time}
              </p>
              <p className="text-sm inline-flex items-center gap-2 w-full font-medium" style={{ color: 'oklch(0.55 0.14 75)' }}>
                <Users size={15} style={{ color: 'oklch(0.62 0.14 75)', flexShrink: 0 }} /> {vagasRestantes(signupTarget)} vagas restantes
              </p>
            </div>
          )}

          <p className="text-xs flex items-start gap-2" style={{ color: 'oklch(0.5 0.04 144)' }}>
            <Sun size={14} style={{ color: 'oklch(0.62 0.14 75)', flexShrink: 0, marginTop: '1px' }} />
            Benefício Gold gratuito — sua inscrição não tem custo adicional.
          </p>

          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button type="button" onClick={() => setSignupTarget(null)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
              style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
              Voltar
            </button>
            <button type="button" onClick={confirmSignup}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 inline-flex items-center gap-2"
              style={{ background: 'linear-gradient(130deg, oklch(0.55 0.14 75), oklch(0.62 0.12 55))', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
              <CheckCircle2 size={15} /> Confirmar inscrição
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancelar inscrição — confirmação */}
      <Dialog open={cancelTarget !== null} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <ShieldAlert size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Cancelar inscrição?</DialogTitle>
            <DialogDescription>
              {cancelTarget && (
                <>Sua vaga em <strong>{cancelTarget.title}</strong> ({cancelTarget.date}) será liberada para outro produtor.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setCancelTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Manter inscrição
            </button>
            <button onClick={confirmCancel}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)]"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}>
              Confirmar cancelamento
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
