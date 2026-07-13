'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Radio, Play, Calendar, Bell, BellRing, ArrowUpRight, Clock, Eye, Check,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { LivesData, Recorded } from './data'

export function LivesView({ data }: { data: LivesData }) {
  const { featured, proximas, gravadas, temas } = data
  const [tema, setTema] = useState('Todos')
  const [reminded, setReminded] = useState<Record<string, boolean>>({})
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [player, setPlayer] = useState<Recorded | null>(null)

  const featuredReminded = featured ? !!reminded[featured.title] : false

  function toggleReminder(title: string, when: string) {
    setReminded((prev) => {
      const next = { ...prev, [title]: !prev[title] }
      if (next[title]) {
        toast.success('Lembrete ativado', { description: `${title} · ${when}` })
      } else {
        toast.info('Lembrete removido')
      }
      return next
    })
  }

  const filteredProximas = tema === 'Todos' ? proximas : proximas.filter((l) => l.tema === tema)
  const filteredGravadas = tema === 'Todos' ? gravadas : gravadas.filter((g) => g.tema === tema)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes livePulse { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: .45; transform: scale(.7) } }
        .live-dot { animation: livePulse 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim, .live-dot { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Page header ── */}
      <header className="dash-anim" style={{ animationDelay: '0.02s' }}>
        <span className="text-xs font-bold tracking-widest block" style={{ color: 'var(--color-earth)' }}>
          TRANSMISSÕES AO VIVO
        </span>
        <h1
          className="text-2xl md:text-3xl font-bold mt-1"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Lives
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>
          Aulas e tira-dúvidas ao vivo com agrônomos toda semana.
        </p>
      </header>

      {/* ── Featured next live ── */}
      {featured && (
        <section
          className="dash-anim relative overflow-hidden rounded-3xl p-6 md:p-8"
          style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.22 0.09 148) 100%)', animationDelay: '0.08s' }}
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, oklch(0.62 0.12 55 / 0.18) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
          />
          <div className="relative grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Thumbnail */}
            <div
              className="relative rounded-2xl overflow-hidden aspect-video flex items-center justify-center"
              style={{ background: 'linear-gradient(140deg, oklch(0.30 0.10 148) 0%, oklch(0.20 0.08 152) 100%)', border: '1px solid oklch(1 0 0 / 0.1)' }}
            >
              {featured.ytId ? (
                <img
                  src={`https://img.youtube.com/vi/${featured.ytId}/hqdefault.jpg`}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              ) : (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 30% 30%, oklch(0.48 0.13 144 / 0.25), transparent 60%)' }}
                />
              )}
              {featured.ytId ? (
                <a
                  href={`https://youtu.be/${featured.ytId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'oklch(1 0 0 / 0.16)', border: '1px solid oklch(1 0 0 / 0.3)', backdropFilter: 'blur(4px)' }}
                >
                  <Play size={26} fill="white" style={{ color: 'white', marginLeft: 2 }} />
                </a>
              ) : (
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'oklch(1 0 0 / 0.12)', border: '1px solid oklch(1 0 0 / 0.2)', backdropFilter: 'blur(4px)' }}
                >
                  <Play size={26} fill="white" style={{ color: 'white', marginLeft: 2 }} />
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold mb-4"
                style={{ background: 'oklch(0.62 0.18 25 / 0.16)', border: '1px solid oklch(0.62 0.18 25 / 0.3)', color: 'oklch(0.82 0.12 30)', letterSpacing: '0.06em' }}
              >
                <span className="relative flex items-center justify-center w-2 h-2">
                  <span className="live-dot absolute w-2 h-2 rounded-full" style={{ background: 'oklch(0.7 0.2 25)' }} />
                </span>
                <Radio size={12} /> {featured.badge}
              </div>
              <h2
                className="text-xl md:text-2xl font-bold text-white leading-snug"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                {featured.title}
              </h2>
              <p className="mt-2 text-sm flex items-center gap-2 flex-wrap" style={{ color: 'oklch(1 0 0 / 0.6)' }}>
                {featured.agro && <><span style={{ color: 'oklch(0.83 0.08 144)' }}>{featured.agro}</span><span style={{ color: 'oklch(1 0 0 / 0.3)' }}>·</span></>}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} /> {featured.when}
                </span>
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-6">
                {featured.ytId ? (
                  <a
                    href={`https://youtu.be/${featured.ytId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                    style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
                  >
                    <Play size={16} fill="currentColor" /> Assistir agora
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleReminder(featured.title, featured.when)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                    style={
                      featuredReminded
                        ? { background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.4)' }
                        : { background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }
                    }
                  >
                    {featuredReminded
                      ? <><BellRing size={16} /> Lembrete ativado</>
                      : <><Bell size={16} /> Lembrar-me</>}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors hover:bg-white/10"
                  style={{ border: '1.5px solid oklch(1 0 0 / 0.2)', color: 'oklch(1 0 0 / 0.85)' }}
                >
                  Ver detalhes <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Theme filter pills (só quando há temas) ── */}
      {temas.length > 1 && (
        <section className="dash-anim flex flex-wrap gap-2" style={{ animationDelay: '0.14s' }}>
          {temas.map((t) => {
            const active = t === tema
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTema(t)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold select-none transition-colors"
                style={active
                  ? { background: 'var(--color-earth)', color: 'white', boxShadow: '0 6px 18px oklch(0.62 0.12 55 / 0.3)' }
                  : { background: 'white', color: 'var(--color-frutificar-deep)', border: '1px solid oklch(0.91 0.01 144)' }}
              >
                {t}
              </button>
            )
          })}
        </section>
      )}

      {/* ── Próximas lives ── */}
      {filteredProximas.length > 0 && (
        <section className="dash-anim" style={{ animationDelay: '0.2s' }}>
          <h2
            className="text-lg font-bold flex items-center gap-2 mb-4"
            style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
          >
            <Calendar size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Próximas lives
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProximas.map((l, i) => {
              const isReminded = !!reminded[l.title]
              return (
                <div
                  key={l.id}
                  className="dash-anim dash-lift rounded-2xl bg-white p-5 flex flex-col"
                  style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.24 + i * 0.06}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.62 0.12 55 / 0.1)' }}>
                      <Radio size={18} style={{ color: 'var(--color-earth)' }} />
                    </div>
                    {l.tema && (
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                      >
                        {l.tema}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>
                    {l.title}
                  </h3>
                  {l.agro && <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)' }}>{l.agro}</p>}
                  <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>
                    <Calendar size={13} style={{ color: 'oklch(0.7 0.02 144)' }} /> {l.when}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleReminder(l.title, l.when)}
                    className="mt-4 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                  >
                    {isReminded
                      ? <><Check size={15} /> Lembrete ativado</>
                      : <><Bell size={15} /> Lembrar-me</>}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Lives gravadas (replays) ── */}
      {filteredGravadas.length > 0 && (
        <section className="dash-anim" style={{ animationDelay: '0.3s' }}>
          <h2
            className="text-lg font-bold flex items-center gap-2 mb-4"
            style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}
          >
            <Play size={18} style={{ color: 'var(--color-earth)' }} /> Lives gravadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGravadas.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setPlayer(g)}
                className="dash-anim dash-lift rounded-2xl bg-white overflow-hidden block text-left w-full"
                style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.34 + i * 0.05}s` }}
              >
                <div
                  className="relative aspect-video flex items-center justify-center"
                  style={{ background: 'linear-gradient(140deg, oklch(0.48 0.13 144 / 0.18) 0%, oklch(0.62 0.12 55 / 0.14) 100%)' }}
                >
                  {g.ytId && (
                    <img
                      src={`https://img.youtube.com/vi/${g.ytId}/hqdefault.jpg`}
                      alt={g.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div
                    className="relative w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'oklch(1 0 0 / 0.85)', boxShadow: '0 6px 20px oklch(0.16 0.07 152 / 0.18)' }}
                  >
                    <Play size={20} fill="var(--color-frutificar-green)" style={{ color: 'var(--color-frutificar-green)', marginLeft: 2 }} />
                  </div>
                  {g.dur && (
                    <span
                      className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: 'oklch(0.16 0.07 152 / 0.78)', color: 'white' }}
                    >
                      <Clock size={10} /> {g.dur}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>
                    {g.title}
                  </h3>
                  {g.agro && <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)' }}>{g.agro}</p>}
                  {g.meta && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'oklch(0.6 0.03 144)' }}>
                      <Eye size={12} style={{ color: 'oklch(0.7 0.02 144)' }} /> {g.meta}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {!featured && filteredProximas.length === 0 && filteredGravadas.length === 0 && (
        <div className="text-center py-12 text-sm rounded-2xl bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', color: 'oklch(0.55 0.04 144)' }}>
          Nenhuma live agendada no momento. Volte em breve!
        </div>
      )}

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Detalhes da live em destaque */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {featured && (
            <>
              <DialogHeader>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold mb-1 w-fit"
                  style={{ background: 'oklch(0.62 0.18 25 / 0.12)', border: '1px solid oklch(0.62 0.18 25 / 0.25)', color: 'oklch(0.6 0.18 25)', letterSpacing: '0.06em' }}
                >
                  <Radio size={12} /> {featured.badge}
                </div>
                <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
                  {featured.title}
                </DialogTitle>
                <DialogDescription>
                  {featured.agro ? `${featured.agro} · ` : ''}{featured.when}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                {featured.tema && (
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                  >
                    {featured.tema}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Calendar size={13} style={{ color: 'oklch(0.7 0.02 144)' }} /> {featured.when}
                </span>
              </div>

              {featured.desc && (
                <p className="text-sm leading-relaxed rounded-xl p-3.5" style={{ color: 'oklch(0.42 0.04 144)', background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                  {featured.desc}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                  style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}
                >
                  Fechar
                </button>
                {featured.ytId ? (
                  <a
                    href={`https://youtu.be/${featured.ytId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}
                  >
                    <Play size={16} fill="currentColor" /> Assistir agora
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleReminder(featured.title, featured.when)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                    style={
                      featuredReminded
                        ? { background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.35)' }
                        : { background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }
                    }
                  >
                    {featuredReminded
                      ? <><BellRing size={16} /> Lembrete ativado</>
                      : <><Bell size={16} /> Lembrar-me</>}
                  </button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Player de live gravada */}
      <Dialog open={player !== null} onOpenChange={(o) => !o && setPlayer(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              {player?.title}
            </DialogTitle>
            <DialogDescription>
              {player?.agro ? `${player.agro} · ` : ''}{player?.dur}
            </DialogDescription>
          </DialogHeader>

          {player?.ytId ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${player.ytId}`}
                title={player.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : (
            <div
              className="relative rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center gap-3"
              style={{ background: 'linear-gradient(140deg, oklch(0.30 0.10 148) 0%, oklch(0.20 0.08 152) 100%)', border: '1px solid oklch(1 0 0 / 0.08)' }}
            >
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'oklch(1 0 0 / 0.12)', border: '1px solid oklch(1 0 0 / 0.2)', backdropFilter: 'blur(4px)' }}
              >
                <Play size={26} fill="white" style={{ color: 'white', marginLeft: 2 }} />
              </div>
              <span className="relative text-xs font-semibold tracking-wide" style={{ color: 'oklch(1 0 0 / 0.7)' }}>
                Vídeo indisponível
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
