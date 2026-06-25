'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Calendar, CalendarCheck, Clock, MapPin, User, Leaf, Microscope,
  Sun, ArrowUpRight, FileText, CheckCircle2, Plus, X, Trash2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { gerarRelatorioVisita } from '@/lib/reports'

/* DEV PREVIEW — sem banco. Dados mock de agendamentos de um produtor Gold, com ações em memória. */

type Appointment = {
  id: number
  icon: typeof CalendarCheck
  title: string
  agro: string
  when: string
  place: string
  status: 'Confirmado' | 'Pendente' | 'Concluído'
}

const initialUpcoming: Appointment[] = [
  {
    id: 1,
    icon: CalendarCheck,
    title: 'Visita Técnica',
    agro: 'Agr. Helena Prado',
    when: 'Ter, 02 jul · 09h00',
    place: 'Fazenda Santa Clara — Talhão A2',
    status: 'Confirmado',
  },
  {
    id: 2,
    icon: Microscope,
    title: 'Diagnóstico de Solo (coleta)',
    agro: 'Agr. Marcos Lima',
    when: 'Qui, 11 jul · 14h00',
    place: 'Fazenda Santa Clara — Talhão C1',
    status: 'Pendente',
  },
]

const services = [
  { icon: Leaf, title: 'Visita Técnica', desc: 'Agrônomo na sua lavoura com relatório digital.' },
  { icon: Microscope, title: 'Diagnóstico de Solo', desc: 'Coleta de amostras e análise laboratorial.' },
  { icon: User, title: 'Consultoria Agronômica', desc: 'Plano de manejo personalizado por safra.' },
]

const serviceTypes = ['Visita Técnica', 'Diagnóstico de Solo', 'Consultoria Agronômica'] as const

const properties = [
  'Fazenda Santa Clara — Talhão A1',
  'Fazenda Santa Clara — Talhão A2',
  'Fazenda Santa Clara — Talhão B1',
]

const iconForType: Record<string, typeof CalendarCheck> = {
  'Visita Técnica': CalendarCheck,
  'Diagnóstico de Solo': Microscope,
  'Consultoria Agronômica': User,
}

const history = [
  { type: 'Visita Técnica', agro: 'Agr. Helena Prado', when: '04 jun · 09h00' },
  { type: 'Diagnóstico de Solo', agro: 'Agr. Marcos Lima', when: '21 mai · 15h00' },
  { type: 'Consultoria Agronômica', agro: 'Agr. Beatriz Nunes', when: '08 mai · 10h30' },
  { type: 'Visita Técnica', agro: 'Agr. Helena Prado', when: '17 abr · 08h30' },
]

const statusStyle: Record<string, { bg: string; color: string }> = {
  Confirmado: { bg: 'oklch(0.48 0.13 144 / 0.12)', color: 'oklch(0.42 0.13 144)' },
  Pendente: { bg: 'oklch(0.7 0.15 70 / 0.16)', color: 'oklch(0.55 0.14 70)' },
  Concluído: { bg: 'oklch(0.55 0.1 220 / 0.12)', color: 'oklch(0.5 0.1 220)' },
}

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}

