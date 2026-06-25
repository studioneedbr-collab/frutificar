'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  BookOpen, MessageSquare, CalendarCheck, BarChart3,
  Sprout, Star, ArrowRight, CheckCircle2,
  Wheat, Microscope, Video, Headphones, MapPin,
  Users, Award, Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { FrutificarLogo } from '@/components/shared/logo'

/* ── Animated ticker ── */
const tickerItems = [
  '✦ Cursos Especializados',
  '✦ Chat IA Agrícola',
  '✦ Lives ao Vivo',
  '✦ Visitas Técnicas',
  '✦ Gestão Rural',
  '✦ Dias de Campo',
  '✦ Diagnóstico de Solo',
  '✦ Laudos Técnicos',
  '✦ Podcasts Exclusivos',
  '✦ Suporte Agronômico',
]

/* ── Features ── */
const features = [
  {
    icon: Video,
    title: 'Cursos em Vídeo',
    desc: 'Biblioteca com centenas de horas de conteúdo com especialistas em agronomia — culturas, manejo, pragas e muito mais.',
    color: 'oklch(0.48 0.13 144)',
    bg: 'oklch(0.48 0.13 144 / 0.08)',
  },
  {
    icon: MessageSquare,
    title: 'Chat IA Agrícola',
    desc: 'Nossa IA treinada com dados do agro responde perguntas técnicas, sugere manejo e analisa imagens da sua lavoura.',
    color: 'oklch(0.62 0.12 55)',
    bg: 'oklch(0.62 0.12 55 / 0.08)',
  },
  {
    icon: Microscope,
    title: 'Diagnóstico de Solo',
    desc: 'Envie os dados da análise do seu solo e receba um plano completo de adubação e correção para cada talhão.',
    color: 'oklch(0.55 0.1 220)',
    bg: 'oklch(0.55 0.1 220 / 0.08)',
  },
  {
    icon: Headphones,
    title: 'Podcasts & Lives',
    desc: 'Conteúdo em áudio para ouvir na roça, no caminhão ou em casa. Lives exclusivas com agrônomos ao vivo toda semana.',
    color: 'oklch(0.55 0.12 290)',
    bg: 'oklch(0.55 0.12 290 / 0.08)',
  },
  {
    icon: CalendarCheck,
    title: 'Visitas Técnicas',
    desc: 'Agende um agrônomo para visitar sua propriedade. Relatório técnico digital entregue em até 48 horas.',
    color: 'oklch(0.62 0.12 55)',
    bg: 'oklch(0.62 0.12 55 / 0.08)',
  },
  {
    icon: BarChart3,
    title: 'Gestão da Propriedade',
    desc: 'Registre atividades, acompanhe custos, compare safras e tome decisões com base em dados reais do campo.',
    color: 'oklch(0.48 0.13 144)',
    bg: 'oklch(0.48 0.13 144 / 0.08)',
  },
]

/* ── Steps ── */
const steps = [
  { n: '01', title: 'Escolha seu plano', desc: 'Essencial, Premium ou Gold — cada produtor tem um momento. Comece onde faz sentido para você.' },
  { n: '02', title: 'Acesse o conteúdo', desc: 'Cursos, lives, diagnósticos e IA disponíveis imediatamente. Sem enrolação.' },
  { n: '03', title: 'Aplique no campo', desc: 'Leve o conhecimento técnico direto para a lavoura e veja os resultados na próxima colheita.' },
]

/* ── Plans ── */
const plans = [
  {
    name: 'Essencial',
    tag: 'ESS',
    price: 'R$ 47',
    period: '/mês',
    desc: 'Para o produtor que quer começar a aprender com qualidade.',
    items: ['Acesso a todos os cursos', 'Chat IA (50 msgs/mês)', 'Podcasts e lives gravadas', 'Material em PDF'],
    cta: 'Começar no Essencial',
    highlight: false,
  },
  {
    name: 'Premium',
    tag: 'PRO',
    price: 'R$ 97',
    period: '/mês',
    desc: 'Para quem quer diagnóstico, suporte e visitas técnicas.',
    items: ['Tudo do Essencial', 'Chat IA ilimitado', 'Diagnóstico de solo mensal', '1 visita técnica/semestre', 'Lives exclusivas ao vivo'],
    cta: 'Assinar o Premium',
    highlight: true,
  },
  {
    name: 'Gold',
    tag: 'GOLD',
    price: 'R$ 197',
    period: '/mês',
    desc: 'Acesso total + dias de campo e suporte prioritário.',
    items: ['Tudo do Premium', 'Diagnóstico ilimitado', '2 visitas técnicas/mês', 'Dias de Campo exclusivos', 'Laudo técnico mensal'],
    cta: 'Assinar o Gold',
    highlight: false,
  },
]

