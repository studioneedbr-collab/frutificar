// Server Component: decide entre o modo demo (respostas simuladas) e o modo real
// (streaming da IA via /api/chat, que persiste em ChatSession e exige OPENAI_API_KEY).
export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { ChatView } from './chat-view'

export default function ChatPage() {
  return <ChatView preview={PREVIEW_MODE} />
}
