import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import { getSetting } from '@/server/repositories/settings.repository'
import { createTextStreamResponse } from 'ai'
import { z } from 'zod'

const SYSTEM_PROMPT = `Você é o **Técnico Frutificar**, um técnico agrícola sênior (nível pós-graduação em cafeicultura) que atende produtores e estudantes pela plataforma Frutificar Digital. Sua especialidade é café arábica (Coffea arabica) e conilon/robusta (Coffea canephora) no Brasil, do plantio à comercialização, além de gestão de propriedade rural.

## Domínio técnico
Você domina, com profundidade real:
- **Solo e nutrição**: análise de solo, calagem (V% alvo ~60%, pH água 5,5–6,0), gessagem, parcelamento de N-P-K ao longo das chuvas, micronutrientes (B, Zn), matéria orgânica, adubação de formação x produção.
- **Fitossanidade**: ferrugem (Hemileia vastatrix), cercóspora, broca-do-café (Hypothenemus hampei), bicho-mineiro, nematoides — monitoramento, níveis de ação, rotação de modos de ação (grupos FRAC/IRAC) para evitar resistência.
- **Manejo**: espaçamento/adensamento, poda (esqueletamento, recepa, decote), arborização, condução de conilon, irrigação (balanço hídrico, estresse controlado pré-florada, gotejamento).
- **Fenologia**: florada, chumbinho, granação, maturação — e como cada fase muda a recomendação.
- **Colheita e pós-colheita**: % cereja, secagem (terreiro/secador, ~40 °C, 11–12% umidade), via seca/cereja descascado/fermentação, qualidade de bebida, classificação por peneira e tipo.
- **Gestão e mercado**: custo por saca beneficiada, margem, indicador CEPEA/ESALQ, ICE Futures, hedge/barter, planejamento de safra, licenças ambientais (CAR, outorga).

## Como responder
1. **Seja específico e acionável.** Dê números, doses (kg/ha, t/ha), janelas de tempo e passos concretos — nunca respostas genéricas do tipo "consulte um técnico".
2. **Adapte à espécie e região.** Se a resposta muda entre arábica e conilon, ou por região/altitude, diga isso. Se falta um dado crítico (fase da lavoura, resultado de análise de solo, sintoma exato, arábica x conilon), faça **1 pergunta curta** de esclarecimento antes de recomendar — mas se o produtor já deu contexto, responda direto.
3. **Base agronômica.** Sempre que fizer sentido, ancore em análise de solo + monitoramento de campo. Para adubação, deixe claro que doses finais dependem do laudo.
4. **Segurança com defensivos.** Ao indicar agroquímicos, cite o grupo/modo de ação e a lógica de rotação, e lembre que a aplicação exige **receituário agronômico** e respeito à bula/EPI. Não invente nomes comerciais nem doses de produtos específicos.
5. **Formato.** Português do Brasil, tom de técnico de confiança — direto, sem enrolar. Respostas curtas em 1–3 parágrafos ou tópicos objetivos. Use listas quando ajudar a executar.
6. **Plataforma.** Quando for natural, indique o recurso certo da Frutificar: **Diagnóstico** (foto/laudo de solo), **Cursos/Minicursos**, **Lives**, **Visita/Suporte técnico** (Premium), **Gestão da Propriedade**, **Dias de Campo/Tutoria** (Gold). Sugira, não empurre.
7. **Honestidade.** Se algo estiver fora do escopo (café/agro/gestão rural) ou você não tiver certeza, diga com franqueza e oriente o próximo passo. Nunca invente dados de mercado ou resultados de análise que o produtor não forneceu.`

const RATE_LIMIT_PER_HOUR = 30

/** Modelo padrão quando o admin não configurou um em /configuracoes. */
const DEFAULT_MODEL = 'gpt-4o'

// ai SDK v6 UIMessage part (text type)
const uiMessagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
})

// ai SDK v6 sends { messages: UIMessage[], id?, sessionId? }
const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().optional(),
        role: z.enum(['user', 'assistant', 'system']),
        parts: z.array(uiMessagePartSchema).optional(),
        // fallback for legacy plain-text clients
        content: z.string().optional(),
      })
    )
    .min(1),
  id: z.string().optional(),
  sessionId: z.string().nullable().optional(),
})

type StoredMessage = {
  role: string
  content: string
  ts?: number
}

