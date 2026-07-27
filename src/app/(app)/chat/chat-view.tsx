'use client'

import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Sprout, Bot, Send, User } from 'lucide-react'

/* ── Design tokens ─────────────────────────────────────────────────── */
const T = {
  deep: 'oklch(0.24 0.09 144)',
  green: 'oklch(0.48 0.13 144)',
  forest: 'oklch(0.36 0.11 144)',
  earth: 'oklch(0.62 0.12 55)',
  night: 'oklch(0.16 0.07 152)',
  muted: 'oklch(0.55 0.04 144)',
  border: 'oklch(0.91 0.01 144)',
  lightBg: 'oklch(0.98 0.008 144)',
  heading: 'var(--font-heading)',
} as const

type Role = 'user' | 'assistant'
interface Msg {
  id: number
  role: Role
  content: string
}

const SUGGESTIONS = [
  'Como controlar a ferrugem do café?',
  'Qual a melhor época de calagem?',
  'Quanto de NPK na florada?',
  'Como precificar a saca?',
]

const GREETING =
  'Olá! Sou o Assistente Agrícola da Frutificar. Posso te ajudar com manejo de pragas, correção e adubação de solo, irrigação, colheita e comercialização do café. Como posso ajudar na sua lavoura hoje?'

const INITIAL_SEED: Msg[] = [{ id: 0, role: 'assistant', content: GREETING }]

/* ── Subcomponentes ─────────────────────────────────────────────────── */
function AssistantAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${T.green}, ${T.forest})`,
        boxShadow: '0 4px 12px oklch(0.36 0.11 144 / 0.35)',
      }}
    >
      <Sprout size={size * 0.5} />
    </div>
  )
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <AssistantAvatar size={32} />}
      <div
        className="max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={
          isUser
            ? {
                background: `linear-gradient(135deg, ${T.earth}, ${T.green})`,
                color: 'white',
                borderBottomRightRadius: '0.375rem',
                boxShadow: '0 6px 18px oklch(0.62 0.12 55 / 0.28)',
              }
            : {
                background: T.lightBg,
                color: T.deep,
                border: `1px solid ${T.border}`,
                borderBottomLeftRadius: '0.375rem',
              }
        }
      >
        {msg.content || '…'}
      </div>
      {isUser && (
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: 32, height: 32, background: 'oklch(0.62 0.12 55 / 0.12)' }}
        >
          <User size={16} style={{ color: T.earth }} />
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 justify-start">
      <AssistantAvatar size={32} />
      <div
        className="rounded-2xl px-4 py-3.5"
        style={{ background: T.lightBg, border: `1px solid ${T.border}`, borderBottomLeftRadius: '0.375rem' }}
      >
        <span className="chat-dots inline-flex gap-1.5">
          <span className="chat-dot" />
          <span className="chat-dot" />
          <span className="chat-dot" />
        </span>
      </div>
    </div>
  )
}

/* ── Página ─────────────────────────────────────────────────────────── */
export function ChatView() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_SEED)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const nextId = useRef(INITIAL_SEED.length)
  const sessionId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isTyping])

  /* Chama /api/chat e faz streaming da resposta da IA. */
  async function sendReal(content: string) {
    const userMsg: Msg = { id: nextId.current++, role: 'user', content }
    const assistantId = nextId.current++
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }])
    setIsTyping(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', parts: [{ type: 'text', text: content }] }],
          sessionId: sessionId.current,
        }),
      })

      const newSession = res.headers.get('X-Session-Id')
      if (newSession) sessionId.current = newSession

      if (!res.ok || !res.body) {
        let errMsg = 'Não consegui responder agora. Tente novamente em instantes.'
        if (res.status === 429) errMsg = 'Você atingiu o limite de mensagens por hora. Tente novamente mais tarde.'
        else if (res.status === 401) errMsg = 'Sua sessão expirou. Entre novamente para usar o assistente.'
        try {
          const data = await res.json()
          if (data?.error) errMsg = data.error
        } catch { /* corpo não-JSON */ }
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: errMsg } : m)))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      setIsTyping(false)
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)))
      }
      if (!acc.trim()) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: 'Não recebi uma resposta. Tente reformular a pergunta.' } : m)),
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: 'Falha de conexão. Verifique sua internet e tente de novo.' } : m)),
      )
    } finally {
      setIsTyping(false)
    }
  }

  function sendMessage(text: string) {
    const content = text.trim()
    if (!content || isTyping) return
    setInput('')
    void sendReal(content)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <style>{`
        @keyframes chatDot { 0%, 60%, 100% { transform: translateY(0); opacity: .4 } 30% { transform: translateY(-4px); opacity: 1 } }
        .chat-dot { width: 7px; height: 7px; border-radius: 9999px; background: ${T.green}; display: inline-block; animation: chatDot 1.2s infinite ease-in-out; }
        .chat-dots .chat-dot:nth-child(2) { animation-delay: .15s }
        .chat-dots .chat-dot:nth-child(3) { animation-delay: .3s }
        @media (prefers-reduced-motion: reduce) {
          .chat-dot { animation: none !important; opacity: .7 !important; transform: none !important; }
        }
      `}</style>

      <div
        className="h-[calc(100vh-7rem)] flex flex-col rounded-2xl bg-white overflow-hidden"
        style={{ border: `1px solid ${T.border}`, boxShadow: '0 18px 48px oklch(0.16 0.07 152 / 0.08)' }}
      >
        {/* ── Header ── */}
        <header
          className="flex items-center gap-3.5 px-5 py-4 shrink-0"
          style={{
            borderBottom: `1px solid ${T.border}`,
            background: `linear-gradient(180deg, ${T.lightBg}, white)`,
          }}
        >
          <AssistantAvatar size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1
                className="font-bold text-[15px] truncate"
                style={{ color: T.deep, fontFamily: T.heading, letterSpacing: '-0.01em' }}
              >
                Assistente Agrícola Frutificar
              </h1>
            </div>
            <p className="text-xs mt-0.5 flex items-center gap-1.5 truncate" style={{ color: T.muted }}>
              <Bot size={12} style={{ color: T.green }} />
              Especialista em café, solo e gestão rural · IA
            </p>
          </div>
        </header>

        {/* ── Mensagens ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* ── Sugestões + input ── */}
        <div className="shrink-0 px-5 pt-3 pb-4" style={{ borderTop: `1px solid ${T.border}`, background: 'white' }}>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                disabled={isTyping}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 hover:bg-[oklch(0.48_0.13_144_/_0.1)]"
                style={{ background: T.lightBg, border: `1px solid ${T.border}`, color: T.forest }}
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre café, solo, manejo, preço da saca..."
              disabled={isTyping}
              maxLength={2000}
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-shadow disabled:opacity-60"
              style={{ background: T.lightBg, border: `1px solid ${T.border}`, color: T.deep }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px oklch(0.48 0.13 144 / 0.15)`)}
              onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              aria-label="Enviar mensagem"
              className="inline-flex items-center justify-center rounded-xl text-white transition-transform hover:scale-[1.04] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                width: 46,
                height: 46,
                background: `linear-gradient(135deg, ${T.green}, ${T.forest})`,
                boxShadow: '0 6px 18px oklch(0.36 0.11 144 / 0.35)',
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
