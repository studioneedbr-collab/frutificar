import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ChatInterface } from '@/components/chat/chat-interface'

type StoredMessage = {
  role: string
  content: string
  ts?: number
}

export default async function ChatPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // Get the most recent chat session or create one
  let chatSession = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { lastMessageAt: 'desc' },
  })

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId, messages: [] },
    })
  }

  const rawMessages = (chatSession.messages as StoredMessage[]) ?? []

  const initialMessages = rawMessages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-lg border overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/50">
        <h1 className="font-semibold text-sm">Chat com Assistente Agrícola</h1>
        <p className="text-xs text-muted-foreground">Especialista em café, solo e gestão rural</p>
      </div>
      <ChatInterface sessionId={chatSession.id} initialMessages={initialMessages} />
    </div>
  )
}
