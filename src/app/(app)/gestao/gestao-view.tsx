'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Table2, File, Download, FolderDown, Search } from 'lucide-react'
import type { Download as DownloadItem } from './data'

const typeIcon: Record<string, { icon: typeof FileText; color: string; bg: string; label: string }> = {
  PDF:         { icon: FileText, color: 'oklch(0.52 0.18 27)',  bg: 'oklch(0.95 0.04 27)',       label: 'PDF' },
  SPREADSHEET: { icon: Table2,   color: 'oklch(0.48 0.13 144)', bg: 'oklch(0.48 0.13 144 / 0.1)', label: 'Planilha' },
  DOC:         { icon: File,     color: 'oklch(0.4 0.1 220)',   bg: 'oklch(0.55 0.1 220 / 0.1)',  label: 'Documento' },
}
const fallbackType = { icon: File, color: 'oklch(0.5 0.03 144)', bg: 'oklch(0.94 0.01 144)', label: 'Arquivo' }

const planStyle: Record<string, { bg: string; text: string }> = {
  GOLD:      { bg: 'oklch(0.78 0.17 75 / 0.12)', text: 'oklch(0.5 0.14 75)' },
  PREMIUM:   { bg: 'oklch(0.62 0.12 55 / 0.12)', text: 'oklch(0.44 0.12 55)' },
  ESSENCIAL: { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
}

export function GestaoView({ downloads }: { downloads: DownloadItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return downloads
    return downloads.filter((d) => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
  }, [downloads, query])

  function handleDownload(d: DownloadItem, e: React.MouseEvent) {
    if (!d.url) {
      e.preventDefault()
      toast.info('Arquivo indisponível', { description: d.title })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @media (prefers-reduced-motion: reduce) { .dash-anim { animation: none !important; opacity: 1 !important; transform: none !important; } }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim">
        <p className="text-[11px] font-bold tracking-wide mb-1.5" style={{ color: 'var(--color-earth)', letterSpacing: '0.08em' }}>
          GESTÃO DA PROPRIEDADE
        </p>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Planilhas & Materiais
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>
          Baixe planilhas, modelos e guias para organizar a gestão da sua lavoura.
        </p>
      </header>

      {/* ── Busca ── */}
      <div className="dash-anim relative" style={{ animationDelay: '0.06s' }}>
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.6 0.03 144)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por planilha, modelo ou guia…"
          className="w-full rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
          style={{ border: '1px solid oklch(0.91 0.01 144)', background: 'white' }}
        />
      </div>

      {/* ── Lista de downloads ── */}
      {filtered.length === 0 ? (
        <div className="dash-anim rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <FolderDown size={22} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>
            {query ? 'Nada encontrado para sua busca' : 'Nenhum material disponível ainda'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.58 0.03 144)' }}>
            {query ? 'Tente outro termo.' : 'Novos materiais aparecem aqui assim que forem publicados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d, i) => {
            const t = typeIcon[d.category] ?? fallbackType
            const Icon = t.icon
            const plan = planStyle[d.plan]
            return (
              <div
                key={d.id}
                className="dash-anim dash-lift rounded-2xl bg-white p-5 flex items-start gap-4"
                style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: `${0.08 + i * 0.05}s` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg }}>
                  <Icon size={22} style={{ color: t.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{d.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                    {plan && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: plan.bg, color: plan.text }}>{d.plan}</span>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-xs mt-1.5" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.6 }}>{d.description}</p>
                  )}
                  <a
                    href={d.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleDownload(d, e)}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-lg transition-opacity hover:opacity-85"
                    style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
                  >
                    <Download size={14} /> Baixar
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
