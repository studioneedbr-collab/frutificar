import { Circle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const subs = [
  { name: 'João Carlos Silva',     plan: 'GOLD',      value: 'R$ 197',  status: 'ACTIVE',   renewal: '12 jul 2026',  gateway: 'Asaas #1234' },
  { name: 'Maria Aparecida Costa', plan: 'PREMIUM',   value: 'R$ 97',   status: 'ACTIVE',   renewal: '11 jul 2026',  gateway: 'Asaas #1235' },
  { name: 'Pedro Henrique Souza',  plan: 'ESSENCIAL', value: 'R$ 47',   status: 'ACTIVE',   renewal: '10 jul 2026',  gateway: 'Asaas #1236' },
  { name: 'Ana Beatriz Lima',      plan: 'GOLD',      value: 'R$ 197',  status: 'PAST_DUE', renewal: '09 jun 2026',  gateway: 'Asaas #1237' },
  { name: 'Carlos Eduardo Rocha',  plan: 'PREMIUM',   value: 'R$ 97',   status: 'ACTIVE',   renewal: '08 jul 2026',  gateway: 'Asaas #1238' },
  { name: 'Fernanda Oliveira',     plan: 'ESSENCIAL', value: 'R$ 47',   status: 'CANCELED', renewal: '—',            gateway: 'Asaas #1239' },
  { name: 'Roberto Santos Neto',   plan: 'GOLD',      value: 'R$ 197',  status: 'ACTIVE',   renewal: '06 jul 2026',  gateway: 'Asaas #1240' },
  { name: 'Marcos Antônio Prado',  plan: 'ESSENCIAL', value: 'R$ 47',   status: 'ACTIVE',   renewal: '04 jul 2026',  gateway: 'Asaas #1241' },
]

const planStyle: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}
const statusStyle: Record<string, { dot: string; label: string; text: string }> = {
  ACTIVE:   { dot: 'oklch(0.55 0.14 144)', label: 'Ativa',         text: 'oklch(0.38 0.1 144)' },
  PAST_DUE: { dot: 'oklch(0.7 0.15 55)',   label: 'Inadimplente',  text: 'oklch(0.5 0.12 55)' },
  CANCELED: { dot: 'oklch(0.6 0.1 27)',    label: 'Cancelada',     text: 'oklch(0.45 0.1 27)' },
}

const metrics = [
  { label: 'MRR',           value: 'R$ 38.420', trend: '+8%',  up: true },
  { label: 'Assinaturas',   value: '947',        trend: '+12', up: true },
  { label: 'Inadimplentes', value: '23',         trend: '+3',  up: false },
  { label: 'Churn mensal',  value: '2,4%',       trend: '-0.3%', up: true },
]

export default function AdminAssinaturasPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Assinaturas</h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Gestão de receita recorrente</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.58 0.03 144)' }}>{m.label}</span>
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: m.up ? 'oklch(0.48 0.13 144)' : 'oklch(0.52 0.18 27)' }}>
                {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{m.trend}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.04em' }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.005 144)' }}>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>Assinaturas ativas</h2>
          <div className="flex gap-2">
            {['Todas', 'GOLD', 'PREMIUM', 'ESSENCIAL'].map((f) => (
              <button key={f} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={f === 'Todas' ? { background: 'var(--color-frutificar-forest)', color: 'white' }
                  : { background: 'oklch(0.96 0.01 144)', color: 'oklch(0.52 0.04 144)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.95 0.005 144)', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
          <span>Assinante</span><span>Plano</span><span>Valor</span><span>Status</span><span>Renovação</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {subs.map((s) => {
            const plan = planStyle[s.plan]; const status = statusStyle[s.status]
            return (
              <div key={s.gateway} className="grid gap-4 px-5 py-3.5 items-center hover:bg-[oklch(0.985_0_0)] transition-colors"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--color-frutificar-forest)' }}>
                    {s.name.split(' ').slice(0,2).map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{s.name}</p>
                    <p className="text-[11px]" style={{ color: 'oklch(0.6 0.02 144)' }}>{s.gateway}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full w-fit" style={{ background: plan.bg, color: plan.text }}>{s.plan}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>{s.value}<span className="text-xs font-normal" style={{ color: 'oklch(0.58 0.03 144)' }}>/mês</span></span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: status.text }}>
                  <Circle size={6} fill={status.dot} style={{ color: status.dot }} />{status.label}
                </span>
                <span className="text-xs" style={{ color: 'oklch(0.62 0.02 144)' }}>{s.renewal}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
