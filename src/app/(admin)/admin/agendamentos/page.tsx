import { Calendar, MapPin, Circle, MoreHorizontal } from 'lucide-react'

const visits = [
  { user: 'João Carlos Silva',    property: 'Fazenda Santa Cruz',    reason: 'Diagnóstico de pragas no cafezal',         date: '18 jun 2026', status: 'CONFIRMED' },
  { user: 'Maria Aparecida Costa',property: 'Sítio Boa Esperança',   reason: 'Análise de solo — talhão norte',           date: '20 jun 2026', status: 'REQUESTED' },
  { user: 'Pedro Henrique Souza', property: 'Chácara São José',      reason: 'Consultoria pós-colheita café',            date: '22 jun 2026', status: 'CONFIRMED' },
  { user: 'Roberto Santos Neto',  property: 'Fazenda Três Marias',   reason: 'Avaliação de sistema de irrigação',        date: '25 jun 2026', status: 'REQUESTED' },
  { user: 'Carlos Eduardo Rocha', property: 'Sítio Verde Vale',      reason: 'Planejamento de adubação orgânica',        date: '28 jun 2026', status: 'CONFIRMED' },
  { user: 'Ana Beatriz Lima',     property: 'Fazenda Serra Alta',    reason: 'Instalação de armadilhas monitoramento',   date: '05 jun 2026', status: 'COMPLETED' },
  { user: 'Marcos Antônio Prado', property: 'Chácara Boa Vista',    reason: 'Revisão de poda — variedade Catuaí',       date: '02 jun 2026', status: 'CANCELED' },
]

const statusStyle: Record<string, { dot: string; label: string; text: string; bg: string }> = {
  REQUESTED:  { dot: 'oklch(0.55 0.1 220)',  label: 'Solicitado',  text: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)' },
  CONFIRMED:  { dot: 'oklch(0.62 0.12 55)',  label: 'Confirmado',  text: 'oklch(0.44 0.12 55)',  bg: 'oklch(0.62 0.12 55 / 0.1)' },
  COMPLETED:  { dot: 'oklch(0.55 0.14 144)', label: 'Realizado',   text: 'oklch(0.38 0.1 144)',  bg: 'oklch(0.48 0.13 144 / 0.1)' },
  CANCELED:   { dot: 'oklch(0.6 0.1 27)',    label: 'Cancelado',   text: 'oklch(0.45 0.1 27)',   bg: 'oklch(0.95 0.03 27)' },
}

const summary = [
  { label: 'Solicitados',  value: '2', color: 'oklch(0.55 0.1 220)' },
  { label: 'Confirmados',  value: '3', color: 'oklch(0.62 0.12 55)' },
  { label: 'Realizados',   value: '1', color: 'oklch(0.55 0.14 144)' },
  { label: 'Cancelados',   value: '1', color: 'oklch(0.6 0.1 27)' },
]

export default function AdminAgendamentosPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Agendamentos</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Visitas técnicas solicitadas pelos produtores</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
            <Circle size={8} fill={s.color} style={{ color: s.color, flexShrink: 0 }} />
            <div>
              <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.04em' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <div className="grid gap-3 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.93 0.005 144)', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto' }}>
          <span>Produtor</span><span>Motivo</span><span>Data</span><span>Status</span><span />
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {visits.map((v) => {
            const s = statusStyle[v.status]
            return (
              <div key={v.user+v.date} className="grid gap-3 px-5 py-4 items-start hover:bg-[oklch(0.985_0_0)] transition-colors"
                style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr auto' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{v.user}</p>
                  <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>
                    <MapPin size={10} />{v.property}
                  </span>
                </div>
                <p className="text-sm leading-snug" style={{ color: 'oklch(0.48 0.04 144)' }}>{v.reason}</p>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Calendar size={11} />{v.date}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold w-fit px-2 py-1 rounded-lg"
                  style={{ background: s.bg, color: s.text }}>
                  <Circle size={5} fill={s.dot} style={{ color: s.dot }} />{s.label}
                </span>
                <button className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.6 0.02 144)' }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
