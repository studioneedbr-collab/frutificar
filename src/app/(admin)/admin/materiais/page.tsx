import { Plus, Download, FileText, Table2, File, MoreHorizontal } from 'lucide-react'

const materials = [
  { title: 'Planilha de Controle de Pragas — Cafeeiro', type: 'SPREADSHEET', plan: 'PREMIUM', downloads: 523, size: '1.2 MB', date: '01 jun 2026' },
  { title: 'Guia de Adubação para Culturas Tropicais',  type: 'PDF',         plan: 'ESSENCIAL', downloads: 1240, size: '3.8 MB', date: '15 mai 2026' },
  { title: 'Modelo de Contrato de Parceria Rural',       type: 'DOC',         plan: 'PREMIUM', downloads: 312, size: '0.8 MB', date: '10 mai 2026' },
  { title: 'Planilha de Fluxo de Caixa Agrícola',       type: 'SPREADSHEET', plan: 'GOLD',    downloads: 198, size: '2.1 MB', date: '05 mai 2026' },
  { title: 'Manual de Boas Práticas — Cafeicultura',    type: 'PDF',         plan: 'ESSENCIAL', downloads: 891, size: '5.4 MB', date: '28 abr 2026' },
  { title: 'Formulário de Análise de Solo',             type: 'DOC',         plan: 'PREMIUM', downloads: 156, size: '0.5 MB', date: '20 abr 2026' },
]

const typeIcon: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  PDF:        { icon: FileText, color: 'oklch(0.52 0.18 27)',  bg: 'oklch(0.95 0.04 27)' },
  SPREADSHEET:{ icon: Table2,   color: 'oklch(0.48 0.13 144)', bg: 'oklch(0.48 0.13 144 / 0.1)' },
  DOC:        { icon: File,     color: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)' },
}
const planStyle: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}

export default function AdminMateriaisPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)', letterSpacing: '-0.03em' }}>Materiais</h1>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.52 0.04 144)' }}>Planilhas, PDFs e documentos para download</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-85"
          style={{ background: 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)' }}>
          <Plus size={15} /> Novo material
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid oklch(0.91 0.01 144)' }}>
        <div className="grid gap-4 px-5 py-3 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'oklch(0.6 0.03 144)', borderBottom: '1px solid oklch(0.93 0.005 144)', gridTemplateColumns: '2.5fr 0.8fr 0.8fr 1fr 0.8fr auto' }}>
          <span>Material</span><span>Tipo</span><span>Plano</span><span>Downloads</span><span>Tamanho</span><span />
        </div>
        <div className="divide-y" style={{ borderColor: 'oklch(0.96 0.005 144)' }}>
          {materials.map((m) => {
            const t = typeIcon[m.type]; const plan = planStyle[m.plan]; const Icon = t.icon
            return (
              <div key={m.title} className="grid gap-4 px-5 py-4 items-center hover:bg-[oklch(0.985_0_0)] transition-colors"
                style={{ gridTemplateColumns: '2.5fr 0.8fr 0.8fr 1fr 0.8fr auto' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.bg }}>
                    <Icon size={16} style={{ color: t.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{m.title}</p>
                    <p className="text-xs" style={{ color: 'oklch(0.6 0.02 144)' }}>{m.date}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold" style={{ color: t.color }}>{m.type}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full w-fit" style={{ background: plan.bg, color: plan.text }}>{m.plan}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-frutificar-green)' }}>
                  <Download size={11} />{m.downloads.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs" style={{ color: 'oklch(0.58 0.03 144)' }}>{m.size}</span>
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
