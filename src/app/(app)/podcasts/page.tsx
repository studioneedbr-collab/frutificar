'use client'

import { useState } from 'react'
import {
  Headphones, Mic2, Play, SkipBack, SkipForward, Radio,
} from 'lucide-react'

/* DEV PREVIEW — sem banco. Dados mock dos podcasts (plano Essencial). */

const categories = ['Todos', 'Cafeicultura', 'Solo & Adubação', 'Gestão', 'Mercado'] as const
type Category = typeof categories[number]

const featured = {
  title: 'Café de qualidade: da colheita ao copo',
  host: 'com Agr. Marcos Lima',
  progress: 35,
  elapsed: '11:20',
  total: '32:05',
}

type Episode = {
  title: string
  host: string
  meta: string
  category: Exclude<Category, 'Todos'>
  cover: string
}

const episodes: Episode[] = [
  {
    title: 'Café de qualidade: da colheita ao copo',
    host: 'com Agr. Marcos Lima',
    meta: 'há 3 dias · 28 min',
    category: 'Cafeicultura',
    cover: 'linear-gradient(150deg, oklch(0.48 0.13 144), oklch(0.62 0.12 55))',
  },
  {
    title: 'Análise de solo: lendo o laudo sem medo',
    host: 'com Agr. Helena Prado',
    meta: 'há 6 dias · 35 min',
    category: 'Solo & Adubação',
    cover: 'linear-gradient(150deg, oklch(0.55 0.1 220), oklch(0.48 0.13 144))',
  },
  {
    title: 'Irrigação por gotejamento na seca de MG',
    host: 'com Eng. Agr. Túlio Resende',
    meta: 'há 1 semana · 24 min',
    category: 'Cafeicultura',
    cover: 'linear-gradient(150deg, oklch(0.55 0.12 200), oklch(0.62 0.12 55))',
  },
  {
    title: 'Preço da saca: como travar a venda do café',
    host: 'com Econ. Rafael Mourão',
    meta: 'há 2 semanas · 30 min',
    category: 'Mercado',
    cover: 'linear-gradient(150deg, oklch(0.62 0.14 75), oklch(0.62 0.12 55))',
  },
  {
    title: 'Broca e ferrugem: manejo de pragas na entressafra',
    host: 'com Agr. Helena Prado',
    meta: 'há 3 semanas · 27 min',
    category: 'Cafeicultura',
    cover: 'linear-gradient(150deg, oklch(0.48 0.13 144), oklch(0.55 0.12 290))',
  },
  {
    title: 'Sucessão familiar: passando a fazenda adiante',
    host: 'com Cons. Beatriz Andrade',
    meta: 'há 1 mês · 41 min',
    category: 'Gestão',
    cover: 'linear-gradient(150deg, oklch(0.55 0.12 290), oklch(0.48 0.13 144))',
  },
  {
    title: 'Financiamento rural: Pronaf e crédito de custeio',
    host: 'com Econ. Rafael Mourão',
    meta: 'há 1 mês · 33 min',
    category: 'Gestão',
    cover: 'linear-gradient(150deg, oklch(0.62 0.12 55), oklch(0.62 0.14 75))',
  },
]

export default function PodcastsPage() {
  const [active, setActive] = useState<Category>('Todos')
  const filtered = active === 'Todos' ? episodes : episodes.filter((e) => e.category === active)

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
      <section
        className="dash-anim relative overflow-hidden rounded-2xl p-5 md:p-6"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.22 0.09 148))', animationDelay: '0.08s' }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.78 0.17 75 / 0.14) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-5">
          {/* Cover */}
          <div
            className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center shrink-0 mx-auto md:mx-0"
            style={{ background: 'linear-gradient(150deg, oklch(0.48 0.13 144), oklch(0.62 0.12 55))', boxShadow: '0 12px 32px oklch(0.16 0.07 152 / 0.45)' }}
          >
            <Headphones size={40} style={{ color: 'oklch(1 0 0 / 0.92)' }} />
          </div>

          {/* Info + progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: 'oklch(0.78 0.17 75)', opacity: 0.5 }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'oklch(0.78 0.17 75)' }} />
              </span>
              <span className="text-[11px] font-bold tracking-wide" style={{ color: 'oklch(0.78 0.14 75)' }}>
                TOCANDO AGORA
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

            {/* Progress bar */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[11px] font-medium tabular-nums shrink-0" style={{ color: 'oklch(1 0 0 / 0.6)' }}>
                {featured.elapsed}
              </span>
              <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: 'oklch(1 0 0 / 0.14)' }}>
                <div
                  className="bar-fill h-full rounded-full"
                  style={{ width: `${featured.progress}%`, background: 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.17 75))' }}
                />
              </div>
              <span className="text-[11px] font-medium tabular-nums shrink-0" style={{ color: 'oklch(1 0 0 / 0.4)' }}>
                {featured.total}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2.5 shrink-0">
            <button
              aria-label="Voltar"
              className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: '1px solid oklch(1 0 0 / 0.16)', color: 'oklch(1 0 0 / 0.85)' }}
            >
              <SkipBack size={18} />
            </button>
            <button
              aria-label="Reproduzir"
              className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
              style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
            >
              <Play size={22} fill="currentColor" />
            </button>
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

      {/* ── Categorias / séries chips ── */}
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

      {/* ── Episódios ── */}
      <section className="dash-anim rounded-2xl p-5 md:p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.2s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Radio size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Episódios
        </h2>

        <div className="space-y-2.5">
          {filtered.map((ep) => (
            <div
              key={ep.title}
              className="dash-lift flex items-center gap-4 rounded-xl p-3 md:p-4 cursor-pointer"
              style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
            >
              {/* Cover thumb */}
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: ep.cover }}
              >
                <Headphones size={20} style={{ color: 'oklch(1 0 0 / 0.9)' }} />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{ep.title}</h3>
                <p className="text-xs mt-0.5 truncate flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                  <Mic2 size={11} className="shrink-0" /> {ep.host}
                </p>
                <p className="text-[11px] mt-1" style={{ color: 'oklch(0.62 0.03 144)' }}>{ep.meta}</p>
              </div>

              {/* Play button */}
              <button
                aria-label={`Reproduzir ${ep.title}`}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95"
                style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
              >
                <Play size={16} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
