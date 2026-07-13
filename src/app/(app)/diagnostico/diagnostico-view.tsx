'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Leaf, Microscope, FlaskConical, Upload, Sparkles,
  CheckCircle2, FileText, ArrowRight, Calendar, Paperclip, Loader2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { SelectField } from '@/components/ui/field-controls'
import { gerarLaudoSolo } from '@/lib/reports'
import { analyzeSoilReport } from '@/server/actions/diagnostics'
import type { HistoricoItem, TalhaoOption, DiagnosticResult } from './data'

const howItWorks = [
  { n: '01', icon: Upload, title: 'Envie a análise', desc: 'Suba o laudo do laboratório em PDF ou foto.' },
  { n: '02', icon: Sparkles, title: 'A IA analisa', desc: 'Interpreta cada parâmetro do seu solo.' },
  { n: '03', icon: CheckCircle2, title: 'Plano pronto', desc: 'Receba correção e adubação por talhão.' },
]

const statusColor: Record<string, string> = {
  ok: 'var(--color-frutificar-green)',
  attention: 'oklch(0.7 0.15 70)',
  low: 'oklch(0.6 0.18 25)',
}
const statusBg: Record<string, string> = {
  ok: 'oklch(0.48 0.13 144 / 0.1)',
  attention: 'oklch(0.7 0.15 70 / 0.14)',
  low: 'oklch(0.6 0.18 25 / 0.12)',
}
const statusText: Record<string, string> = {
  ok: 'var(--color-frutificar-green)',
  attention: 'oklch(0.5 0.13 70)',
  low: 'oklch(0.5 0.18 25)',
}

const inputStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}

const tipoOptions = [
  { value: 'Completa', label: 'Completa' },
  { value: 'Fertilidade', label: 'Fertilidade' },
  { value: 'Foliar', label: 'Foliar' },
]

const MAX_BYTES = 15 * 1024 * 1024