/** Extract plain text from a UIMessage parts array, falling back to content string. */
function extractText(
  parts: Array<{ type: string; text?: string }> | undefined,
  content: string | undefined
): string {
  if (parts && parts.length > 0) {
    return parts
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text as string)
      .join('')
  }
  return content ?? ''
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Não autorizado', { status: 401 })
  }

  if (!session.user.plan) {
    return new Response('Assinatura inativa. Finalize seu pagamento para usar o assistente.', { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response('JSON inválido', { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return new Response('Dados inválidos', { status: 400 })
  }

  const { messages: incomingMessages, sessionId } = parsed.data
  const userId = session.user.id

  // Configurações dinâmicas (admin /configuracoes) com fallback.
  const rateLimit = Number(await getSetting('chat_limit')) || RATE_LIMIT_PER_HOUR
  const aiModel = (await getSetting('ai_model')) || DEFAULT_MODEL

  // Personaliza o prompt com o contexto do usuário (nome + plano) para respostas
  // mais direcionadas — o técnico sabe com quem está falando.
  const firstName = (session.user.name ?? '').trim().split(' ')[0]
  const userPlan = session.user.plan ?? null
  const personalizedSystem =
    SYSTEM_PROMPT +
    `\n\n## Contexto desta conversa` +
    (firstName ? `\n- Você está falando com **${firstName}**. Trate pelo nome quando fizer sentido.` : '') +
    (userPlan ? `\n- Plano do usuário: **${userPlan}**. Só sugira recursos compatíveis com o plano dele (ex.: Visita técnica e Gestão exigem Premium; Dias de Campo e Tutoria exigem Gold).` : '')

  // Last message must be from user
  const lastMsg = incomingMessages[incomingMessages.length - 1]
  if (lastMsg.role !== 'user') {
    return new Response('Última mensagem deve ser do usuário', { status: 400 })
  }
  const userMessageText = extractText(lastMsg.parts, lastMsg.content).trim()
  if (!userMessageText || userMessageText.length > 2000) {
    return new Response('Mensagem inválida', { status: 400 })
  }

  // Rate limiting POR USUÁRIO (não por sessão): conta as mensagens do usuário na
  // última hora em TODAS as sessões dele. Antes contava só a sessão atual, então
  // bastava omitir o sessionId a cada request para burlar e estourar custo de API.
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentSessions = await prisma.chatSession.findMany({
    where: { userId, lastMessageAt: { gt: new Date(oneHourAgo) } },
    select: { messages: true },
  })
  const recentUserCount = recentSessions.reduce((total, s) => {
    const msgs = (s.messages as StoredMessage[]) ?? []
    return total + msgs.filter((m) => m.role === 'user' && m.ts != null && m.ts > oneHourAgo).length
  }, 0)
  if (recentUserCount >= rateLimit) {
    return new Response(
      JSON.stringify({ error: `Limite de ${rateLimit} mensagens por hora atingido.` }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Só agora resolve/cria a sessão — evita criar sessões vazias quando limitado.
  let chatSession = sessionId
    ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId } })
    : null

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId, messages: [] },
    })
  }

  const storedMessages = (chatSession.messages as StoredMessage[]) ?? []

  // Build context: last 16 stored messages + new user message (mais memória de conversa)
  const contextMessages = storedMessages.slice(-16).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const allMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: personalizedSystem },
    ...contextMessages,
    { role: 'user', content: userMessageText },
  ]

  // Persist user message immediately
  const updatedMessages: StoredMessage[] = [
    ...storedMessages,
    { role: 'user', content: userMessageText, ts: Date.now() },
  ]
  await prisma.chatSession.update({
    where: { id: chatSession.id },
    data: { messages: updatedMessages, lastMessageAt: new Date() },
  })

  const sessionId_ = chatSession.id

  // Stream from OpenAI
  try {
    const stream = await openai.chat.completions.create({
      model: aiModel,
      messages: allMessages,
      stream: true,
      temperature: 0.4,
      max_tokens: 1500,
    })

    let fullResponse = ''

    const textStream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              fullResponse += delta
              controller.enqueue(delta)
            }
          }
          // Persist assistant response (with timeout guard)
          const persistTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Persist timeout')), 5000)
          )
          await Promise.race([
            prisma.chatSession.update({
              where: { id: sessionId_ },
              data: {
                messages: [
                  ...updatedMessages,
                  { role: 'assistant', content: fullResponse, ts: Date.now() },
                ],
              },
            }),
            persistTimeout,
          ]).catch((err: unknown) => console.error('Failed to persist message:', err))
        } catch (err) {
          console.error('Stream error:', err)
          controller.enqueue('\n\n[Erro ao processar resposta. Tente novamente.]')
        } finally {
          controller.close()
        }
      },
    })

    return createTextStreamResponse({
      textStream,
      headers: {
        'X-Session-Id': sessionId_,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('OpenAI error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar mensagem.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
