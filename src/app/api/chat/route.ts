import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import { createTextStreamResponse } from 'ai'
import { z } from 'zod'

const SYSTEM_PROMPT = `Você é um especialista em café arábica e conilon, gestão de propriedade rural e culturas agrícolas. Responda de forma técnica mas acessível, considerando que o usuário é um produtor rural ou estudante de agronomia. Quando relevante, sugira recursos da plataforma Frutificar Digital (cursos, diagnóstico de solo, visitas técnicas, lives). Seja conciso e prático.`

const RATE_LIMIT_PER_HOUR = 30

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

  // Last message must be from user
  const lastMsg = incomingMessages[incomingMessages.length - 1]
  if (lastMsg.role !== 'user') {
    return new Response('Última mensagem deve ser do usuário', { status: 400 })
  }
  const userMessageText = extractText(lastMsg.parts, lastMsg.content).trim()
  if (!userMessageText || userMessageText.length > 2000) {
    return new Response('Mensagem inválida', { status: 400 })
  }

  // Find or create chat session
  let chatSession = sessionId
    ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId } })
    : null

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId, messages: [] },
    })
  }

  // Rate limiting: count user messages in last hour
  const storedMessages = (chatSession.messages as StoredMessage[]) ?? []
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentUserMessages = storedMessages.filter(
    (m) => m.role === 'user' && m.ts != null && m.ts > oneHourAgo
  )
  if (recentUserMessages.length >= RATE_LIMIT_PER_HOUR) {
    return new Response(
      JSON.stringify({ error: 'Limite de 30 mensagens por hora atingido.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Build context: last 10 stored messages + new user message
  const contextMessages = storedMessages.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const allMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
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
      model: 'gpt-4o-mini',
      messages: allMessages,
      stream: true,
      max_tokens: 1000,
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
