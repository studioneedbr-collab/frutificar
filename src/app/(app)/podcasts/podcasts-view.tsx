'use client'

import { useMemo, useState } from 'react'
import {
  Headphones, Mic2, Play, SkipBack, SkipForward, Radio,
} from 'lucide-react'
import type { Episode } from './data'

export function PodcastsView({ initialEpisodes }: { initialEpisodes: Episode[] }) {
  // Categorias derivadas dos episódios reais (evita filtro vazio quando o banco
  // não traz categoria). Sempre inclui "Todos".
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const e of initialEpisodes) if (e.category && e.category !== 'Todos') set.add(e.category)
    return ['Todos', ...Array.from(set)]
  }, [initialEpisodes])

  const [active, setActive] = useState<string>('Todos')
  const filtered = active === 'Todos' ? initialEpisodes : initialEpisodes.filter((e) => e.category === active)

  const featured = initialEpisodes[0] ?? null

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes barGrow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .bar-fill { transform-origin: left; animation: barGrow 1s cubic-bezier(.16,1,.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim, .bar-fill { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="dash-anim" style={{ animationDelay: '0.02s' }}>
        <span className="text-xs font-bold tracking-widest block" style={{ color: 'var(--color-earth)' }}>
          PODCASTS
        </span>
        <h1
          className="text-2xl md:text-3xl font-bold mt-1"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Podcasts
        </h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>
          Ouça na roça, no caminhão ou em casa.
        </p>
      </div>

      {/* ── TOCANDO AGORA — featured player ── */}
      {featured && (
        <section
          className="dash-anim relative overflow-hidden rounded-2xl p-5 md:p-6"
          style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.22 0.09 148))', animationDelay: '0.08s' }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, oklch(0.78 0.17 75 / 0.14) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center shrink-0 mx-auto md:mx-0"
              style={{ background: featured.cover, boxShadow: '0 12px 32px oklch(0.16 0.07 152 / 0.45)' }}
            >
              <Headphones size={40} style={{ color: 'oklch(1 0 0 / 0.92)' }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: 'oklch(0.78 0.17 75)', opacity: 0.5 }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'oklch(0.78 0.17 75)' }} />
                </span>
                <span className="text-[11px] font-bold tracking-wide" style={{ color: 'oklch(0.78 0.14 75)' }}>
                  EM DESTAQUE
                </span>
              </div>
              <h2
                className="text-lg md:text-xl font-bold text-white truncate"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                {featured.title}
              </h2>
              <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'oklch(1 0 0 / 0.55)' }}>
                <Mic2 size={12} /> {featured.host}
              </p>
              <p className="text-[11px] mt-2" style={{ color: 'oklch(1 0 0 / 0.4)' }}>{featured.meta}</p>
            </div>

            <div className="flex items-center justify-center gap-2.5 shrink-0">
              <button
                aria-label="Voltar"
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: '1px solid oklch(1 0 0 / 0.16)', color: 'oklch(1 0 0 / 0.85)' }}
              >
                <SkipBack size={18} />
              </button>
              {featured.url ? (
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Reproduzir"
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
                >
                  <Play size={22} fill="currentColor" />
                </a>
              ) : (
                <button
                  aria-label="Reproduzir"
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
                  style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
                >
                  <Play size={22} fill="currentColor" />
                </button>
              )}
              <button
                aria-label="Avançar"
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: '1px solid oklch(1 0 0 / 0.16)', color: 'oklch(1 0 0 / 0.85)' }}
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Categorias / séries chips ── */}
      {categories.length > 1 && (
        <div className="dash-anim flex flex-wrap gap-2" style={{ animationDelay: '0.14s' }}>
          {categories.map((cat) => {
            const isActive = active === cat
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={isActive
                  ? { background: 'var(--color-earth)', color: 'white', boxShadow: '0 6px 18px oklch(0.62 0.12 55 / 0.35)' }
                  : { background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Episódios ── */}
      <section className="dash-anim rounded-2xl p-5 md:p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.2s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Radio size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Episódios
        </h2>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
            Nenhum episódio disponível ainda.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((ep) => (
              <div
                key={ep.id}
                className="dash-lift flex items-center gap-4 rounded-xl p-3 md:p-4"
                style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
              >
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: ep.cover }}
                >
                  <Headphones size={20} style={{ color: 'oklch(1 0 0 / 0.9)' }} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{ep.title}</h3>
                  <p className="text-xs mt-0.5 truncate flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    <Mic2 size={11} className="shrink-0" /> {ep.host}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: 'oklch(0.62 0.03 144)' }}>{ep.meta}</p>
                </div>

                {ep.url ? (
                  <a
                    href={ep.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Reproduzir ${ep.title}`}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
                  >
                    <Play size={16} fill="currentColor" />
                  </a>
                ) : (
                  <button
                    aria-label={`Reproduzir ${ep.title}`}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
                  >
                    <Play size={16} fill="currentColor" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
