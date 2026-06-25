import { Wrench, Circle, MoreHorizontal, MessageSquare } from 'lucide-react'

const services = [
  { user: 'João Carlos Silva',    type: 'Análise de Solo',           desc: 'Análise completa NPK + micronutrientes para talhão sul',          status: 'IN_PROGRESS', date: '12 jun 2026' },
  { user: 'Maria Aparecida Costa',type: 'Consultoria Fitossanitária', desc: 'Identificação e controle de broca-do-café no lote 3',             status: 'OPEN',        date: '11 jun 2026' },
  { user: 'Pedro Henrique Souza', type: 'Laudo Técnico',             desc: 'Laudo para financiamento bancário — Pronaf Mais Alimentos',       status: 'COMPLETED',   date: '10 jun 2026' },
  { user: 'Roberto Santos Neto',  type: 'Projeto de Irrigação',      desc: 'Dimensionamento de sistema gotejamento — área 12ha',             status: 'IN_ANALYSIS', date: '09 jun 2026' },
  { user: 'Carlos Eduardo Rocha', type: 'Análise de Solo',           desc: 'Segunda análise semestral — comparativo com laudo anterior',      status: 'OPEN',        date: '08 jun 2026' },
  { user: 'Marcos Antônio Prado', type: 'Consultoria Fitossanitária', desc: 'Avaliação de ataque de cigarrinha — tratamento preventivo',      status: 'COMPLETED',   date: '05 jun 2026' },
]

const statusStyle: Record<string, { dot: string; label: string; text: string; bg: string }> = {
  OPEN:        { dot: 'oklch(0.55 0.1 220)',  label: 'Aberto',       text: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)' },
  IN_ANALYSIS: { dot: 'oklch(0.7 0.15 55)',   label: 'Em análise',   text: 'oklch(0.5 0.12 55)',   bg: 'oklch(0.62 0.12 55 / 0.1)' },
  IN_PROGRESS: { dot: 'oklch(0.62 0.12 55)',  label: 'Em andamento', text: 'oklch(0.44 0.12 55)',  bg: 'oklch(0.78 0.17 75 / 0.1)' },
  COMPLETED:   { dot: 'oklch(0.55 0.14 144)', label: 'Concluído',    text: 'oklch(0.38 0.1 144)',  bg: 'oklch(0.48 0.13 144 / 0.1)' },
  CANCELED:    { dot: 'oklch(0.6 0.1 27)',    label: 'Cancelado',    text: 'oklch(0.45 0.1 27)',   bg: 'oklch(0.95 0.03 27)' },
}

export default function AdminServicosPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Serviços</h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Solicitações de serviços técnicos dos produtores</p>
      </div>

      <div className="grid gap-4">
        {services.map((s) => {
          const st = statusStyle[s.status]
          return (
            <div key={s.user+s.date} className="rounded-2xl p-5 flex gap-4 items-start"
              style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                <Wrench size={16} style={{ color: 'var(--color-frutificar-green)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <span className="text-[11px] font-bold" style={{ color: 'oklch(0.58 0.03 144)' }}>{s.type}</span>
                    <p className="font-semibold text-[14px] leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>{s.user}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: st.bg, color: st.text }}>
                      <Circle size={5} fill={st.dot} style={{ color: st.dot }} />{st.label}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.6 0.02 144)' }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: 'oklch(0.48 0.04 144)', lineHeight: 1.5 }}>{s.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'oklch(0.62 0.02 144)' }}>Solicitado em {s.date}</span>
                  <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}>
                    <MessageSquare size={12} /> Responder
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
