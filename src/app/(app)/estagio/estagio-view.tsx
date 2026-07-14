'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sprout, Sparkles, MapPin, UserCheck, BookMarked, Send, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { SelectField } from '@/components/ui/field-controls'
import { requestService } from '@/server/actions/appointments'
import { areaOptions, ESTAGIO_PREFIX, type EstagioItem } from './data'

const beneficios = [
  { icon: MapPin, title: 'Vivência no campo', desc: 'Acompanhamento prático em propriedades reais.' },
  { icon: UserCheck, title: 'Supervisão de especialista', desc: 'Orientação direta de um profissional da Frutificar.' },
  { icon: BookMarked, title: 'Formação profissional', desc: 'Experiência que conta para sua carreira no agro.' },
]

const statusStyle: Record<string, { bg: string; text: string }> = {
  'Candidatura enviada': { bg: 'oklch(0.55 0.1 220 / 0.12)', text: 'oklch(0.4 0.1 220)' },
  'Em análise':          { bg: 'oklch(0.7 0.15 70 / 0.14)',  text: 'oklch(0.5 0.13 70)' },
  'Em andamento':        { bg: 'oklch(0.62 0.12 55 / 0.14)', text: 'oklch(0.44 0.12 55)' },
  'Concluído':           { bg: 'oklch(0.48 0.13 144 / 0.1)', text: 'var(--color-frutificar-green)' },
  'Encerrado':           { bg: 'oklch(0.6 0.1 27 / 0.12)',   text: 'oklch(0.45 0.1 27)' },
}

export function EstagioView({ initial, preview }: { initial: EstagioItem[]; preview: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState<EstagioItem[]>(initial)
  useEffect(() => { setItems(initial) }, [initial])

  const [area, setArea] = useState(areaOptions[0].value)
  const [sending, setSending] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const description = descRef.current?.value.trim() ?? ''
    if (description.length < 3) {
      toast.error('Conte um pouco sobre você', { description: 'Escreva seu interesse e disponibilidade.' })
      return
    }
    const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

    if (preview) {
      setItems((cur) => [{ id: `tmp-${cur.length}`, area, description, status: 'Candidatura enviada', data: hoje }, ...cur])
      if (descRef.current) descRef.current.value = ''
      toast.success('Candidatura enviada (demo)')
      return
    }

    setSending(true)
    const res = await requestService({ serviceType: `${ESTAGIO_PREFIX} — ${area}`, description })
    setSending(false)
    if (!res.ok) { toast.error(res.error); return }

    setItems((cur) => [{ id: res.data.id, area, description, status: 'Candidatura enviada', data: hoje }, ...cur])
    if (descRef.current) descRef.current.value = ''
    toast.success('Candidatura enviada', { description: 'Nossa equipe vai avaliar e entrar em contato.' })
    router.refresh()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-4">
      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .dash-anim { opacity: 0; animation: dashUp .6s cubic-bezier(.16,1,.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) { .dash-anim { animation: none !important; opacity: 1 !important; transform: none !important; } }
      `}</style>

      {/* Hero */}
      <section className="dash-anim relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: 'linear-gradient(150deg, var(--color-frutificar-night) 0%, oklch(0.24 0.09 144) 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.78 0.17 75 / 0.16) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full mb-3"
            style={{ background: 'oklch(0.78 0.17 75 / 0.18)', color: 'oklch(0.83 0.14 80)', letterSpacing: '0.04em' }}>
            <Sparkles size={12} /> EXCLUSIVO GOLD · ESTUDANTES
          </span>
          <h1 className="text-white font-bold text-2xl md:text-3xl" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            Estágio Supervisionado
          </h1>
          <p className="mt-2 text-sm max-w-xl" style={{ color: 'oklch(1 0 0 / 0.65)', lineHeight: 1.6 }}>
            Candidate-se ao estágio supervisionado da Frutificar: vivência prática no campo, com acompanhamento de um especialista para acelerar sua formação no agro.
          </p>
        </div>
      </section>

      {/* Benefícios */}
      <section className="dash-anim grid sm:grid-cols-3 gap-4" style={{ animationDelay: '0.06s' }}>
        {beneficios.map((b) => {
          const Icon = b.icon
          return (
            <div key={b.title} className="rounded-2xl bg-white p-5" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                <Icon size={18} style={{ color: 'var(--color-frutificar-green)' }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{b.title}</h3>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.55 }}>{b.desc}</p>
            </div>
          )
        })}
      </section>

      {/* Formulário */}
      <section className="dash-anim rounded-2xl bg-white p-5 md:p-6" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.12s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Sprout size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Candidatar-se ao estágio
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="est-area" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Área de interesse</label>
            <SelectField id="est-area" value={area} onValueChange={setArea} options={areaOptions} placeholder="Selecione a área" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-frutificar-deep)' }}>Sobre você</label>
            <textarea ref={descRef} rows={4}
              placeholder="Conte sua formação, experiência, disponibilidade e por que quer estagiar…"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
              style={{ border: '1px solid oklch(0.91 0.01 144)', background: 'oklch(0.99 0.005 144)' }} />
          </div>
          <button type="submit" disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-70"
            style={{ background: 'var(--color-frutificar-green)', boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
            {sending ? <><Loader2 size={15} className="animate-spin" /> Enviando…</> : <><Send size={15} /> Enviar candidatura</>}
          </button>
        </form>
      </section>

      {/* Minhas candidaturas */}
      <section className="dash-anim rounded-2xl bg-white p-5 md:p-6" style={{ border: '1px solid oklch(0.91 0.01 144)', animationDelay: '0.18s' }}>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--color-frutificar-deep)', fontFamily: 'var(--font-heading)' }}>
          <Clock size={18} style={{ color: 'var(--color-frutificar-green)' }} /> Minhas candidaturas
        </h2>
        {items.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-frutificar-deep)' }}>Nenhuma candidatura ainda</p>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.58 0.03 144)' }}>Envie sua primeira candidatura acima.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((r) => {
              const st = statusStyle[r.status] ?? statusStyle['Candidatura enviada']
              const done = r.status === 'Concluído'
              return (
                <div key={r.id} className="flex items-start gap-4 rounded-xl p-4" style={{ background: 'oklch(0.98 0.008 144)', border: '1px solid oklch(0.93 0.01 144)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.48 0.13 144 / 0.08)' }}>
                    {done ? <CheckCircle2 size={17} style={{ color: 'var(--color-frutificar-green)' }} /> : <Sprout size={17} style={{ color: 'var(--color-frutificar-green)' }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-frutificar-deep)' }}>{r.area}</h3>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'oklch(0.55 0.04 144)', lineHeight: 1.5 }}>{r.description}</p>
                    <p className="text-[11px] mt-1" style={{ color: 'oklch(0.62 0.02 144)' }}>{r.data}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: st.bg, color: st.text }}>{r.status}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