/* ── Testimonials ── */
const testimonials = [
  {
    quote: 'Antes eu gastava caro em consultoria avulsa. Hoje, com o Premium, tenho suporte técnico constante e já melhorei 18% a produtividade do meu cafezal.',
    name: 'João Carlos Silva',
    role: 'Cafeicultor, Patrocínio/MG',
    plan: 'Premium',
  },
  {
    quote: 'O diagnóstico de solo da plataforma foi mais detalhado que os laudos que pagava no mercado. A IA entendeu meu problema de acidez na hora.',
    name: 'Maria Aparecida Costa',
    role: 'Produtora, Uberaba/MG',
    plan: 'Gold',
  },
  {
    quote: 'Assistia curso no celular durante o trato dos bichos. Em 3 meses implementei manejo integrado de pragas e reduzi 30% o custo com defensivos.',
    name: 'Roberto Santos Neto',
    role: 'Produtor Rural, Araxá/MG',
    plan: 'Essencial',
  },
]

/* ───────────────── helpers ───────────────── */

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* Reveal-on-scroll for every [data-reveal] in the page */
function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]'))
    if (prefersReducedMotion()) {
      els.forEach(el => el.classList.add('reveal-in'))
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal-in')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -60px 0px' },
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* Count-up that fires when scrolled into view. Keeps prefix/suffix (e.g. "4.200+", "180h+", "94%") */
function CountUp({ value, className, style }: { value: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null)
  const m = String(value).match(/^([^\d]*)([\d.]+)(.*)$/)
  const prefix = m ? m[1] : ''
  const suffix = m ? m[3] : ''
  const target = m ? parseInt(m[2].replace(/\./g, ''), 10) : 0
  const final = m ? prefix + target.toLocaleString('pt-BR') + suffix : value
  const [display, setDisplay] = useState(m ? prefix + '0' + suffix : value)

  useEffect(() => {
    if (!m) { setDisplay(value); return }
    if (prefersReducedMotion()) { setDisplay(final); return }
    let started = false
    const node = ref.current
    if (!node) return
    const run = () => {
      const dur = 1700
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / dur)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(prefix + Math.round(eased * target).toLocaleString('pt-BR') + suffix)
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting && !started) { started = true; run() }
      }),
      { threshold: 0.5 },
    )
    obs.observe(node)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span ref={ref} className={className} style={style}>{display}</span>
}

