import { Plus, Sun, MapPin, Calendar, Users, MoreHorizontal } from 'lucide-react'

const days = [
  { title: 'Dia de Campo: Manejo Integrado de Pragas',    location: 'Fazenda Modelo — Patrocínio/MG', date: '28 jun 2026', instructor: 'Dr. Felipe Moura',     capacity: 30, registered: 28 },
  { title: 'Demonstração: Colheitadeira de Café 2026',    location: 'Fazenda Cantagalo — Araxá/MG',   date: '12 jul 2026', instructor: 'Eng. Marcos Lima',     capacity: 20, registered: 15 },
  { title: 'Workshop: Certificação Orgânica na Prática',  location: 'EPAMIG — Lavras/MG',             date: '19 jul 2026', instructor: 'Dra. Sofia Alves',     capacity: 25, registered: 8 },
  { title: 'Dia de Campo: Sistemas Agroflorestais',       location: 'Sítio Ecológico — Poços/MG',     date: '02 ago 2026', instructor: 'Dr. Felipe Moura',     capacity: 40, registered: 22 },
  { title: 'Visita Técnica: Irrigação por Gotejamento',   location: 'Fazenda Boa Sorte — Uberaba/MG', date: '25 mai 2026', instructor: 'Eng. Carla Nogueira', capacity: 15, registered: 15 },
]

export default function AdminDiasDeCampoPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Dias de Campo</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Eventos presenciais exclusivos plano Gold</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo evento
        </button>
      </div>

      <div className="grid gap-4">
        {days.map((d) => {
          const pct = Math.round((d.registered / d.capacity) * 100)
          const full = d.registered >= d.capacity
          return (
            <div key={d.title} className="rounded-2xl p-5"
              style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'oklch(0.78 0.17 75 / 0.12)' }}>
                  <Sun size={20} style={{ color: 'oklch(0.62 0.15 75)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[15px] leading-snug" style={{ color: 'var(--color-frutificar-deep)' }}>{d.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={full
                          ? { background: 'oklch(0.55 0.14 144 / 0.12)', color: 'oklch(0.38 0.1 144)' }
                          : { background: 'oklch(0.78 0.17 75 / 0.12)', color: 'oklch(0.5 0.14 75)' }}>
                        {full ? 'Lotado' : `${d.capacity - d.registered} vagas`}
                      </span>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.6 0.02 144)' }}>
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      <Calendar size={11} />{d.date}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      <MapPin size={11} />{d.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      <Users size={11} />{d.instructor}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'oklch(0.93 0.01 144)' }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: full ? 'var(--color-frutificar-green)' : 'oklch(0.78 0.17 75)' }} />
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'oklch(0.52 0.04 144)' }}>
                      {d.registered}/{d.capacity} inscritos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
