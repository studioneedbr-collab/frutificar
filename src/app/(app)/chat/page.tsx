// Server Component: renderiza o chat real, com streaming da IA via /api/chat,
// que persiste em ChatSession e exige OPENAI_API_KEY.
export const dynamic = 'force-dynamic'

import { ChatView } from './chat-view'

export default function ChatPage() {
  return <ChatView />
}
