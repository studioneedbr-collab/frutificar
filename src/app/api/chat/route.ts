import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'
import { z } from 'zod'

const SYSTEM_PROMPT = `Você é um especialista em café arábica e conilon, gestão de propriedade rural e culturas agrícolas. Responda de forma técnica mas acessível, considerando que o usuário é um produtor rural ou estudante de agronomia. Quando relevante, sugira recursos da plataforma Frutificar Digital (cursos, diagnóstico de solo, visitas técnicas, lives). Seja conciso e prático.`

const RATE_LIMIT_PER_HOUR = 30

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().nullable().optional(),
})

type StoredMessage = {
  role: string
  content: string
  ts?: number
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

  const { message, sessionId } = parsed.data
  const userId = session.user.id

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
  const messages = (chatSession.messages as StoredMessage[]) ?? []
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentUserMessages = messages.filter(
    (m) => m.role === 'user' && m.ts != null && m.ts > oneHourAgo
  )
  if (recentUserMessages.length >= RATE_LIMIT_PER_HOUR) {
    return new Response(
      JSON.stringify({ error: 'Limite de 30 mensagens por hora atingido.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Build context: last 10 messages
  const contextMessages = messages.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const allMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...contextMessages,
    { role: 'user', content: message },
  ]

  // Persist user message immediately
  const updatedMessages: StoredMessage[] = [
    ...messages,
    { role: 'user', content: message, ts: Date.now() },
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

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              fullResponse += delta
              controller.enqueue(new TextEncoder().encode(delta))
            }
          }
        } finally {
          controller.close()

          // Persist assistant response after stream ends
          try {
            await prisma.chatSession.update({
              where: { id: sessionId_ },
              data: {
                messages: [
                  ...updatedMessages,
                  { role: 'assistant', content: fullResponse, ts: Date.now() },
                ],
              },
            })
          } catch (persistErr) {
            console.error('Failed to persist assistant message:', persistErr)
          }
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Session-Id': sessionId_,
        'Transfer-Encoding': 'chunked',
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
