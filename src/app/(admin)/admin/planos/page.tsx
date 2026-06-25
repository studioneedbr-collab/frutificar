import { Check, Users, TrendingUp } from 'lucide-react'

const plans = [
  {
    name: 'Essencial', price: 'R$ 47', period: '/mês', color: 'oklch(0.55 0.1 220)',
    subscribers: 412, revenue: 'R$ 19.364',
    features: ['Cursos principais', 'Lives semanais', 'Podcasts', 'Diagnóstico básico', '1 propriedade'],
  },
  {
    name: 'Premium', price: 'R$ 97', period: '/mês', color: 'oklch(0.62 0.12 55)',
    subscribers: 389, revenue: 'R$ 37.733',
    features: ['Tudo do Essencial', 'Chat com IA', 'Minicursos', 'Gestão da propriedade', 'Agendamento de visitas', 'Serviços técnicos', 'Até 3 propriedades'],
  },
  {
    name: 'Gold', price: 'R$ 197', period: '/mês', color: 'oklch(0.78 0.17 75)',
    subscribers: 146, revenue: 'R$ 28.762',
    features: ['Tudo do Premium', 'Dias de campo', 'Tutoria personalizada', 'Propriedades ilimitadas', 'Acesso antecipado a conteúdos', 'Suporte prioritário'],
  },
]

export default function AdminPlanosPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Planos</h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Configuração dos planos de assinatura da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div key={p.name} className="rounded-2xl p-6 flex flex-col" style={{ background: 'white', border: `2px solid ${p.color.replace(')', ' / 0.25)')}` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${p.color.replace(')', ' / 0.1)')}`, color: p.color }}>
                {p.name.toUpperCase()}
              </span>
              <button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'oklch(0.95 0.01 144)', color: 'oklch(0.48 0.04 144)' }}>
                Editar
              </button>
            </div>

            <div className="mb-5">
              <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.04em' }}>{p.price}</span>
              <span className="text-sm" style={{ color: 'oklch(0.58 0.03 144)' }}>{p.period}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl" style={{ background: 'oklch(0.975 0.005 144)' }}>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs mb-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>
                  <Users size={11} />Assinantes
                </div>
                <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>{p.subscribers}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xs mb-0.5" style={{ color: 'oklch(0.58 0.03 144)' }}>
                  <TrendingUp size={11} />MRR
                </div>
                <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>{p.revenue}</p>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'oklch(0.42 0.04 144)' }}>
                  <Check size={13} style={{ color: p.color, flexShrink: 0 }} strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <h2 className="font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>Resumo de receita</h2>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.name} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'oklch(0.975 0.005 144)' }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'oklch(0.52 0.04 144)' }}>{p.name} · {p.subscribers} assinantes</p>
                <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>{p.revenue}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