/* Reusable CTA with light-sweep shine + lift + arrow slide */
function ShineButton({
  href, children, className = '', style, auto = false,
}: {
  href: string; children: React.ReactNode; className?: string; style?: React.CSSProperties; auto?: boolean
}) {
  return (
    <Link href={href} className={`shine-btn group ${auto ? 'shine-auto' : ''} ${className}`} style={style}>
      <span className="shine-sweep" aria-hidden />
      <span className="relative z-10 inline-flex items-center justify-center gap-2.5">{children}</span>
    </Link>
  )
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/* Auto-rotating testimonials carousel */
function TestimonialCarousel() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = testimonials.length

  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const id = setInterval(() => setI(p => (p + 1) % n), 5500)
    return () => clearInterval(id)
  }, [paused, n])

  const go = (d: number) => setI(p => (p + d + n) % n)

  return (
    <div
      className="relative max-w-3xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Depoimentos de produtores"
    >
      {/* viewport */}
      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-700"
          style={{ transform: `translateX(-${i * 100}%)`, transitionTimingFunction: 'cubic-bezier(.16,1,.3,1)' }}
        >
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="w-full shrink-0 px-1"
              aria-hidden={testimonials[i].name !== t.name}
            >
              <div
                className="rounded-3xl p-8 md:p-12 text-center mx-auto"
                style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', boxShadow: '0 24px 64px oklch(0.16 0.07 152 / 0.08)' }}
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={16} fill="oklch(0.78 0.17 75)" style={{ color: 'oklch(0.78 0.17 75)' }} />
                  ))}
                </div>
                <blockquote
                  className="text-lg md:text-2xl leading-snug mb-8 italic"
                  style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-display)' }}
                >
                  “{t.quote}”
                </blockquote>
                <figcaption className="flex items-center justify-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'linear-gradient(140deg, var(--color-frutificar-green), var(--color-frutificar-forest))', color: 'white', fontFamily: 'var(--font-heading)' }}
                  >
                    {initials(t.name)}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{t.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'oklch(0.58 0.04 144)' }}>{t.role}</div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full self-start"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                  >
                    {t.plan}
                  </span>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>

      {/* arrows */}
      <button
        onClick={() => go(-1)}
        aria-label="Depoimento anterior"
        className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-5 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', boxShadow: '0 6px 20px oklch(0.16 0.07 152 / 0.12)', color: 'var(--color-frutificar-deep)' }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Próximo depoimento"
        className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)', boxShadow: '0 6px 20px oklch(0.16 0.07 152 / 0.12)', color: 'var(--color-frutificar-deep)' }}
      >
        <ChevronRight size={18} />
      </button>

      {/* dots */}
      <div className="flex justify-center gap-2 mt-7">
        {testimonials.map((t, d) => (
          <button
            key={t.name}
            onClick={() => setI(d)}
            aria-label={`Ir para depoimento ${d + 1}`}
            aria-current={i === d}
            className="h-2 rounded-full transition-all"
            style={{
              width: i === d ? 26 : 8,
              background: i === d ? 'var(--color-earth)' : 'oklch(0.48 0.13 144 / 0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────── */

export default function LandingPage() {
  useScrollReveal()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'oklch(0.98 0.008 144)' }}>

      {/* ── GLOBAL ANIMATION STYLES ── */}
      <style>{`
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .ticker-track { display: flex; width: max-content; animation: ticker 24s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }

        @keyframes floatBlobA { 0%,100% { transform: translate(30%, -30%) scale(1) } 50% { transform: translate(24%, -24%) scale(1.12) } }
        @keyframes floatBlobB { 0%,100% { transform: translate(-30%, 30%) scale(1) } 50% { transform: translate(-24%, 24%) scale(1.1) } }
        @keyframes spinSlow { to { transform: rotate(360deg) } }
        .blob-a { animation: floatBlobA 14s ease-in-out infinite; }
        .blob-b { animation: floatBlobB 16s ease-in-out infinite; }

        /* scroll reveal */
        [data-reveal] { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
        [data-reveal].reveal-in { opacity: 1; transform: none; }

        /* hero entrance */
        @keyframes heroUp { from { opacity: 0; transform: translateY(22px) } to { opacity: 1; transform: none } }
        .hero-anim { opacity: 0; animation: heroUp .8s cubic-bezier(.16,1,.3,1) forwards; }

        /* shine button */
        .shine-btn { position: relative; overflow: hidden; isolation: isolate; transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, filter .25s; }
        .shine-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
        .shine-btn:active { transform: translateY(0) scale(.98); }
        .shine-sweep { position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(100deg, transparent 25%, oklch(1 0 0 / 0.45) 50%, transparent 75%);
          transform: translateX(-130%); }
        .shine-btn:hover .shine-sweep { animation: sweep .9s ease; }
        .shine-auto .shine-sweep { animation: sweep 4.5s ease-in-out infinite; }
        @keyframes sweep { 0% { transform: translateX(-130%) } 55%,100% { transform: translateX(130%) } }
        .shine-btn .arrow { transition: transform .25s cubic-bezier(.16,1,.3,1); }
        .shine-btn:hover .arrow { transform: translateX(4px); }

        /* glow pulse for the amber CTA */
        @keyframes earthGlow {
          0%,100% { box-shadow: 0 8px 28px oklch(0.62 0.12 55 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.18); }
          50% { box-shadow: 0 12px 40px oklch(0.62 0.12 55 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.18); }
        }
        .earth-glow { animation: earthGlow 3s ease-in-out infinite; }

        /* card hover lift */
        .lift { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s, border-color .3s; }
        .lift:hover { transform: translateY(-6px); }

        @media (prefers-reduced-motion: reduce) {
          .ticker-track, .blob-a, .blob-b, .hero-anim, .shine-auto .shine-sweep, .earth-glow { animation: none !important; }
          [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
          .hero-anim { opacity: 1 !important; }
        }
      `}</style>

      {/* ── NAV (floating rounded pill) ── */}
      <nav
        className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] transition-all duration-300"
        style={{ top: scrolled ? 10 : 18, maxWidth: 1080 }}
      >
        <div
          className="flex items-center justify-between rounded-full pl-5 pr-2.5 transition-all duration-300"
          style={{
            paddingTop: scrolled ? 8 : 11,
            paddingBottom: scrolled ? 8 : 11,
            background: scrolled ? 'oklch(0.16 0.07 152 / 0.92)' : 'oklch(0.16 0.07 152 / 0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid oklch(1 0 0 / 0.1)',
            boxShadow: scrolled ? '0 12px 40px oklch(0.16 0.07 152 / 0.35)' : '0 6px 24px oklch(0.16 0.07 152 / 0.18)',
          }}
        >
          <FrutificarLogo white size={24} />

          <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: 'oklch(1 0 0 / 0.65)' }}>
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-white transition-colors">Depoimentos</a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:block px-4 py-2 rounded-full text-sm font-medium transition-colors hover:text-white"
              style={{ color: 'oklch(1 0 0 / 0.7)' }}
            >
              Entrar
            </Link>
            <ShineButton
              href="/cadastro"
              className="px-4 py-2 rounded-full text-sm font-bold text-white"
              style={{ background: 'var(--color-earth)', boxShadow: '0 4px 16px oklch(0.62 0.12 55 / 0.4)' }}
            >
              Começar grátis
            </ShineButton>
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full"
              style={{ background: 'oklch(1 0 0 / 0.08)', color: 'white' }}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            className="md:hidden mt-2 rounded-3xl p-3 flex flex-col"
            style={{
              background: 'oklch(0.16 0.07 152 / 0.96)',
              backdropFilter: 'blur(16px)',
              border: '1px solid oklch(1 0 0 / 0.1)',
              boxShadow: '0 16px 48px oklch(0.16 0.07 152 / 0.4)',
            }}
          >
            {[['Recursos', '#recursos'], ['Planos', '#planos'], ['Depoimentos', '#depoimentos']].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-2xl text-sm font-medium transition-colors hover:bg-white/5"
                style={{ color: 'oklch(1 0 0 / 0.75)' }}
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded-2xl text-sm font-medium transition-colors hover:bg-white/5"
              style={{ color: 'oklch(1 0 0 / 0.75)' }}
            >
              Entrar
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-20 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, var(--color-frutificar-night) 0%, oklch(0.20 0.085 148) 40%, oklch(0.28 0.09 152) 100%)',
        }}
      >
        {/* Atmospheric animated blobs */}
        <div
          className="blob-a absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.48 0.13 144 / 0.20) 0%, transparent 70%)' }}
        />
        <div
          className="blob-b absolute bottom-0 left-0 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.12 55 / 0.14) 0%, transparent 70%)' }}
        />
        {/* slow conic shimmer behind headline */}
        <div
          className="absolute left-1/2 top-1/2 w-[820px] h-[820px] rounded-full pointer-events-none opacity-40"
          style={{
            transform: 'translate(-50%, -50%)',
            background: 'conic-gradient(from 0deg, transparent, oklch(0.48 0.13 144 / 0.10), transparent 40%, oklch(0.62 0.12 55 / 0.08), transparent 75%)',
            animation: 'spinSlow 40s linear infinite',
            maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
          }}
        />

        {/* Badge */}
        <div
          className="hero-anim inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 relative"
          style={{
            background: 'oklch(1 0 0 / 0.08)',
            border: '1px solid oklch(1 0 0 / 0.14)',
            color: 'oklch(0.83 0.08 144)',
            letterSpacing: '0.08em',
            animationDelay: '0.05s',
          }}
        >
          <Sprout size={12} />
          PLATAFORMA PARA O AGRONEGÓCIO BRASILEIRO
        </div>

        {/* Headline */}
        <h1
          className="hero-anim text-5xl md:text-7xl font-bold text-white leading-[1.05] max-w-4xl relative mb-6"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em', animationDelay: '0.15s' }}
        >
          O campo merece
          <span
            className="block italic relative"
            style={{ color: 'oklch(0.78 0.14 75)', fontFamily: 'var(--font-display)' }}
          >
            conhecimento de ponta.
          </span>
        </h1>

        <p
          className="hero-anim text-lg md:text-xl max-w-2xl mx-auto mb-10 relative"
          style={{ color: 'oklch(1 0 0 / 0.62)', lineHeight: 1.7, animationDelay: '0.28s' }}
        >
          Educação técnica, diagnóstico de solo com IA, visitas agronômicas e gestão rural — tudo em uma plataforma feita para o produtor que quer crescer.
        </p>

        {/* CTAs */}
        <div className="hero-anim flex flex-col sm:flex-row items-center gap-3 relative mb-16" style={{ animationDelay: '0.4s' }}>
          <ShineButton
            href="/cadastro"
            auto
            className="earth-glow px-8 py-4 rounded-2xl text-white font-bold text-base"
            style={{ background: 'var(--color-earth)' }}
          >
            Começar gratuitamente <ArrowRight size={16} className="arrow" />
          </ShineButton>
          <Link
            href="/planos"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:bg-white/10"
            style={{ border: '1.5px solid oklch(1 0 0 / 0.2)', color: 'oklch(1 0 0 / 0.85)' }}
          >
            Ver planos e preços
          </Link>
        </div>

        {/* Stats */}
        <div
          className="hero-anim grid grid-cols-3 gap-8 relative border-t pt-8"
          style={{ borderColor: 'oklch(1 0 0 / 0.1)', maxWidth: 480, animationDelay: '0.52s' }}
        >
          {[
            { n: '4.200+', label: 'Produtores' },
            { n: '180h+', label: 'de conteúdo' },
            { n: '94%', label: 'de satisfação' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <CountUp
                value={s.n}
                className="text-2xl font-bold block"
                style={{ color: 'white', fontFamily: 'var(--font-heading)' }}
              />
              <div className="text-xs mt-0.5" style={{ color: 'oklch(1 0 0 / 0.5)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TICKER / FAIXA ANIMADA ── */}
      <div className="py-3 overflow-hidden" style={{ background: 'var(--color-earth)' }}>
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="text-sm font-bold whitespace-nowrap px-6"
              style={{ color: 'white', letterSpacing: '0.04em' }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── RECURSOS ── */}
      <section id="recursos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <span className="text-xs font-bold tracking-widest mb-3 block" style={{ color: 'var(--color-earth)' }}>
              TUDO EM UM SÓ LUGAR
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
            >
              Ferramentas que o campo
              <span className="italic block" style={{ color: 'var(--color-frutificar-green)', fontFamily: 'var(--font-display)' }}>
                sempre precisou.
              </span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'oklch(0.48 0.04 144)', lineHeight: 1.7 }}>
              Reunimos as melhores ferramentas de suporte técnico, educação e gestão rural em uma plataforma simples e acessível.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, idx) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  data-reveal
                  style={{ transitionDelay: `${(idx % 3) * 90}ms`, background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}
                  className="lift rounded-2xl p-6 group hover:shadow-xl"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: f.bg }}
                  >
                    <Icon size={21} style={{ color: f.color }} />
                  </div>
                  <h3
                    className="font-bold text-[17px] mb-2"
                    style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.52 0.04 144)' }}>
                    {f.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className="py-24 px-6"
        style={{ background: 'linear-gradient(135deg, var(--color-frutificar-night) 0%, oklch(0.22 0.09 148) 100%)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16" data-reveal>
            <span className="text-xs font-bold tracking-widest mb-3 block" style={{ color: 'oklch(0.83 0.08 144)' }}>
              COMO FUNCIONA
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
              Simples como deve ser.
            </h2>
          </div>

          {/* Number row with connecting line */}
          <div className="relative justify-between mb-8 px-7 hidden md:flex" data-reveal>
            <div className="absolute top-7 left-[56px] right-[56px] h-px" style={{ background: 'oklch(1 0 0 / 0.12)' }} />
            {steps.map((s) => (
              <div
                key={s.n}
                className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
                style={{ background: 'oklch(0.22 0.09 148)', border: '1px solid oklch(1 0 0 / 0.14)' }}
              >
                <span className="text-xl font-bold" style={{ color: 'oklch(0.78 0.14 75)', fontFamily: 'var(--font-heading)' }}>
                  {s.n}
                </span>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, idx) => (
              <div key={s.n} data-reveal style={{ transitionDelay: `${idx * 110}ms` }}>
                <div
                  className="md:hidden w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'oklch(1 0 0 / 0.06)', border: '1px solid oklch(1 0 0 / 0.1)' }}
                >
                  <span className="text-lg font-bold" style={{ color: 'oklch(0.78 0.14 75)' }}>{s.n}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(1 0 0 / 0.55)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF NUMBERS (animated) ── */}
      <section
        className="py-16 px-6"
        style={{ background: 'var(--color-parchment)', borderTop: '1px solid oklch(0.91 0.01 144)' }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: Users, n: '4.200+', label: 'Produtores ativos' },
            { icon: BookOpen, n: '180h+', label: 'Horas de conteúdo' },
            { icon: MapPin, n: '230+', label: 'Municípios atendidos' },
            { icon: Award, n: '94%', label: 'Taxa de satisfação' },
          ].map((s, idx) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex flex-col items-center gap-2" data-reveal style={{ transitionDelay: `${idx * 90}ms` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                  <Icon size={18} style={{ color: 'var(--color-frutificar-green)' }} />
                </div>
                <CountUp
                  value={s.n}
                  className="text-3xl md:text-4xl font-bold"
                  style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
                />
                <span className="text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="planos" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <span className="text-xs font-bold tracking-widest mb-3 block" style={{ color: 'var(--color-earth)' }}>
              PLANOS E PREÇOS
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
            >
              Invista no seu campo.
            </h2>
            <p className="mt-3 text-base" style={{ color: 'oklch(0.52 0.04 144)' }}>
              Cancele quando quiser. Sem fidelidade.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {plans.map((p, idx) => (
              <div
                key={p.name}
                data-reveal
                className="lift rounded-2xl p-7 relative"
                style={{
                  transitionDelay: `${idx * 100}ms`,
                  ...(p.highlight
                    ? {
                        background: 'linear-gradient(160deg, var(--color-frutificar-night) 0%, oklch(0.24 0.09 144) 100%)',
                        border: '1.5px solid oklch(1 0 0 / 0.12)',
                        boxShadow: '0 24px 64px oklch(0.16 0.07 152 / 0.3)',
                      }
                    : { background: 'white', border: '1px solid oklch(0.91 0.01 144)' }),
                }}
              >
                {p.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'var(--color-earth)', color: 'white', boxShadow: '0 6px 18px oklch(0.62 0.12 55 / 0.45)' }}
                  >
                    MAIS POPULAR
                  </div>
                )}

                <div
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-4"
                  style={p.highlight
                    ? { background: 'oklch(1 0 0 / 0.1)', color: 'oklch(0.83 0.08 144)' }
                    : { background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
                >
                  {p.tag}
                </div>

                <h3
                  className="text-2xl font-bold mb-1"
                  style={{ color: p.highlight ? 'white' : 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
                >
                  {p.name}
                </h3>
                <p className="text-sm mb-4" style={{ color: p.highlight ? 'oklch(1 0 0 / 0.5)' : 'oklch(0.52 0.04 144)' }}>
                  {p.desc}
                </p>

                <div className="flex items-end gap-1 mb-6">
                  <span
                    className="text-4xl font-bold"
                    style={{ color: p.highlight ? 'white' : 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
                  >
                    {p.price}
                  </span>
                  <span className="text-sm mb-1.5" style={{ color: p.highlight ? 'oklch(1 0 0 / 0.4)' : 'oklch(0.6 0.02 144)' }}>
                    {p.period}
                  </span>
                </div>

                <ul className="space-y-2.5 mb-7">
                  {p.items.map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 size={14} style={{ color: p.highlight ? 'oklch(0.78 0.14 75)' : 'var(--color-frutificar-green)', flexShrink: 0 }} />
                      <span style={{ color: p.highlight ? 'oklch(1 0 0 / 0.75)' : 'oklch(0.42 0.04 144)' }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <ShineButton
                  href="/cadastro"
                  className="block text-center py-3 rounded-xl font-bold text-sm w-full"
                  style={p.highlight
                    ? { background: 'linear-gradient(130deg, oklch(0.55 0.14 75), oklch(0.62 0.12 55))', color: 'white' }
                    : { background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                >
                  {p.cta}
                </ShineButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (carousel) ── */}
      <section id="depoimentos" className="py-24 px-6" style={{ background: 'var(--color-parchment)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14" data-reveal>
            <span className="text-xs font-bold tracking-widest mb-3 block" style={{ color: 'var(--color-earth)' }}>
              DEPOIMENTOS
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
            >
              O campo já fala
              <span className="italic" style={{ color: 'var(--color-frutificar-green)', fontFamily: 'var(--font-display)' }}> por si.</span>
            </h2>
          </div>

          <div data-reveal>
            <TestimonialCarousel />
          </div>
        </div>
      </section>

      {/* ── TRUST TICKER ── */}
      <div className="py-3 overflow-hidden" style={{ background: 'var(--color-frutificar-deep)' }}>
        <div className="ticker-track">
          {[
            '✔ Pagamento seguro via Asaas',
            '✔ Acesso imediato após assinar',
            '✔ Conteúdo validado por agrônomos',
            '✔ Cancele quando quiser',
            '✔ Sem fidelidade contratual',
            '✔ Suporte técnico incluso',
            '✔ Pagamento seguro via Asaas',
            '✔ Acesso imediato após assinar',
            '✔ Conteúdo validado por agrônomos',
            '✔ Cancele quando quiser',
            '✔ Sem fidelidade contratual',
            '✔ Suporte técnico incluso',
          ].map((item, i) => (
            <span
              key={i}
              className="text-sm font-semibold whitespace-nowrap px-8"
              style={{ color: 'oklch(0.83 0.08 144)', letterSpacing: '0.03em' }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, var(--color-frutificar-night) 0%, oklch(0.22 0.09 148) 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, oklch(0.62 0.12 55 / 0.15) 0%, transparent 65%)' }}
        />
        <div className="max-w-2xl mx-auto relative" data-reveal>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ background: 'oklch(1 0 0 / 0.06)', border: '1px solid oklch(1 0 0 / 0.1)' }}
          >
            <Wheat size={28} style={{ color: 'oklch(0.78 0.14 75)' }} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
            Sua propriedade merece
            <span className="italic block" style={{ color: 'oklch(0.78 0.14 75)', fontFamily: 'var(--font-display)' }}>
              o melhor suporte.
            </span>
          </h2>
          <p className="text-base mb-10" style={{ color: 'oklch(1 0 0 / 0.55)', lineHeight: 1.7 }}>
            Junte-se a 4.200 produtores rurais que já estão crescendo com o Frutificar Digital. Comece hoje, sem risco.
          </p>
          <ShineButton
            href="/cadastro"
            auto
            className="earth-glow px-8 py-4 rounded-xl font-bold text-[15px] text-white"
            style={{ background: 'linear-gradient(130deg, oklch(0.55 0.14 75) 0%, oklch(0.62 0.12 55) 100%)' }}
          >
            Começar gratuitamente <ArrowRight size={16} className="arrow" />
          </ShineButton>
          <p className="mt-4 text-xs" style={{ color: 'oklch(1 0 0 / 0.35)' }}>
            Sem cartão de crédito para começar · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6" style={{ background: 'var(--color-frutificar-night)', borderTop: '1px solid oklch(1 0 0 / 0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <FrutificarLogo white size={24} />
              <p className="mt-3 text-sm max-w-xs" style={{ color: 'oklch(1 0 0 / 0.45)', lineHeight: 1.6 }}>
                Educação, gestão e tecnologia para o produtor rural brasileiro.
              </p>
            </div>
            <div className="flex flex-wrap gap-10">
              {[
                { title: 'Plataforma', items: ['Cursos', 'Chat IA', 'Diagnóstico', 'Visitas Técnicas'] },
                { title: 'Empresa', items: ['Sobre', 'Planos', 'Blog', 'Contato'] },
                { title: 'Legal', items: ['Termos', 'Privacidade', 'Cookies'] },
              ].map(col => (
                <div key={col.title}>
                  <div className="text-xs font-bold mb-3" style={{ color: 'oklch(1 0 0 / 0.35)', letterSpacing: '0.06em' }}>
                    {col.title.toUpperCase()}
                  </div>
                  <ul className="space-y-2">
                    {col.items.map(item => (
                      <li key={item}>
                        <a href="#" className="text-sm transition-colors hover:text-white/80" style={{ color: 'oklch(1 0 0 / 0.5)' }}>
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div
            className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
            style={{ borderColor: 'oklch(1 0 0 / 0.08)', color: 'oklch(1 0 0 / 0.3)' }}
          >
            <span>© 2026 Frutificar Digital · Todos os direitos reservados</span>
            <div className="flex items-center gap-2">
              <span>Site desenvolvido por</span>
              <a
                href="https://instagram.com/studio.need"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-semibold transition-colors hover:text-white/60"
                style={{ color: 'oklch(1 0 0 / 0.45)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="3.5"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                Studio Need
                <span style={{ color: 'oklch(1 0 0 / 0.22)' }}>·</span>
                @studio.need
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
