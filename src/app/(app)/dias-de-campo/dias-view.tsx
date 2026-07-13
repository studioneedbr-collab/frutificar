'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Sun, MapPin, Calendar, Users, Clock, ArrowUpRight,
  CheckCircle2, Camera, Ticket,
} from 'lucide-react'
import type { FieldDaysData, FieldEvent } from './data'

export function DiasView({ data }: { data: FieldDaysData }) {
  const { featured, upcoming, past } = data
  // "Interesse" é informativo (não há inscrição no banco) — apenas feedback local.
  const [interested, setInterested] = useState<Record<string, boolean>>({})

  function toggleInterest(e: FieldEvent) {
    setInterested((cur) => {
      const next = { ...cur, [e.id]: !cur[e.id] }
      if (next[e.id]) {
        toast.success('Interesse registrado!', { description: `${e.title} — ${e.date}. A equipe entrará em contato com os detalhes.` })
      } else {
        toast.info('Interesse removido')
      }
      return next
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes blobFloat { 0%,100% { transform: translate(20%,-30%) scale(1) } 50% { transform: translate(24%,-26%) scale(1.08) } }
        .blob-float { animation: blobFloat 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim, .blob-float { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim" style={{ animationDelay: '0.02s' }}>
        <span className="text-xs font-bold tracking-widest" style={{ color: 'oklch(0.62 0.14 75)' }}>
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
      {featured && (
        <section
          className="dash-anim relative overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.24 0.09 144) 100%)', animationDelay: '0.08s' }}
        >
          <div
            className="blob-float absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, oklch(0.78 0.17 75 / 0.2) 0%, transparent 70%)', transform: 'translate(20%,-30%)' }}
          />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sun size={15} style={{ color: 'oklch(0.78 0.14 75)' }} />
                <span className="text-[11px] font-bold tracking-widest" style={{ color: 'oklch(0.78 0.14 75)' }}>
                  PRÓXIMO EVENTO
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                {featured.title}
              </h2>

              <div className="flex flex-wrap gap-x-6 gap-y-2.5 mt-4">
                <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'oklch(1 0 0 / 0.72)' }}>
                  <MapPin size={15} style={{ color: 'oklch(0.78 0.14 75)' }} /> {featured.local}
                </span>
                <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'oklch(1 0 0 / 0.72)' }}>
                  <Calendar size={15} style={{ color: 'oklch(0.78 0.14 75)' }} /> {featured.date} · {featured.time}
                </span>
                {featured.instructor && (
                  <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'oklch(1 0 0 / 0.72)' }}>
                    <Users size={15} style={{ color: 'oklch(0.78 0.14 75)' }} /> {featured.instructor}
                  </span>
                )}
              </div>

              {featured.desc && (
                <p className="mt-4 text-sm max-w-xl leading-relaxed" style={{ color: 'oklch(1 0 0 / 0.6)' }}>
                  {featured.desc}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
              <button
                onClick={() => toggleInterest(featured)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={interested[featured.id]
                  ? { background: 'oklch(0.48 0.13 144 / 0.25)', color: 'oklch(0.86 0.1 144)', border: '1px solid oklch(0.48 0.13 144 / 0.4)' }
                  : { background: 'linear-gradient(130deg, oklch(0.55 0.14 75), oklch(0.62 0.12 55))', color: 'white', boxShadow: '0 10px 28px oklch(0.62 0.12 55 / 0.4)' }}
              >
                {interested[featured.id] ? <><CheckCircle2 size={16} /> Tenho interesse</> : <><Ticket size={16} /> Tenho interesse</>}
              </button>
              <span className="text-xs font-medium" style={{ color: 'oklch(1 0 0 / 0.55)' }}>
                Benefício Gold — sem custo adicional
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Próximos Dias de Campo ── */}
      {upcoming.length > 0 && (
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
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.17 75))' }} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-14 rounded-xl flex flex-col items-center justify-center py-2" style={{ background: 'oklch(0.78 0.17 75 / 0.16)' }}>
                      <span className="text-xl font-bold leading-none" style={{ color: 'oklch(0.55 0.14 75)', fontFamily: 'var(--font-heading)' }}>{e.day}</span>
                      <span className="text-[10px] font-bold tracking-wider mt-1" style={{ color: 'oklch(0.62 0.14 75)' }}>{e.month}</span>
                    </div>
                    <h3 className="font-bold text-[15px] leading-snug pt-0.5" style={{ color: 'var(--color-frutificar-deep)' }}>{e.title}</h3>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs inline-flex items-center gap-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
                      <MapPin size={13} style={{ color: 'var(--color-frutificar-green)' }} /> {e.local}
                    </p>
                    <p className="text-xs inline-flex items-center gap-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
                      <Clock size={13} style={{ color: 'var(--color-frutificar-green)' }} /> {e.time}
                    </p>
                    {e.instructor && (
                      <p className="text-xs inline-flex items-center gap-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
                        <Users size={13} style={{ color: 'var(--color-frutificar-green)' }} /> {e.instructor}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleInterest(e)}
                    className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
                    style={interested[e.id]
                      ? { background: 'oklch(0.48 0.13 144 / 0.12)', color: 'var(--color-frutificar-green)' }
                      : { background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                  >
                    {interested[e.id] ? <><CheckCircle2 size={15} /> Tenho interesse</> : <>Tenho interesse <ArrowUpRight size={15} /></>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Edições anteriores ── */}
      {past.length > 0 && (
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
                key={p.title + i}
                className="dash-anim dash-lift rounded-2xl bg-white overflow-hidden"
                style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.42 + i * 0.06}s` }}
              >
                <div className="relative h-32 flex items-center justify-center" style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.24 0.09 144))' }}>
                  <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 30%, oklch(0.78 0.17 75 / 0.14), transparent 60%)' }} />
                  <Camera size={26} style={{ color: 'oklch(1 0 0 / 0.35)' }} />
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'oklch(0.48 0.13 144 / 0.9)', color: 'white' }}>
                    <CheckCircle2 size={11} /> Concluído
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{p.title}</h3>
                  <span className="text-xs inline-flex items-center gap-1.5 mt-2" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    <Calendar size={12} /> {p.when}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!featured && upcoming.length === 0 && past.length === 0 && (
        <div className="text-center py-12 text-sm rounded-2xl bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
          Nenhum Dia de Campo agendado no momento. Fique de olho — novos eventos em breve!
        </div>
      )}
    </div>
  )
}
