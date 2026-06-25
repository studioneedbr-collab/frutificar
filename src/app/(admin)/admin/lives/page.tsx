import { Plus, Radio, Calendar, Clock, Eye } from 'lucide-react'

const lives = [
  { title: 'Colheita do Café: Técnicas Modernas',      plan: 'ESSENCIAL', status: 'SCHEDULED', date: '20 jun 2026', time: '19h00', viewers: 0,   ytId: 'dQw4w9WgXcQ' },
  { title: 'AO VIVO: Diagnóstico de Pragas em Tempo Real', plan: 'PREMIUM', status: 'LIVE',   date: '15 jun 2026', time: '15h30', viewers: 234, ytId: 'dQw4w9WgXcQ' },
  { title: 'Gestão de Custos na Propriedade Rural',    plan: 'ESSENCIAL', status: 'ENDED',    date: '10 jun 2026', time: '18h00', viewers: 412, ytId: 'dQw4w9WgXcQ' },
  { title: 'Adubação Verde: Como e Quando Usar',       plan: 'PREMIUM',   status: 'ENDED',    date: '05 jun 2026', time: '19h00', viewers: 318, ytId: 'dQw4w9WgXcQ' },
  { title: 'Mecanização Agrícola para Pequenos Prod.', plan: 'GOLD',      status: 'ENDED',    date: '01 jun 2026', time: '14h00', viewers: 156, ytId: 'dQw4w9WgXcQ' },
  { title: 'Irrigação por Gotejamento: Instalação',    plan: 'ESSENCIAL', status: 'SCHEDULED', date: '25 jun 2026', time: '10h00', viewers: 0,  ytId: '' },
]

const statusStyle: Record<string, { dot: string; label: string; text: string; bg: string }> = {
  LIVE:      { dot: 'oklch(0.6 0.2 27)',   label: 'Ao Vivo',   text: 'oklch(0.45 0.18 27)',  bg: 'oklch(0.95 0.04 27)' },
  SCHEDULED: { dot: 'oklch(0.55 0.1 220)', label: 'Agendada',  text: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)' },
  ENDED:     { dot: 'oklch(0.6 0.02 144)', label: 'Encerrada', text: 'oklch(0.52 0.04 144)', bg: 'oklch(0.94 0.01 144)' },
}
const planStyle: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}

export default function AdminLivesPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Lives</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{lives.filter(l=>l.status==='LIVE').length} ao vivo agora · {lives.filter(l=>l.status==='SCHEDULED').length} agendadas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Agendar live
        </button>
      </div>

      <div className="grid gap-4">
        {lives.map((l) => {
          const status = statusStyle[l.status]; const plan = planStyle[l.plan]
          return (
            <div key={l.title} className="rounded-2xl p-5 flex gap-4 items-center"
              style={{ background: 'white', border: `1px solid ${l.status === 'LIVE' ? 'oklch(0.7 0.15 27 / 0.4)' : 'oklch(0.91 0.01 144)'}` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: l.status === 'LIVE' ? 'oklch(0.6 0.2 27 / 0.12)' : 'oklch(0.48 0.13 144 / 0.08)' }}>
                <Radio size={18} style={{ color: l.status === 'LIVE' ? 'oklch(0.55 0.2 27)' : 'var(--color-frutificar-green)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.text }}>
                    {l.status === 'LIVE' && '● '}{status.label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: plan.bg, color: plan.text }}>{l.plan}</span>
                </div>
                <p className="font-semibold text-[14px]" style={{ color: 'var(--color-frutificar-deep)' }}>{l.title}</p>
              </div>
              <div className="flex items-center gap-6 text-xs flex-shrink-0">
                <span className="flex items-center gap-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Calendar size={12} />{l.date}
                </span>
                <span className="flex items-center gap-1.5" style={{ color: 'oklch(0.52 0.04 144)' }}>
                  <Clock size={12} />{l.time}
                </span>
                {l.viewers > 0 && (
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>
                    <Eye size={12} />{l.viewers}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
