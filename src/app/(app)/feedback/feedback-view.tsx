'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { MessageSquareHeart, Star, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { submitFeedback } from '@/server/actions/feedback'

const deep = 'var(--color-frutificar-deep)'
const green = 'var(--color-frutificar-green)'

export function FeedbackView({ preview }: { preview: boolean }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const msgRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const message = msgRef.current?.value.trim() ?? ''
    if (message.length < 3) {
      toast.error('Escreva seu feedback', { description: 'Conte o que achou da plataforma.' })
      return
    }
    if (preview) {
      setDone(true)
      toast.success('Feedback enviado (demo)')
      return
    }
    setSending(true)
    const res = await submitFeedback({ rating: rating || undefined, message })
    setSending(false)
    if (!res.ok) { toast.error(res.error); return }
    setDone(true)
    toast.success('Obrigado pelo seu feedback!')
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl bg-white p-10 text-center" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'oklch(0.48 0.13 144 / 0.1)' }}>
            <CheckCircle2 size={26} style={{ color: green }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: deep, fontFamily: 'var(--font-heading)' }}>Obrigado pelo seu feedback!</h1>
          <p className="mt-2 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>Sua opinião ajuda a melhorar a plataforma. Nossa equipe vai analisar com carinho.</p>
          <button onClick={() => { setDone(false); setRating(0); if (msgRef.current) msgRef.current.value = '' }}
            className="mt-5 text-sm font-bold px-4 py-2.5 rounded-xl" style={{ background: 'oklch(0.48 0.13 144 / 0.08)', color: green }}>
            Enviar outro feedback
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <header>
        <p className="text-[11px] font-bold tracking-wide mb-1.5" style={{ color: 'var(--color-earth)', letterSpacing: '0.08em' }}>SUA OPINIÃO IMPORTA</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: deep, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Enviar feedback</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'oklch(0.55 0.04 144)' }}>Conte o que você achou da plataforma — elogios, problemas ou sugestões. Chega direto para a nossa equipe.</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 md:p-6 space-y-5" style={{ border: '1px solid oklch(0.91 0.01 144)' }}>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: deep }}>Como você avalia a plataforma?</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hover || rating) >= n
              return (
                <button key={n} type="button" aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                  onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}
                  className="p-1 transition-transform hover:scale-110">
                  <Star size={30} style={{ color: active ? 'var(--color-earth)' : 'oklch(0.85 0.02 144)' }} fill={active ? 'var(--color-earth)' : 'none'} />
                </button>
              )
            })}
            {rating > 0 && <span className="ml-2 text-sm font-semibold" style={{ color: 'oklch(0.55 0.04 144)' }}>{rating}/5</span>}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: deep }}>
            <MessageSquareHeart size={16} style={{ color: green }} /> Seu feedback
          </label>
          <textarea ref={msgRef} rows={5} required
            placeholder="O que você mais gostou? O que pode melhorar? Sentiu falta de algo?"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[oklch(0.48_0.13_144_/_0.3)]"
            style={{ border: '1px solid oklch(0.91 0.01 144)', background: 'oklch(0.99 0.005 144)' }} />
        </div>

        <button type="submit" disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-70"
          style={{ background: green, boxShadow: '0 8px 24px oklch(0.48 0.13 144 / 0.3)' }}>
          {sending ? <><Loader2 size={15} className="animate-spin" /> Enviando…</> : <><Send size={15} /> Enviar feedback</>}
        </button>
      </form>
    </div>
  )
}
