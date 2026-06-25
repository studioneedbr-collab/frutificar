'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  BookOpen, PlayCircle, Play, ChevronDown, CheckCircle2, Lock, Clock,
  GraduationCap, Sprout, Bug, Coffee, Award, type LucideIcon,
} from 'lucide-react'

/* DEV PREVIEW — sem banco. Currículo mock do curso de cafeicultura. */

type Lesson = { title: string; duration: string; done?: boolean }
type Module = {
  n: number
  title: string
  lessonsCount: number
  duration: string
  progress: number
  lessons: Lesson[]
}

const mainCourse = {
  title: 'Cafeicultura Completa: do plantio à xícara',
  instrutor: 'Dr. Felipe Moura',
  overall: 46,
}

const modules: Module[] = [
  {
    n: 1, title: 'Introdução ao café', lessonsCount: 5, duration: '38min', progress: 100,
    lessons: [
      { title: 'História do café no Brasil', duration: '8min', done: true },
      { title: 'O café no Cerrado Mineiro', duration: '7min', done: true },
      { title: 'Panorama do mercado atual', duration: '9min', done: true },
      { title: 'Arábica x Conilon: diferenças', duration: '6min', done: true },
      { title: 'Estrutura do curso e materiais', duration: '8min', done: true },
    ],
  },
  {
    n: 2, title: 'Clima, Solo e Regiões', lessonsCount: 6, duration: '52min', progress: 100,
    lessons: [
      { title: 'Exigências climáticas do cafeeiro', duration: '9min', done: true },
      { title: 'Tipos de solo e aptidão', duration: '10min', done: true },
      { title: 'Leitura de análise de solo', duration: '11min', done: true },
      { title: 'Regiões produtoras de MG', duration: '8min', done: true },
      { title: 'Altitude e qualidade da bebida', duration: '7min', done: true },
      { title: 'Microclima na propriedade', duration: '7min', done: true },
    ],
  },
  {
    n: 3, title: 'Implantação da lavoura', lessonsCount: 7, duration: '1h04', progress: 72,
    lessons: [
      { title: 'Planejamento e marcação de talhões', duration: '10min', done: true },
      { title: 'Escolha de cultivares', duration: '9min', done: true },
      { title: 'Preparo do solo e correção', duration: '11min', done: true },
      { title: 'Espaçamento e densidade', duration: '8min', done: true },
      { title: 'Mudas e plantio na prática', duration: '12min' },
      { title: 'Irrigação na implantação', duration: '7min' },
      { title: 'Custos de implantação por hectare', duration: '7min' },
    ],
  },
  {
    n: 4, title: 'Manejo da cultura', lessonsCount: 6, duration: '58min', progress: 30,
    lessons: [
      { title: 'Calendário de manejo anual', duration: '9min', done: true },
      { title: 'Adubação de produção', duration: '11min', done: true },
      { title: 'Controle de plantas daninhas', duration: '10min' },
      { title: 'Podas e condução da lavoura', duration: '10min' },
      { title: 'Manejo de irrigação', duration: '9min' },
      { title: 'Boas práticas no talhão', duration: '9min' },
    ],
  },
  {
    n: 5, title: 'Pragas e Doenças', lessonsCount: 7, duration: '1h12', progress: 0,
    lessons: [
      { title: 'Bicho-mineiro: identificação e controle', duration: '11min' },
      { title: 'Broca-do-café', duration: '10min' },
      { title: 'Ferrugem do cafeeiro', duration: '12min' },
      { title: 'Cercosporiose e phoma', duration: '9min' },
      { title: 'Monitoramento e MIP', duration: '11min' },
      { title: 'Controle biológico', duration: '9min' },
      { title: 'Receituário e segurança', duration: '10min' },
    ],
  },
  {
    n: 6, title: 'Florada e Desenvolvimento', lessonsCount: 4, duration: '36min', progress: 0,
    lessons: [
      { title: 'Indução e estágios da florada', duration: '9min' },
      { title: 'Pegamento e chumbinho', duration: '8min' },
      { title: 'Enchimento dos grãos', duration: '10min' },
      { title: 'Estresse hídrico e manejo', duration: '9min' },
    ],
  },
  {
    n: 7, title: 'Colheita e Pós-colheita', lessonsCount: 6, duration: '55min', progress: 0,
    lessons: [
      { title: 'Ponto de colheita ideal', duration: '8min' },
      { title: 'Colheita manual x mecanizada', duration: '10min' },
      { title: 'Lavagem e separação', duration: '9min' },
      { title: 'Secagem em terreiro e secador', duration: '11min' },
      { title: 'Benefício e armazenamento', duration: '9min' },
      { title: 'Café natural, cereja e fermentado', duration: '8min' },
    ],
  },
  {
    n: 8, title: 'Comercialização e Qualidade', lessonsCount: 5, duration: '47min', progress: 0,
    lessons: [
      { title: 'Classificação e tipos de café', duration: '9min' },
      { title: 'Análise sensorial e pontuação', duration: '10min' },
      { title: 'Formação de preço e mercado', duration: '10min' },
      { title: 'Cafés especiais e rastreabilidade', duration: '9min' },
      { title: 'Negociação e canais de venda', duration: '9min' },
    ],
  },
]

