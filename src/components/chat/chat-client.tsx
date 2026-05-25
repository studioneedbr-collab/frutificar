'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  AbstractChat,
  TextStreamChatTransport,
  type UIMessage,
  type ChatState,
  type ChatStatus,
} from 'ai'
import { MessagesList, type ChatMessage } from './messages-list'
import { ChatInput } from './chat-input'

interface ChatClientProps {
  sessionId: string
  initialMessages: ChatMessage[]
}

/** Convert stored ChatMessage into ai SDK UIMessage */
function toChatUIMessage(msg: ChatMessage): UIMessage {
  return {
    id: msg.id,
    role: msg.role,
    parts: [{ type: 'text', text: msg.content }],
  }
}

/** Extract display text from a UIMessage */
function uiMessageToDisplay(msg: UIMessage): ChatMessage {
  const text = msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p)
    .map((p) => p.text)
    .join('')
  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: text,
  }
}

/** Minimal concrete subclass of AbstractChat (no abstract methods to implement) */
class ChatInstance extends AbstractChat<UIMessage> {}

export function ChatClient({ sessionId, initialMessages }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const chatRef = useRef<ChatInstance | null>(null)

  useEffect(() => {
    const uiMessages = initialMessages.map(toChatUIMessage)

    // Reactive state object — AbstractChat mutates via these callbacks
    const state: ChatState<UIMessage> = {
      status: 'ready' as ChatStatus,
      error: undefined,
      messages: uiMessages,
      pushMessage(msg: UIMessage) {
        state.messages = [...state.messages, msg]
        setMessages(state.messages.map(uiMessageToDisplay))
      },
      popMessage() {
        state.messages = state.messages.slice(0, -1)
        setMessages(state.messages.map(uiMessageToDisplay))
      },
      replaceMessage(index: number, msg: UIMessage) {
        const next = [...state.messages]
        next[index] = msg
        state.messages = next
        setMessages(next.map(uiMessageToDisplay))
      },
      snapshot<T>(thing: T): T {
        return thing
      },
    }

    chatRef.current = new ChatInstance({
      transport: new TextStreamChatTransport({
        api: '/api/chat',
        body: { sessionId },
      }),
      state,
      onError(err: Error) {
        setError(err)
        setIsLoading(false)
      },
      onFinish() {
        setIsLoading(false)
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || isLoading || !chatRef.current) return

      setInput('')
      setError(null)
      setIsLoading(true)

      chatRef.current
        .sendMessage({ text })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsLoading(false)
        })
    },
    [input, isLoading]
  )

  return (
    <div className="flex flex-col h-full">
      <MessagesList messages={messages} isLoading={isLoading} />
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        error={error}
      />
    </div>
  )
}
