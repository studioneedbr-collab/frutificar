'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen, PlayCircle, Play, ChevronDown, CheckCircle2, Lock, Clock,
  GraduationCap, Sprout, Bug, Coffee, Award, type LucideIcon,
} from 'lucide-react'
import type { CoursesData, ModuleRow } from './data'

const MINI_ICONS: LucideIcon[] = [Sprout, Bug, Coffee, Award]

type Filter = 'todos' | 'andamento' | 'concluidos'
const filters: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'concluidos', label: 'Concluídos' },
]

function moduleState(m: ModuleRow): 'done' | 'progress' | 'locked' {
  if (m.progress >= 100) return 'done'
  if (m.progress > 0) return 'progress'
  return 'locked'
}

export function CursosView({ data }: { data: CoursesData }) {
  const { main, modules, minis } = data
  const firstOpen = modules.find((m) => moduleState(m) === 'progress')?.n ?? modules[0]?.n ?? null
  const [open, setOpen] = useState<number | null>(firstOpen)
  const [filter, setFilter] = useState<Filter>('todos')

  const visible = modules.filter((m) => {
    const s = moduleState(m)
    if (filter === 'andamento') return s === 'progress'
    if (filter === 'concluidos') return s === 'done'
    return true
  })

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

      {/* ── Header ── */}
      <header className="dash-anim">
        <p className="text-xs font-bold tracking-wide" style={{ color: 'var(--color-earth)', letterSpacing: '0.08em' }}>
          MEUS CURSOS
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold mt-1"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Cursos
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
          Sua trilha completa de cafeicultura — <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-earth)' }}>do plantio à xícara</span>.
        </p>
      </header>

      {/* ── Featured main course ── */}
      {main && (
        <section
          className="dash-anim rounded-2xl overflow-hidden bg-white"
          style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.06s' }}
        >
          <div
            className="relative overflow-hidden p-6 md:p-7"
            style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.22 0.09 148) 100%)' }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, oklch(0.62 0.12 55 / 0.18) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
            />
            <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
              <div className="min-w-0">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-3"
                  style={{ background: 'oklch(1 0 0 / 0.08)', border: '1px solid oklch(1 0 0 / 0.14)', color: 'oklch(0.83 0.08 144)', letterSpacing: '0.06em' }}
                >
                  <GraduationCap size={12} /> CURSO PRINCIPAL
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                  {main.title}
                </h2>
                <p className="mt-1.5 text-sm" style={{ color: 'oklch(1 0 0 / 0.6)' }}>
                  {main.instrutor ? <>com <strong style={{ color: 'oklch(0.83 0.08 144)' }}>{main.instrutor}</strong> · </> : ''}
                  {main.modulesCount} módulos · {main.lessonsCount} aulas
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>{main.overall}%</div>
                <div className="text-[11px] font-medium" style={{ color: 'oklch(1 0 0 / 0.55)' }}>concluído</div>
              </div>
            </div>
            <div className="relative mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 0.14)' }}>
              <div
                className="bar-fill h-full rounded-full"
                style={{ width: `${main.overall}%`, background: 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.14 75))' }}
              />
            </div>
          </div>

          {main.continueHref && (
            <div className="p-6 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
                Continue sua trilha de onde parou.
              </p>
              <Link
                href={main.continueHref}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98] shrink-0"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
              >
                <PlayCircle size={16} /> {main.continueLabel}
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── Filter chips + modules ── */}
      {modules.length > 0 && (
        <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.12s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <BookOpen size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Conteúdo do curso
            </h2>
            <div className="flex items-center gap-2">
              {filters.map((f) => {
                const active = filter === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
                    style={active
                      ? { background: 'var(--color-frutificar-green)', color: 'white' }
                      : { background: 'oklch(0.98 0.008 144)', color: 'oklch(0.42 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Nenhum módulo nesse filtro.
            </p>
          ) : (
            <div className="space-y-3">
              {visible.map((m) => {
                const state = moduleState(m)
                const isOpen = open === m.n
                return (
                  <div
                    key={m.n}
                    className="rounded-xl overflow-hidden"
                    style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
                  >
                    <button
                      onClick={() => setOpen(isOpen ? null : m.n)}
                      className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                        style={state === 'done'
                          ? { background: 'oklch(0.48 0.13 144 / 0.12)', color: 'var(--color-frutificar-green)' }
                          : state === 'progress'
                          ? { background: 'oklch(0.62 0.12 55 / 0.12)', color: 'var(--color-earth)' }
                          : { background: 'oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}
                      >
                        {state === 'done' ? <CheckCircle2 size={18} /> : String(m.n).padStart(2, '0')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{m.title}</h3>
                          {state === 'locked' && m.progress === 0 && <Lock size={13} style={{ color: 'oklch(0.7 0.02 144)' }} />}
                        </div>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                          {m.lessonsCount} aulas{m.duration ? <><span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span><Clock size={11} /> {m.duration}</> : null}
                        </p>
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.91 0.01 144)' }}>
                          <div
                            className="bar-fill h-full rounded-full"
                            style={{ width: `${m.progress}%`, background: m.progress >= 100 ? 'var(--color-frutificar-green)' : 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.14 75))' }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className="text-sm font-bold"
                          style={{ color: state === 'done' ? 'var(--color-frutificar-green)' : state === 'progress' ? 'var(--color-earth)' : 'oklch(0.7 0.02 144)' }}
                        >
                          {state === 'done' ? '✓' : `${m.progress}%`}
                        </span>
                        <ChevronDown
                          size={18}
                          style={{ color: 'oklch(0.55 0.04 144)', transition: 'transform .25s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 space-y-1" style={{ borderTop: '1px solid oklch(0.93 0.01 144)' }}>
                        {m.lessons.map((l) => (
                          <div key={l.id} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={l.done
                                ? { background: 'oklch(0.48 0.13 144 / 0.1)' }
                                : { background: 'oklch(0.62 0.12 55 / 0.1)' }}
                            >
                              {l.done
                                ? <CheckCircle2 size={15} style={{ color: 'var(--color-frutificar-green)' }} />
                                : <Play size={14} style={{ color: 'var(--color-earth)' }} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{l.title}</p>
                              <p className="text-[11px] flex items-center gap-1" style={{ color: 'oklch(0.55 0.04 144)' }}>
                                {l.duration && <><Clock size={10} /> {l.duration}</>}{l.done ? ' · concluída' : ''}
                              </p>
                            </div>
                            <Link
                              href={l.href}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-85"
                              style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                            >
                              Assistir
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Mini cursos ── */}
      {minis.length > 0 && (
        <section className="dash-anim" style={{ animationDelay: '0.18s' }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <Sprout size={18} style={{ color: 'var(--color-earth)' }} /> Mini cursos
            </h2>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'oklch(0.55 0.04 144)' }} className="text-sm">
              rápidos e diretos
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {minis.map((c, i) => {
              const Icon = MINI_ICONS[i % MINI_ICONS.length]
              const started = c.progress > 0
              return (
                <Link
                  key={c.href + i}
                  href={c.href}
                  className="dash-anim dash-lift rounded-2xl p-5 bg-white flex flex-col"
                  style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.2 + i * 0.05}s` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'oklch(0.62 0.12 55 / 0.1)' }}>
                    <Icon size={20} style={{ color: 'var(--color-earth)' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{c.title}</h3>
                  <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    {c.lessons} aulas{c.duration ? <><span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span> {c.duration}</> : null}
                  </p>

                  {started ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>Em andamento</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-earth)' }}>{c.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.91 0.01 144)' }}>
                        <div
                          className="bar-fill h-full rounded-full"
                          style={{ width: `${c.progress}%`, background: 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.14 75))' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                    >
                      <Play size={14} /> Começar
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