export default function AgendamentosPage() {
  const [upcoming, setUpcoming] = useState<Appointment[]>(initialUpcoming)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [formType, setFormType] = useState<string>(serviceTypes[0])

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null)

  function openSchedule(presetType?: string) {
    setFormType(presetType ?? selectedService ?? serviceTypes[0])
    setScheduleOpen(true)
  }

  function handleSelectService(title: string) {
    setSelectedService(title)
    setFormType(title)
    setScheduleOpen(true)
  }

  function handleSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const tipo = String(data.get('tipo') ?? formType)
    const place = String(data.get('place') ?? properties[0])
    const date = String(data.get('date') ?? '')
    const time = String(data.get('time') ?? '')
    const when = [date, time].filter(Boolean).join(' · ') || 'A confirmar'

    const novo: Appointment = {
      id: Date.now(),
      icon: iconForType[tipo] ?? CalendarCheck,
      title: tipo,
      agro: 'A designar',
      when,
      place,
      status: 'Pendente',
    }
    setUpcoming((cur) => [novo, ...cur])
    setScheduleOpen(false)
    toast.success('Agendamento solicitado', { description: 'Você receberá a confirmação em breve.' })
  }

  function handleConfirmCancel() {
    if (!cancelTarget) return
    setUpcoming((cur) => cur.filter((a) => a.id !== cancelTarget.id))
    setCancelTarget(null)
    toast.success('Agendamento cancelado')
  }

  function handleReport(h: { type: string; agro: string; when: string }) {
    gerarRelatorioVisita({
      tipo: h.type,
      agronomo: h.agro,
      propriedade: 'Fazenda Santa Clara',
      data: h.when,
      status: 'Concluído',
    })
    toast.success('Relatório gerado', { description: 'O PDF foi baixado no seu dispositivo.' })
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
      <header className="dash-anim" style={{ animationDelay: '0.02s' }}>
        <span className="text-[11px] font-bold tracking-wide" style={{ color: 'var(--color-earth)', letterSpacing: '0.08em' }}>
          VISITAS E SERVIÇOS
        </span>
        <h1
          className="text-2xl md:text-3xl font-bold mt-1"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Agendamentos
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
          Agende visitas técnicas e acompanhe seus atendimentos.
        </p>
      </header>

      {/* ── Benefício Gold ── */}
      <section
        className="dash-anim relative overflow-hidden rounded-2xl p-6 md:p-7"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night), oklch(0.24 0.09 144))', animationDelay: '0.08s' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 85% 0%, oklch(0.78 0.17 75 / 0.14), transparent 60%)' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sun size={16} style={{ color: 'oklch(0.78 0.14 75)' }} />
              <span className="text-[11px] font-bold tracking-wide" style={{ color: 'oklch(0.78 0.14 75)' }}>BENEFÍCIO GOLD</span>
            </div>
            <h2 className="text-white font-bold text-lg md:text-xl mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
              1 visita técnica restante este mês
            </h2>
            <p className="text-sm max-w-xl" style={{ color: 'oklch(1 0 0 / 0.6)', lineHeight: 1.6 }}>
              Agende um agrônomo na sua propriedade — relatório digital em até <strong style={{ color: 'white' }}>48h</strong>.
            </p>
          </div>
          <button
            onClick={() => openSchedule()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98] shrink-0"
            style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
          >
            <Plus size={16} /> Agendar visita
          </button>
        </div>
      </section>

      {/* ── Próximos agendamentos ── */}
      <section className="dash-anim rounded-2xl p-5 md:p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.14s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <CalendarCheck size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Próximos agendamentos
        </h2>
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <p className="text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
              Nenhum agendamento no momento. Agende um novo serviço abaixo.
            </p>
          )}
          {upcoming.map((a) => {
            const Icon = a.icon
            const st = statusStyle[a.status]
            return (
              <div
                key={a.id}
                className="dash-lift flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-4"
                style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                  <Icon size={18} style={{ color: 'var(--color-frutificar-green)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{a.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    <User size={12} /> {a.agro}
                    <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span>
                    <Clock size={12} /> {a.when}
                  </p>
                  <p className="text-xs mt-1 flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    <MapPin size={12} /> {a.place}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setDetailTarget(a)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-earth)' }}
                  >
                    Ver detalhes <ArrowUpRight size={13} />
                  </button>
                  <button
                    onClick={() => setCancelTarget(a)}
                    aria-label="Cancelar agendamento"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.08)]"
                    style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.25)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Agendar novo serviço ── */}
      <section className="dash-anim rounded-2xl p-5 md:p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.2s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Plus size={18} style={{ color: 'var(--color-earth)' }} /> Agendar novo serviço
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {services.map((s) => {
            const Icon = s.icon
            const isSelected = selectedService === s.title
            return (
              <button
                key={s.title}
                type="button"
                onClick={() => handleSelectService(s.title)}
                className="dash-lift rounded-xl p-5 cursor-pointer text-left"
                style={
                  isSelected
                    ? {
                        background: 'oklch(0.48 0.13 144 / 0.06)',
                        border: '1.5px solid var(--color-frutificar-green)',
                        boxShadow: '0 0 0 3px oklch(0.48 0.13 144 / 0.12)',
                      }
                    : { background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }
                }
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                  <Icon size={18} style={{ color: 'var(--color-frutificar-green)' }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{s.title}</h3>
                <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.5 }}>{s.desc}</p>
                <span
                  className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'oklch(0.78 0.17 75 / 0.16)', color: 'oklch(0.55 0.14 75)' }}
                >
                  <Sun size={10} /> incluído no Gold
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-5">
          <button
            onClick={() => openSchedule()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
          >
            <CalendarCheck size={16} /> Continuar agendamento
          </button>
        </div>
      </section>

      {/* ── Histórico ── */}
      <section className="dash-anim rounded-2xl p-5 md:p-6 bg-white" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.26s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Calendar size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Histórico
        </h2>
        <div className="space-y-1">
          {history.map((h, i) => {
            const st = statusStyle['Concluído']
            return (
              <div
                key={`${h.type}-${i}`}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl p-3 -mx-1 transition-colors hover:bg-[oklch(0.98_0.008_144)]"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'oklch(0.55 0.1 220 / 0.1)' }}>
                  <CheckCircle2 size={16} style={{ color: 'oklch(0.55 0.1 220)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-semibold text-[13px]" style={{ color: 'var(--color-frutificar-deep)' }}>{h.type}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                      Concluído
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>
                    {h.agro} <span style={{ color: 'oklch(0.8 0.02 144)' }}>·</span> {h.when}
                  </p>
                </div>
                <button
                  onClick={handleReport}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70 shrink-0"
                  style={{ color: 'var(--color-earth)' }}
                >
                  <FileText size={13} /> Ver relatório
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Agendar serviço */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <CalendarCheck size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Agendar serviço
            </DialogTitle>
            <DialogDescription>Escolha o serviço e o melhor horário para a visita.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSchedule} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Tipo de serviço</label>
              <select
                name="tipo"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              >
                {serviceTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Propriedade / Talhão</label>
              <select
                name="place"
                defaultValue={properties[0]}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              >
                {properties.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Data</label>
                <input
                  name="date"
                  type="date"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Horário</label>
                <input
                  name="time"
                  type="time"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Observações</label>
              <textarea
                name="obs"
                rows={3}
                placeholder="Detalhes da cultura, acessos, contato no local…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
                style={inputStyle}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button
                type="button"
                onClick={() => setScheduleOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}
              >
                Solicitar agendamento
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancelar agendamento */}
      <Dialog open={cancelTarget !== null} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.6 0.18 25 / 0.1)' }}>
              <Trash2 size={20} style={{ color: 'oklch(0.6 0.18 25)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>Cancelar este agendamento?</DialogTitle>
            <DialogDescription>
              {cancelTarget ? <><strong>{cancelTarget.title}</strong> — {cancelTarget.when}. Esta ação não pode ser desfeita.</> : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button
              onClick={() => setCancelTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}
            >
              Manter agendamento
            </button>
            <button
              onClick={handleConfirmCancel}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.6_0.18_25_/_0.06)]"
              style={{ color: 'oklch(0.6 0.18 25)', border: '1px solid oklch(0.6 0.18 25 / 0.35)' }}
            >
              Confirmar cancelamento
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhes do agendamento */}
      <Dialog open={detailTarget !== null} onOpenChange={(o) => !o && setDetailTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <CalendarCheck size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Detalhes do agendamento
            </DialogTitle>
            <DialogDescription>Informações completas do atendimento.</DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-3 rounded-xl p-4" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>Tipo</span>
                <span className="text-sm font-bold text-right" style={{ color: 'var(--color-frutificar-deep)' }}>{detailTarget.title}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}><User size={12} /> Agrônomo</span>
                <span className="text-sm font-medium text-right" style={{ color: 'var(--color-frutificar-deep)' }}>{detailTarget.agro}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}><Clock size={12} /> Data</span>
                <span className="text-sm font-medium text-right" style={{ color: 'var(--color-frutificar-deep)' }}>{detailTarget.when}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'oklch(0.55 0.04 144)' }}><MapPin size={12} /> Local</span>
                <span className="text-sm font-medium text-right" style={{ color: 'var(--color-frutificar-deep)' }}>{detailTarget.place}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>Status</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: statusStyle[detailTarget.status].bg, color: statusStyle[detailTarget.status].color }}
                >
                  {detailTarget.status}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="pt-1">
            <button
              onClick={() => setDetailTarget(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
