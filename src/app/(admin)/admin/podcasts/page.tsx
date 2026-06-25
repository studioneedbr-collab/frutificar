import { Plus, Mic2, MoreHorizontal, Play } from 'lucide-react'

const podcasts = [
  {
    name: 'Campo em Foco', cover: '#2d7a3e', episodes: 24,
    eps: [
      { title: 'Como aumentar a produtividade sem aumentar custos', dur: '42min', date: '10 jun 2026', plays: 1240 },
      { title: 'Tecnologia no campo: IoT e sensores para o produtor rural', dur: '38min', date: '03 jun 2026', plays: 980 },
      { title: 'Crédito rural: o que você precisa saber antes de assinar', dur: '51min', date: '27 mai 2026', plays: 1120 },
    ]
  },
  {
    name: 'Café com Agro', cover: '#8B5E3C', episodes: 11,
    eps: [
      { title: 'A safra do café especial: tendências 2026', dur: '35min', date: '08 jun 2026', plays: 620 },
      { title: 'Rastreabilidade do café da origem ao consumidor', dur: '44min', date: '01 jun 2026', plays: 540 },
    ]
  },
]

export default function AdminPodcastsPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Podcasts</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>{podcasts.length} programas · {podcasts.reduce((a,p)=>a+p.episodes,0)} episódios</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo episódio
        </button>
      </div>

      <div className="space-y-6">
        {podcasts.map((p) => (
          <div key={p.name} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
            <div className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'oklch(0.93 0.005 144)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: p.cover }}>
                <Mic2 size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-[15px]" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.02em' }}>{p.name}</h2>
                <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{p.episodes} episódios publicados</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}>
                <Plus size={12} /> Episódio
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
              {p.eps.map((ep) => (
                <div key={ep.title} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[oklch(0.985_0_0)] transition-colors">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
                    <Play size={13} style={{ color: 'var(--color-frutificar-green)' }} fill="currentColor" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{ep.title}</p>
                    <p className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{ep.date} · {ep.dur}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs flex-shrink-0">
                    <span className="font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>{ep.plays.toLocaleString('pt-BR')} plays</span>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: 'oklch(0.6 0.02 144)' }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
