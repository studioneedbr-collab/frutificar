'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Leaf, Microscope, FileText, Users, FlaskConical, ClipboardList,
  CheckCircle2, ArrowRight,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

/* DEV PREVIEW — sem banco. Catálogo de serviços de um produtor Gold. */

const inclusos = [
  {
    icon: Leaf,
    title: 'Visita Técnica',
    badge: '2/mês inclusas',
    desc: 'Um agrônomo na sua propriedade para avaliação de campo, manejo e recomendações práticas na lavoura.',
    bullets: ['Agendamento em até 48h', 'Relatório fotográfico da visita', 'Sem custo adicional no Gold'],
  },
  {
    icon: Microscope,
    title: 'Diagnóstico de Solo',
    badge: 'ilimitado',
    desc: 'Coleta e interpretação de amostras para corrigir acidez, nutrição e fertilidade do seu cafezal.',
    bullets: ['Análise química completa', 'Mapa de fertilidade por talhão', 'Solicite quantas vezes precisar'],
  },
  {
    icon: FileText,
    title: 'Laudo Técnico',
    badge: '1/mês',
    desc: 'Documento assinado por agrônomo responsável, válido para crédito rural, certificações e seguros.',
    bullets: ['Assinatura de profissional CREA', 'Pronto para banco e seguradora', 'Entrega digital em PDF'],
  },
]

const avulsos = [
  {
    icon: Users,
    title: 'Consultoria Agronômica',
    price: 'R$ 280',
    unit: '/ hora',
    desc: 'Acompanhamento personalizado com especialista para destravar problemas específicos da sua safra.',
  },
  {
    icon: FlaskConical,
    title: 'Análise Foliar',
    price: 'R$ 150',
    unit: '',
    desc: 'Diagnóstico do estado nutricional das plantas para ajustar a adubação no momento certo.',
  },
  {
    icon: ClipboardList,
    title: 'Plano de Adubação',
    price: 'R$ 320',
    unit: '',
    desc: 'Cronograma detalhado de adubação, doses e épocas, calculado para a sua produtividade alvo.',
  },
]

const talhoes = [
  'Fazenda Santa Clara — Talhão A1',
  'Fazenda Santa Clara — Talhão A2',
  'Fazenda Santa Clara — Talhão B1',
  'Sítio Boa Vista',
]

type ServiceRequest = { name: string; priceLabel?: string }

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}

