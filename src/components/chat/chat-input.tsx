'use client'

import { Send, Loader2 } from 'lucide-react'
import type { FormEvent, ChangeEvent } from 'react'

interface ChatInputProps {
  input: string
  isLoading: boolean
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  error?: Error | null
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit, error }: ChatInputProps) {
  return (
    <div className="border-t bg-background p-4">
      {error && (
        <p className="text-xs text-destructive mb-2">
          {error.message.includes('429')
            ? 'Limite de 30 mensagens/hora atingido.'
            : 'Erro ao enviar. Tente novamente.'}
        </p>
      )}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={onInputChange}
          placeholder="Pergunte sobre café, solo, manejo..."
          disabled={isLoading}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          aria-label="Enviar mensagem"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  )
}
