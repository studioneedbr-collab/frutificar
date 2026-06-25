'use client'

/* DEV PREVIEW — chat 100% offline, sem banco/auth. Respostas simuladas. */

import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Sprout, Bot, Send, Sparkles, User } from 'lucide-react'

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

/* ── Base de respostas agronômicas (café) ───────────────────────────── */
interface Answer {
  keys: string[]
  text: string
}

const ANSWERS: Answer[] = [
  {
    keys: ['ferrugem', 'praga', 'pragas', 'broca', 'bicho', 'fungo', 'doença', 'doenca'],
    text:
      'A ferrugem (Hemileia vastatrix) é favorecida por alta umidade e temperaturas entre 21 e 25 °C. ' +
      'Monitore a incidência foliar e faça aplicações preventivas de fungicidas cúpricos ou triazóis/estrobilurinas a partir de dezembro, alternando os modos de ação para evitar resistência. ' +
      'Lavouras bem nutridas (com potássio adequado) e arejadas resistem melhor — evite excesso de sombreamento e adensamento.',
  },
  {
    keys: ['calagem', 'calcário', 'calcario', 'solo', 'ph', 'acidez', 'gesso', 'corrigir'],
    text:
      'A calagem ideal parte da análise de solo: corrija para elevar a saturação por bases (V%) a cerca de 60% e neutralizar o alumínio tóxico. ' +
      'Aplique o calcário 60 a 90 dias antes do plantio ou na entressafra, incorporando quando possível, e considere o gesso agrícola para corrigir a acidez em subsuperfície. ' +
      'O pH em água em torno de 5,5 a 6,0 favorece a disponibilidade de nutrientes para o café.',
  },
  {
    keys: ['npk', 'adubação', 'adubacao', 'adubo', 'nutrição', 'nutricao', 'florada', 'nitrogênio', 'nitrogenio', 'potássio', 'potassio', 'fósforo', 'fosforo', 'fertilizante'],
    text:
      'Na florada o cafeeiro tem alta demanda por nitrogênio e potássio para sustentar a granação. ' +
      'Parcele a adubação em 3 a 4 vezes ao longo das chuvas (out–mar), ajustando as doses à análise de solo e à expectativa de carga pendente — em geral algo na faixa de 300 a 400 kg/ha de N e K2O para lavouras produtivas. ' +
      'Não esqueça dos micronutrientes (boro e zinco), que pegam fixação dos chumbinhos e o pegamento da florada.',
  },
  {
    keys: ['preço', 'preco', 'precificar', 'saca', 'comercial', 'comercialização', 'comercializacao', 'vender', 'venda', 'mercado', 'custo'],
    text:
      'Para precificar a saca, parta do seu custo de produção por saca beneficiada e some a margem desejada — só assim você sabe seu preço mínimo de venda. ' +
      'Acompanhe o indicador CEPEA/ESALQ e o mercado de bolsa (ICE) como referência, e considere travar parte da safra via contratos futuros ou barter para reduzir risco. ' +
      'Qualidade de bebida e classificação por peneira agregam ágio relevante: vale investir em colheita e secagem bem feitas.',
  },
  {
    keys: ['irrigação', 'irrigacao', 'água', 'agua', 'gotejamento', 'pivô', 'pivo', 'hídrico', 'hidrico', 'seca'],
    text:
      'No café, o manejo da irrigação deve respeitar o estresse hídrico controlado pré-florada para uniformizar a abertura das flores. ' +
      'Use o balanço hídrico (ETc e capacidade de água disponível do solo) para definir a lâmina, priorizando gotejamento pela eficiência. ' +
      'Após o florescimento, mantenha a umidade estável na fase de chumbinho e granação, que são os períodos mais sensíveis a déficit.',
  },
  {
    keys: ['colheita', 'colher', 'secagem', 'secar', 'terreiro', 'maturação', 'maturacao', 'pós-colheita', 'pos-colheita', 'beneficiamento'],
    text:
      'Colha com a maior proporção possível de frutos cereja maduros — o ideal é acima de 80% — para garantir qualidade de bebida. ' +
      'Logo após a colheita, lave para separar boia e leve à secagem rápida, mantendo camadas finas no terreiro e revolvendo com frequência, ou use secador a baixa temperatura (até ~40 °C na massa). ' +
      'Seque até cerca de 11 a 12% de umidade e descanse o café em tulha antes do beneficiamento para estabilizar a qualidade.',
  },
]

const DEFAULT_ANSWER =
  'Ótima pergunta! No contexto do cafeeiro, a recomendação sempre parte de duas bases: a análise de solo atualizada e o monitoramento da lavoura em campo. ' +
  'Me dê um pouco mais de detalhe (fase da cultura, sintoma observado, ou objetivo) que eu trago uma orientação técnica mais precisa para o seu talhão. ' +
  'Posso ajudar com manejo de pragas, correção de solo, adubação, irrigação, colheita ou comercialização.'

function pickAnswer(input: string): string {
  const q = input.toLowerCase()
  for (const a of ANSWERS) {
    if (a.keys.some((k) => q.includes(k))) return a.text
  }
  return DEFAULT_ANSWER
}

const SUGGESTIONS = [
  'Como controlar a ferrugem do café?',
  'Qual a melhor época de calagem?',
  'Quanto de NPK na florada?',
  'Como precificar a saca?',
]

const SEED: Msg[] = [
  {
    id: 0,
    role: 'assistant',
    content:
      'Olá! Sou o Assistente Agrícola da Frutificar. Posso te ajudar com manejo de pragas, correção e adubação de solo, irrigação, colheita e comercialização do café. Como posso ajudar na sua lavoura hoje?',
  },
  {
    id: 1,
    role: 'user',
    content: 'Estou vendo manchas alaranjadas embaixo das folhas. O que pode ser?',
  },
  {
    id: 2,
    role: 'assistant',
    content:
      'Esse sintoma é clássico de ferrugem do cafeeiro: pústulas amarelo-alaranjadas na face inferior das folhas, levando à desfolha. ' +
      'Faça o monitoramento da incidência e inicie um programa preventivo de fungicidas, alternando modos de ação, e reforce a nutrição potássica da lavoura.',
  },
]

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
        {msg.content}
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
export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>(SEED)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const nextId = useRef(SEED.length)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isTyping])

  function sendMessage(text: string) {
    const content = text.trim()
    if (!content || isTyping) return

    const userMsg: Msg = { id: nextId.current++, role: 'user', content }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const answer = pickAnswer(content)
    const delay = 700 + content.length * 8 // determinístico, ~700–1100ms
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'assistant', content: answer }])
      setIsTyping(false)
    }, Math.min(delay, 1100))
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
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                style={{ background: 'oklch(0.62 0.12 55 / 0.12)', color: T.earth, letterSpacing: '0.04em' }}
              >
                <Sparkles size={10} /> PREVIEW
              </span>
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
