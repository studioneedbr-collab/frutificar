'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, PlayCircle, Search, CheckCircle2, BookOpen } from 'lucide-react'
import type { MiniCourse } from './data'

export function MinicursosView({ minicursos }: { minicursos: MiniCourse[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return minicursos
    return minicursos.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
    )
  }, [minicursos, query])

  const concluidos = minicursos.filter((m) => m.progress >= 100).length

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes barGrow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .bar-fill { transform-origin: left; animation: barGrow 1s cubic-bezier(.16,1,.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) { .dash-anim, .bar-fill { animation: none !important; opacity: 1 !important; transform: none !important; } }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim">
        <p className="text-[11px] font-bold tracking-wide mb-1.5" style={{ color: 'var(--color-earth)', letterSpacing: '0.08em' }}>
          APRENDIZADO RÁPIDO
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Minicursos
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
          Cursos curtos e diretos ao ponto sobre temas específicos da lavoura de café.
          {minicursos.length > 0 && ` ${minicursos.length} disponíveis · ${concluidos} concluídos.`}
        </p>
      </header>

      {/* ── Busca ── */}
      <div className="dash-anim relative" style={{ animationDelay: '0.06s' }}>
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.6 0.03 144)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar minicurso…"
          className="w-full rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
          style={{ border: '1px solid oklch(0.91 0.01 144)', background: 'white' }}
        />
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="dash-anim rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <GraduationCap size={22} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>
            {query ? 'Nada encontrado para sua busca' : 'Nenhum minicurso disponível ainda'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.58 0.03 144)' }}>
            {query ? 'Tente outro termo.' : 'Novos minicursos aparecem aqui assim que forem publicados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, i) => {
            const done = m.progress >= 100
            const started = m.progress > 0 && !done
            return (
              <Link
                key={m.id}
                href={`/cursos/${m.slug}`}
                className="dash-anim dash-lift rounded-2xl bg-white p-5 flex flex-col group"
                style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.08 + i * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                    <GraduationCap size={20} style={{ color: 'var(--color-frutificar-green)' }} />
                  </div>
                  {done && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}>
                      <CheckCircle2 size={11} /> Concluído
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-[15px] leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>{m.title}</h3>
                <p className="text-xs mt-1.5 flex-1" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.6 }}>{m.description}</p>

                <div className="flex items-center gap-1.5 mt-3.5 text-[11px] font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>
                  <BookOpen size={13} /> {m.lessons} {m.lessons === 1 ? 'aula' : 'aulas'}
                </div>

                {/* progresso */}
                {m.progress > 0 && (
                  <div className="mt-2.5">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.94 0.01 144)' }}>
                      <div className="bar-fill h-full rounded-full" style={{ width: `${m.progress}%`, background: 'var(--color-frutificar-green)' }} />
                    </div>
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: 'oklch(0.58 0.03 144)' }}>{m.progress}% concluído</p>
                  </div>
                )}

                <span
                  className="mt-4 inline-flex items-center justify-center gap-2 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-opacity group-hover:opacity-85"
                  style={{ background: 'var(--color-frutificar-green)', color: 'white' }}
                >
                  <PlayCircle size={15} /> {done ? 'Rever' : started ? 'Continuar' : 'Começar'}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
