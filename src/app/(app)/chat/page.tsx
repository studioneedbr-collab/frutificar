import { EmptyState } from '@/components/shared/empty-state'
import { MessageCircle } from 'lucide-react'

export default function ChatPage() {
  return (
    <EmptyState
      title="Chat com IA Agrícola"
      description="Em breve: tire dúvidas com nossa IA especializada e receba recomendações personalizadas."
      icon={<MessageCircle className="h-12 w-12" />}
    />
  )
}