export function DiagnosticoView({
  initialHistorico, talhaoOptions, initialResult, preview,
}: {
  initialHistorico: HistoricoItem[]
  talhaoOptions: TalhaoOption[]
  initialResult: DiagnosticResult | null
  preview: boolean
}) {
  const router = useRouter()
  const [historico, setHistorico] = useState<HistoricoItem[]>(initialHistorico)
  const [result, setResult] = useState<DiagnosticResult | null>(initialResult)

  // Reconcilia com os dados do servidor após cada router.refresh() (modo real).
  useEffect(() => { setHistorico(initialHistorico) }, [initialHistorico])
  useEffect(() => { setResult(initialResult) }, [initialResult])

  const firstTalhao = talhaoOptions[0]?.value ?? ''
  const [selectedTalhao, setSelectedTalhao] = useState(firstTalhao)
  const [novoOpen, setNovoOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [detalhe, setDetalhe] = useState<HistoricoItem | null>(null)
  const [modalTalhao, setModalTalhao] = useState(firstTalhao)
  const [modalTipo, setModalTipo] = useState('Completa')
  const obsRef = useRef<HTMLTextAreaElement>(null)

  const labelOf = (value: string) =>
    talhaoOptions.find((o) => o.value === value)?.label ?? value

  function onPickFile(f: File | undefined) {
    if (!f) { setFile(null); return }
    if (f.size > MAX_BYTES) {
      toast.error('Arquivo muito grande', { description: 'O limite é 15MB.' })
      return
    }
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const talhaoValue = modalTalhao || selectedTalhao
    const talhaoLabel = labelOf(talhaoValue)
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

    if (!file) {
      toast.error('Anexe o laudo', { description: 'Envie uma foto nítida ou o PDF do laboratório.' })
      return
    }

    // Modo demo: sem IA/banco, apenas simula.
    if (preview) {
      setHistorico((cur) => [{ talhao: talhaoLabel, data: hoje, status: 'Concluído' }, ...cur])
      setNovoOpen(false)
      setFile(null)
      toast.success('Análise concluída (demo)', { description: 'Conecte o banco + OpenAI para a IA real.' })
      return
    }

    setAnalyzing(true)
    const fd = new FormData()
    fd.set('plotId', talhaoValue)
    fd.set('analysisType', modalTipo || 'Completa')
    fd.set('observacoes', obsRef.current?.value ?? '')
    fd.set('file', file)

    const res = await analyzeSoilReport(fd)
    setAnalyzing(false)

    if (!res.ok) {
      toast.error(res.error)
      return
    }

    setResult({
      id: res.data.id,
      talhao: talhaoLabel,
      data: hoje,
      ph: res.data.ph,
      params: res.data.params,
      recommendations: res.data.recommendations,
      summary: res.data.summary,
      fileUrl: res.data.fileUrl,
    })
    setHistorico((cur) => [{ id: res.data.id, talhao: talhaoLabel, data: hoje, status: 'Concluído' }, ...cur])
    setNovoOpen(false)
    setFile(null)
    toast.success('Diagnóstico pronto', { description: 'A IA leu o laudo e gerou seu plano.' })
    router.refresh()
  }

  function openNovo() {
    setFile(null)
    setModalTalhao(selectedTalhao)
    setModalTipo('Completa')
    setNovoOpen(true)
  }

  function baixarLaudo() {
    if (!result) return
    gerarLaudoSolo({
      talhao: result.talhao,
      data: result.data,
      ph: result.ph != null ? String(result.ph).replace('.', ',') : '—',
      parametros: result.params.map((p) => ({ nome: p.label, valor: p.value, status: p.tag })),
      recomendacoes: result.recommendations,
    })
    toast.success('Laudo gerado', { description: 'O PDF foi baixado no seu dispositivo.' })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        .dash-lift { transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s, border-color .25s; }
        .dash-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 36px oklch(0.16 0.07 152 / 0.1); }
        @keyframes barGrow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .bar-fill { transform-origin: left; animation: barGrow 1s cubic-bezier(.16,1,.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .dash-anim, .bar-fill { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="dash-anim">
        <span className="text-xs font-bold tracking-widest block mb-2" style={{ color: 'var(--color-earth)' }}>
          ANÁLISE COM IA
        </span>
        <h1
          className="text-2xl md:text-3xl font-bold"
          style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Diagnóstico de{' '}
          <span className="italic" style={{ color: 'var(--color-frutificar-green)', fontFamily: 'var(--font-display)' }}>
            Solo
          </span>
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.52 0.04 144)' }}>
          Envie a foto ou o PDF da sua análise de solo e a IA gera um plano de adubação e correção para cada talhão.
        </p>
      </header>

      {/* ── TOP CTA — Novo diagnóstico ── */}
      <section
        className="dash-anim relative overflow-hidden rounded-2xl p-6 md:p-7"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.24 0.09 144) 100%)', animationDelay: '0.05s' }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.62 0.12 55 / 0.18) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'oklch(0.62 0.12 55 / 0.18)', border: '1px solid oklch(1 0 0 / 0.1)' }}
            >
              <Sparkles size={18} style={{ color: 'oklch(0.78 0.14 75)' }} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                Novo diagnóstico
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'oklch(1 0 0 / 0.6)', lineHeight: 1.6 }}>
                Selecione o talhão e envie a análise. A IA devolve o plano em segundos.
              </p>
              {/* talhão selector chips */}
              <div className="flex flex-wrap gap-2 mt-3.5">
                {talhaoOptions.map((t) => {
                  const active = t.value === selectedTalhao
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSelectedTalhao(t.value)}
                      aria-pressed={active}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-[1.04] active:scale-[0.97] cursor-pointer"
                      style={active
                        ? { background: 'oklch(0.62 0.12 55 / 0.22)', border: '1px solid oklch(0.78 0.14 75 / 0.4)', color: 'oklch(0.83 0.08 144)' }
                        : { background: 'oklch(1 0 0 / 0.06)', border: '1px solid oklch(1 0 0 / 0.12)', color: 'oklch(1 0 0 / 0.65)' }}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <button
            onClick={openNovo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold text-sm shrink-0 transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.4)' }}
          >
            <Upload size={16} /> Enviar análise de solo
          </button>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section
        className="dash-anim rounded-2xl p-5 md:p-6 bg-white"
        style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.1s' }}
      >
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          Como funciona
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {howItWorks.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.n} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}
                >
                  <Icon size={18} style={{ color: 'var(--color-frutificar-green)' }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-earth)' }}>{s.n}</span>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{s.title}</h3>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{s.desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <ArrowRight size={16} className="hidden sm:block ml-auto shrink-0" style={{ color: 'oklch(0.78 0.02 144)' }} />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── RESULT — Último diagnóstico ── */}
      {result ? (
        <section
          className="dash-anim rounded-2xl p-5 md:p-6 bg-white"
          style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.16s' }}
        >
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <Microscope size={18} style={{ color: 'var(--color-frutificar-green)' }} />
              Último diagnóstico — {result.talhao}
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }}
              >
                <CheckCircle2 size={11} /> Concluído
              </span>
              <span className="text-xs hidden sm:block" style={{ color: 'oklch(0.55 0.04 144)' }}>{result.data}</span>
            </div>
          </div>

          {/* soil parameters as horizontal bars */}
          {result.params.length > 0 && (
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              {result.params.map((p, i) => (
                <div key={p.label + i}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{p.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>{p.value}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: statusBg[p.status] ?? statusBg.attention, color: statusText[p.status] ?? statusText.attention }}
                      >
                        {p.tag}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.94 0.01 144)' }}>
                    <div
                      className="bar-fill h-full rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, p.pct))}%`,
                        background: statusColor[p.status] ?? statusColor.attention,
                        animationDelay: `${0.2 + i * 0.05}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recomendação da IA */}
          <div
            className="mt-6 rounded-xl p-5"
            style={{ background: 'linear-gradient(150deg, oklch(0.48 0.13 144 / 0.06), oklch(0.62 0.12 55 / 0.05))', border: '1px solid oklch(0.91 0.01 144)' }}
          >
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.62 0.12 55 / 0.12)' }}>
                <FlaskConical size={17} style={{ color: 'var(--color-earth)' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
                  Recomendação da IA
                </h3>
                <p className="text-xs" style={{ color: 'oklch(0.55 0.04 144)' }}>
                  {result.summary || 'Plano de correção e adubação · Café'}
                </p>
              </div>
            </div>
            <ul className="space-y-2.5 mb-5">
              {result.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px]">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--color-frutificar-green)' }} />
                  <span style={{ color: 'oklch(0.4 0.04 144)', lineHeight: 1.55 }}>{r}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={baixarLaudo}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-85"
              style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: 'var(--color-frutificar-green)' }}
            >
              <FileText size={15} /> Baixar laudo (PDF)
            </button>
          </div>
        </section>
      ) : (
        <section
          className="dash-anim rounded-2xl p-10 bg-white text-center"
          style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.16s' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
            <Microscope size={22} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>Nenhum diagnóstico ainda</p>
          <p className="text-xs mt-1" style={{ color: 'oklch(0.58 0.03 144)' }}>
            Envie a foto ou o PDF do seu laudo de solo — a IA gera o plano na hora.
          </p>
        </section>
      )}

      {/* ── Histórico de diagnósticos ── */}
      {historico.length > 0 && (
        <section
          className="dash-anim rounded-2xl p-5 md:p-6 bg-white"
          style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.22s' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
              <Leaf size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Histórico de diagnósticos
            </h2>
          </div>
          <div className="space-y-2.5">
            {historico.map((h) => {
              const concluido = h.status === 'Concluído'
              return (
                <div
                  key={h.id ?? h.talhao + h.data}
                  className="dash-lift flex items-center gap-4 rounded-xl p-4"
                  style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                    <Microscope size={17} style={{ color: 'var(--color-frutificar-green)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-frutificar-deep)' }}>{h.talhao}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 144)' }}>{h.data}</p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={concluido
                      ? { background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }
                      : { background: 'oklch(0.7 0.15 70 / 0.14)', color: 'oklch(0.5 0.13 70)' }}
                  >
                    {h.status}
                  </span>
                  <button
                    onClick={() => setDetalhe(h)}
                    aria-label={`Ver diagnóstico do ${h.talhao}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-[oklch(0.48_0.13_144_/_0.08)]"
                  >
                    <ArrowRight size={16} style={{ color: 'oklch(0.55 0.04 144)' }} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════ MODAIS ═══════════ */}

      {/* Novo diagnóstico — enviar análise */}
      <Dialog open={novoOpen} onOpenChange={(o) => { if (!analyzing) setNovoOpen(o) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              <Upload size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Enviar análise de solo
            </DialogTitle>
            <DialogDescription>Selecione o talhão e envie o laudo (foto ou PDF). A IA lê e devolve o plano em segundos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="diag-talhao" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Talhão</label>
              <SelectField
                id="diag-talhao"
                value={modalTalhao}
                onValueChange={(val) => setModalTalhao(val)}
                options={talhaoOptions}
                placeholder="Selecione o talhão"
              />
            </div>
            <div>
              <label htmlFor="diag-tipo" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Tipo de análise</label>
              <SelectField
                id="diag-tipo"
                value={modalTipo}
                onValueChange={(val) => setModalTipo(val)}
                options={tipoOptions}
                placeholder="Selecione o tipo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Arquivo da análise</label>
              <label
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-[oklch(0.97_0.008_144)]"
                style={inputStyle}
              >
                <Paperclip size={15} style={{ color: 'var(--color-earth)', flexShrink: 0 }} />
                <span className="truncate" style={{ color: file ? 'var(--color-frutificar-deep)' : 'oklch(0.6 0.04 144)' }}>
                  {file?.name || 'Selecionar PDF ou foto (JPG, PNG)…'}
                </span>
                <input
                  name="arquivo"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Observações</label>
              <textarea ref={obsRef} name="observacoes" rows={3} placeholder="Cultura, histórico de adubação, observações de campo…"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]" style={inputStyle} />
            </div>
            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <button type="button" disabled={analyzing} onClick={() => setNovoOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-[oklch(0.96_0.01_144)] disabled:opacity-50"
                style={{ color: 'oklch(0.45 0.04 144)', border: '1px solid oklch(0.91 0.01 144)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={analyzing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-70"
                style={{ background: 'var(--color-earth)', boxShadow: '0 8px 24px oklch(0.62 0.12 55 / 0.35)' }}>
                {analyzing ? <><Loader2 size={15} className="animate-spin" /> Analisando com IA…</> : <><Upload size={15} /> Enviar análise</>}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detalhe do diagnóstico */}
      <Dialog open={detalhe !== null} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-1" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
              <Microscope size={20} style={{ color: 'var(--color-frutificar-green)' }} />
            </div>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-frutificar-deep)' }}>
              Diagnóstico — {detalhe?.talhao}
            </DialogTitle>
            <DialogDescription>Resumo do diagnóstico de solo selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
              <Leaf size={16} style={{ color: 'var(--color-frutificar-green)', flexShrink: 0 }} />
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>Talhão</span>
              <span className="ml-auto text-sm font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>{detalhe?.talhao}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
              <Calendar size={16} style={{ color: 'var(--color-earth)', flexShrink: 0 }} />
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>Data</span>
              <span className="ml-auto text-sm font-bold" style={{ color: 'var(--color-frutificar-deep)' }}>{detalhe?.data}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--color-frutificar-green)', flexShrink: 0 }} />
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>Status</span>
              <span
                className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={detalhe?.status === 'Concluído'
                  ? { background: 'oklch(0.48 0.13 144 / 0.1)', color: 'var(--color-frutificar-green)' }
                  : { background: 'oklch(0.7 0.15 70 / 0.14)', color: 'oklch(0.5 0.13 70)' }}
              >
                {detalhe?.status}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2 pt-1">
            <button onClick={() => setDetalhe(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