export default function ServicosPage() {
  const [requestTarget, setRequestTarget] = useState<ServiceRequest | null>(null)
  const [contactOpen, setContactOpen] = useState(false)

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = requestTarget?.name ?? ''
    setRequestTarget(null)
    toast.success('Solicitação enviada', { description: `${name} — entraremos em contato para confirmar.` })
  }

  function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setContactOpen(false)
    toast.success('Mensagem enviada', { description: 'Um agrônomo responde em até 24h.' })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim" style={{ animationDelay: '0.04s' }}>
        <p className="text-[11px] font-bold tracking-wide mb-1.5" style={{ color: 'var(--color-earth)', letterSpacing: '0.08em' }}>
          CATÁLOGO
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Serviços
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
          Serviços agronômicos sob demanda — alguns já inclusos no seu plano Gold.
        </p>
      </header>

      {/* ── Inclusos no seu plano Gold ── */}
      <section className="space-y-4">
        <h2
          className="dash-anim text-lg font-bold flex items-center gap-2"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', animationDelay: '0.08s' }}
        >
          <Leaf size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Inclusos no seu plano Gold
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inclusos.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="dash-anim dash-lift flex flex-col rounded-2xl p-6 bg-white"
                style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.12 + i * 0.06}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                    <Icon size={20} style={{ color: 'var(--color-frutificar-green)' }} />
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
                  >
                    <CheckCircle2 size={11} /> Incluído
                  </span>
                </div>

                <h3 className="font-bold text-base" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
                  {s.title}
                </h3>
                <p className="text-[11px] font-semibold mt-0.5 mb-2" style={{ color: 'var(--color-earth)' }}>{s.badge}</p>
                <p className="text-xs mb-4" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.6 }}>{s.desc}</p>

                <ul className="space-y-2 mb-5">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs" style={{ color: 'oklch(0.42 0.04 144)' }}>
                      <CheckCircle2 size={14} className="shrink-0 mt-px" style={{ color: 'var(--color-frutificar-green)' }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setRequestTarget({ name: s.title })}
                  className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                >
                  Solicitar <ArrowRight size={15} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Serviços avulsos ── */}
      <section className="space-y-4">
        <h2
          className="dash-anim text-lg font-bold flex items-center gap-2"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', animationDelay: '0.3s' }}
        >
          <FlaskConical size={18} style={{ color: 'var(--color-earth)' }} /> Serviços avulsos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avulsos.map((s, i) => {
            const Icon = s.icon
            const priceLabel = `Valor: ${s.price}${s.unit ? ` ${s.unit}` : ''}`
            return (
              <div
                key={s.title}
                className="dash-anim dash-lift flex flex-col rounded-2xl p-6 bg-white"
                style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.34 + i * 0.06}s` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'oklch(0.62 0.12 55 / 0.1)' }}>
                  <Icon size={20} style={{ color: 'var(--color-earth)' }} />
                </div>

                <h3 className="font-bold text-base" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
                  {s.title}
                </h3>
                <p className="text-xs mt-1 mb-4" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.6 }}>{s.desc}</p>

                <div className="mt-auto flex items-end gap-1 mb-4">
                  <span className="text-xl font-bold" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>{s.price}</span>
                  {s.unit && <span className="text-xs font-medium pb-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{s.unit}</span>}
                </div>

                <button
                  type="button"
                  onClick={() => setRequestTarget({ name: s.title, priceLabel })}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
                >
                  Contratar <ArrowRight size={15} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Closing CTA banner ── */}
      <section
        className="dash-anim relative overflow-hidden rounded-3xl p-6 md:p-8"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.24 0.09 144) 100%)', animationDelay: '0.54s' }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.12 55 / 0.18) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h2
              className="text-xl md:text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Precisa de um serviço específico?
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'oklch(1 0 0 / 0.6)', lineHeight: 1.6 }}>
              Fale com nosso time agronômico e montamos um atendimento sob medida para a sua lavoura de café.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm shrink-0 transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
          >
            <Users size={16} /> Falar com um agrônomo
          </button>
        </div>
      </section>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Solicitar serviço */}
      <Dialog open={requestTarget !== null} onOpenChange={(o) => !o && setRequestTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Leaf size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Solicitar serviço — {requestTarget?.name}
            </DialogTitle>
            <DialogDescription>Preencha os dados e nosso time agronômico confirma o agendamento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Serviço</label>
              <input
                name="servico"
                value={requestTarget?.name ?? ''}
                disabled
                readOnly
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ ...inputStyle, color: 'oklch(0.45 0.04 144)', cursor: 'not-allowed' }}
              />
            </div>

            {requestTarget?.priceLabel && (
              <div
                className="rounded-lg px-3 py-2.5 text-sm font-semibold"
                style={{ background: 'oklch(0.62 0.12 55 / 0.08)', color: 'var(--color-earth)', border: '1px solid oklch(0.62 0.12 55 / 0.2)' }}
              >
                {requestTarget.priceLabel}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Propriedade / Talhão</label>
              <select
                name="talhao"
                defaultValue={talhoes[0]}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              >
                {talhoes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Data desejada</label>
              <input
                type="date"
                name="data"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Observações</label>
              <textarea
                name="observacoes"
                rows={3}
                placeholder="Conte detalhes que ajudem o agrônomo a se preparar…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setRequestTarget(null)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                Enviar solicitação
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Falar com um agrônomo */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Users size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Falar com um agrônomo
            </DialogTitle>
            <DialogDescription>Conte o que você precisa e nosso time responde em até 24h.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Assunto</label>
              <input
                name="assunto"
                placeholder="Ex.: manejo de pragas no talhão A2"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Mensagem</label>
              <textarea
                name="mensagem"
                rows={4}
                placeholder="Descreva sua dúvida ou necessidade…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" onClick={() => setContactOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                Enviar mensagem
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