const miniCourses: { title: string; icon: LucideIcon; lessons: number; duration: string; progress: number }[] = [
  { title: 'Nutrição', icon: Sprout, lessons: 4, duration: '32min', progress: 60 },
  { title: 'Pragas', icon: Bug, lessons: 5, duration: '41min', progress: 0 },
  { title: 'Comercialização', icon: Coffee, lessons: 3, duration: '24min', progress: 0 },
  { title: 'Hones', icon: Award, lessons: 4, duration: '29min', progress: 0 },
]

type Filter = 'todos' | 'andamento' | 'concluidos'
const filters: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'concluidos', label: 'Concluídos' },
]

function moduleState(m: Module): 'done' | 'progress' | 'locked' {
  if (m.progress >= 100) return 'done'
  if (m.progress > 0) return 'progress'
  return 'locked'
}

export default function CursosPage() {
  const [open, setOpen] = useState<number | null>(4)
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
      <section
        className="dash-anim rounded-2xl overflow-hidden bg-white"
        style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.06s' }}
      >
        {/* dark gradient header strip */}
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
                {mainCourse.title}
              </h2>
              <p className="mt-1.5 text-sm" style={{ color: 'oklch(1 0 0 / 0.6)' }}>
                com <strong style={{ color: 'oklch(0.83 0.08 144)' }}>{mainCourse.instrutor}</strong> · 8 módulos · 46 aulas
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>{mainCourse.overall}%</div>
              <div className="text-[11px] font-medium" style={{ color: 'oklch(1 0 0 / 0.55)' }}>concluído</div>
            </div>
          </div>
          {/* overall progress bar */}
          <div className="relative mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(1 0 0 / 0.14)' }}>
            <div
              className="bar-fill h-full rounded-full"
              style={{ width: `${mainCourse.overall}%`, background: 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.14 75))' }}
            />
          </div>
        </div>

        <div className="p-6 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
            Você parou no <strong style={{ color: 'var(--color-frutificar-deep)' }}>Módulo 4 — Manejo da cultura</strong>.
          </p>
          <button
            onClick={() => toast.success('Retomando o curso', { description: 'Módulo 4 — Manejo da cultura' })}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98] shrink-0"
            style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
          >
            <PlayCircle size={16} /> Continuar de onde parei
          </button>
        </div>
      </section>

      {/* ── Filter chips + modules ── */}
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
                  {/* Module header row */}
                  <button
                    onClick={() => setOpen(isOpen ? null : m.n)}
                    className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                  >
                    {/* number badge */}
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
                        {state === 'locked' && <Lock size={13} style={{ color: 'oklch(0.7 0.02 144)' }} />}
                      </div>
                      <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                        {m.lessonsCount} aulas <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span>
                        <Clock size={11} /> {m.duration}
                      </p>
                      {/* progress bar */}
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

                  {/* Lessons list */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-1" style={{ borderTop: '1px solid oklch(0.93 0.01 144)' }}>
                      {m.lessons.map((l) => (
                        <div key={l.title} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white">
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
                              <Clock size={10} /> {l.duration}{l.done ? ' · concluída' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => toast.info('Abrindo aula', { description: l.title })}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-85"
                            style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                          >
                            Assistir
                          </button>
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

      {/* ── Mini cursos ── */}
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
          {miniCourses.map((c, i) => {
            const Icon = c.icon
            const started = c.progress > 0
            return (
              <div
                key={c.title}
                className="dash-anim dash-lift rounded-2xl p-5 bg-white flex flex-col"
                style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.2 + i * 0.05}s` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'oklch(0.62 0.12 55 / 0.1)' }}>
                  <Icon size={20} style={{ color: 'var(--color-earth)' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{c.title}</h3>
                <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                  {c.lessons} aulas <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span> {c.duration}
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
                  <button
                    onClick={() => toast.success('Curso iniciado', { description: c.title })}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                  >
                    <Play size={14} /> Começar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
