'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './message-bubble'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface MessagesListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function MessagesList({ messages, isLoading }: MessagesListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
        <p className="text-4xl mb-3">🌱</p>
        <p className="font-medium">Assistente Agrícola Frutificar</p>
        <p className="text-sm mt-1 max-w-xs">
          Pergunte sobre café, manejo, adubação, diagnóstico de solo ou gestão da sua propriedade.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => (
        <MessageBubble
          key={msg.id}
          role={msg.role}
          content={msg.content}
          isStreaming={
            isLoading &&
            i === messages.length - 1 &&
            msg.role === 'assistant'
          }
        />
      ))}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <MessageBubble role="assistant" content="" isStreaming />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
