'use client'

import Link from 'next/link'
import {
  BookOpen, Radio, Leaf, MapPin, Calendar, ArrowRight, ArrowUpRight,
  Clock, PlayCircle, Sprout, CheckCircle2, TrendingUp, Sun, Headphones,
  MessageCircle, Flame,
} from 'lucide-react'
import type { DashboardData } from './data'

/* DEV PREVIEW — sem banco. Dados mock de um produtor Gold. */
const user = { firstName: 'Douglas', plan: 'Gold' }

const stats = [
  { icon: BookOpen, label: 'Cursos em andamento', value: '3', sub: '2 perto de concluir', color: 'oklch(0.48 0.13 144)', bg: 'oklch(0.48 0.13 144 / 0.1)' },
  { icon: Clock, label: 'Horas estudadas', value: '24h', sub: '+5h esta semana', color: 'oklch(0.55 0.1 220)', bg: 'oklch(0.55 0.1 220 / 0.1)' },
  { icon: Radio, label: 'Próxima live', value: '2 dias', sub: 'Manejo de pragas', color: 'oklch(0.62 0.12 55)', bg: 'oklch(0.62 0.12 55 / 0.1)' },
  { icon: Leaf, label: 'Diagnósticos', value: 'Ilimitado', sub: 'Benefício Gold', color: 'oklch(0.62 0.14 75)', bg: 'oklch(0.78 0.17 75 / 0.16)' },
]

const courses = [
  { title: 'Manejo Integrado de Pragas', module: 'Módulo 4 de 6 · Controle biológico', progress: 68 },
  { title: 'Correção e Adubação de Solo', module: 'Módulo 2 de 5 · Calagem', progress: 35 },
  { title: 'Gestão Financeira da Fazenda', module: 'Módulo 6 de 6 · Fechamento de safra', progress: 92 },
]

const recommended = [
  { icon: Headphones, title: 'Podcast: Café de qualidade', sub: 'Episódio novo · 32 min', href: '/podcasts' },
  { icon: MessageCircle, title: 'Tire dúvidas no Chat IA', sub: 'Análise de imagem da lavoura', href: '/chat' },
  { icon: Sun, title: 'Dia de Campo em Patrocínio', sub: 'Inscrições abertas · 12 jul', href: '/dias-de-campo' },
]

export function DashboardView({ data }: { data: DashboardData }) {
  const lives = [
    { title: data.nextLiveTitle, agro: 'Agr. Helena Prado', when: data.nextLiveWhen, tag: 'AO VIVO' },
    { title: 'Leitura de análise de solo na prática', agro: 'Agr. Marcos Lima', when: 'Sex, 28 jun · 20h', tag: 'GOLD' },
  ]

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

      {/* ── Greeting banner ── */}
      <section
        className="dash-anim relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.22 0.09 148) 100%)' }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.12 55 / 0.18) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-3"
              style={{ background: 'oklch(1 0 0 / 0.08)', border: '1px solid oklch(1 0 0 / 0.14)', color: 'oklch(0.83 0.08 144)', letterSpacing: '0.06em' }}
            >
              <Sprout size={12} /> PLANO {user.plan.toUpperCase()} ATIVO
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Bom te ver de novo, {user.firstName}.
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'oklch(1 0 0 / 0.6)' }}>
              Você concluiu <strong style={{ color: 'oklch(0.83 0.08 144)' }}>92%</strong> de Gestão Financeira — falta pouco para o certificado.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
            >
              <PlayCircle size={16} /> Continuar estudando
            </Link>
            <Link
              href="/agendamentos"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors hover:bg-white/10"
              style={{ border: '1.5px solid oklch(1 0 0 / 0.2)', color: 'oklch(1 0 0 / 0.85)' }}
            >
              <Calendar size={16} /> Agendar visita
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="dash-anim dash-lift rounded-2xl p-5 bg-white"
              style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.05 + i * 0.06}s` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
                {s.value}
              </div>
              <div className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--color-frutificar-deep)' }}>{s.label}</div>
              <div className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)' }}>{s.sub}</div>
            </div>
          )
        })}
      </section>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Continue de onde parou */}
          <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.28s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
                <PlayCircle size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Continue de onde parou
              </h2>
              <Link href="/cursos" className="text-xs font-semibold inline-flex items-center gap-1 transition-colors hover:opacity-70" style={{ color: 'var(--color-earth)' }}>
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-3">
              {courses.map((c) => (
                <Link
                  key={c.title}
                  href="/cursos"
                  className="dash-lift block rounded-xl p-4 transition-colors"
                  style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{c.title}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{c.module}</p>
                    </div>
                    <span className="text-sm font-bold shrink-0" style={{ color: c.progress >= 90 ? 'var(--color-frutificar-green)' : 'var(--color-earth)' }}>
                      {c.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.91 0.01 144)' }}>
                    <div
                      className="bar-fill h-full rounded-full"
                      style={{ width: `${c.progress}%`, background: c.progress >= 90 ? 'var(--color-frutificar-green)' : 'linear-gradient(90deg, oklch(0.62 0.12 55), oklch(0.78 0.14 75))' }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Próximas lives */}
          <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.34s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
                <Radio size={18} style={{ color: 'var(--color-earth)' }} /> Próximas lives
              </h2>
              <Link href="/lives" className="text-xs font-semibold inline-flex items-center gap-1 transition-colors hover:opacity-70" style={{ color: 'var(--color-earth)' }}>
                Agenda <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-3">
              {lives.map((l) => (
                <div
                  key={l.title}
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.62 0.12 55 / 0.1)' }}>
                    <Radio size={18} style={{ color: 'var(--color-earth)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{l.title}</h3>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                      {l.agro} <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span> {l.when}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                    style={l.tag === 'AO VIVO'
                      ? { background: 'oklch(0.62 0.18 25 / 0.12)', color: 'oklch(0.55 0.18 25)' }
                      : { background: 'oklch(0.78 0.17 75 / 0.16)', color: 'oklch(0.55 0.14 75)' }}
                  >
                    {l.tag}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Sua propriedade */}
          <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.3s' }}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <MapPin size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Sua propriedade
            </h2>
            <div className="rounded-xl p-4 mb-3" style={{ background: 'linear-gradient(150deg, oklch(0.48 0.13 144 / 0.06), oklch(0.62 0.12 55 / 0.05))', border: '1px solid oklch(0.91 0.01 144)' }}>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{data.propertyName}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{data.propertyLocation} · {data.plotsCount} talhões · Café arábica</p>
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid oklch(0.91 0.01 144)' }}>
                <CheckCircle2 size={15} style={{ color: 'var(--color-frutificar-green)' }} />
                <span className="text-xs font-medium" style={{ color: 'oklch(0.42 0.04 144)' }}>
                  Último diagnóstico de solo: <strong style={{ color: 'var(--color-frutificar-green)' }}>pH corrigido</strong>
                </span>
              </div>
            </div>
            <Link
              href="/diagnostico"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
              style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
            >
              <Leaf size={15} /> Novo diagnóstico
            </Link>
          </section>

          {/* Benefício Gold — visitas */}
          <section
            className="dash-anim relative overflow-hidden rounded-2xl p-6"
            style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.24 0.09 144))', animationDelay: '0.36s' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 0%, oklch(0.78 0.17 75 / 0.14), transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sun size={16} style={{ color: 'oklch(0.78 0.14 75)' }} />
                <span className="text-[11px] font-bold tracking-wide" style={{ color: 'oklch(0.78 0.14 75)' }}>BENEFÍCIO GOLD</span>
              </div>
              <h3 className="text-white font-bold text-base mb-1" style={{ fontFamily: 'var(--font-heading)' }}>2 visitas técnicas este mês</h3>
              <p className="text-xs mb-4" style={{ color: 'oklch(1 0 0 / 0.55)', lineHeight: 1.6 }}>
                Você ainda tem <strong style={{ color: 'white' }}>1 visita</strong> disponível. Agende um agrônomo na sua propriedade.
              </p>
              <Link
                href="/agendamentos"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(130deg, oklch(0.55 0.14 75), oklch(0.62 0.12 55))' }}
              >
                Agendar agora <ArrowUpRight size={15} />
              </Link>
            </div>
          </section>

          {/* Recomendado */}
          <section className="dash-anim rounded-2xl p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.42s' }}>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <Flame size={18} style={{ color: 'var(--color-earth)' }} /> Recomendado para você
            </h2>
            <div className="space-y-1">
              {recommended.map((r) => {
                const Icon = r.icon
                return (
                  <Link
                    key={r.title}
                    href={r.href}
                    className="flex items-center gap-3 rounded-xl p-2.5 -mx-1 transition-colors hover:bg-[oklch(0.98_0.008_144)]"
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                      <Icon size={16} style={{ color: 'var(--color-frutificar-green)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[13px] truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{r.title}</h3>
                      <p className="text-xs truncate" style={{ color: 'oklch(0.55 0.04 144)' }}>{r.sub}</p>
                    </div>
                    <ArrowRight size={14} style={{ color: 'oklch(0.7 0.02 144)' }} />
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
