import { EmptyState } from '@/components/shared/empty-state'
import { BarChart3 } from 'lucide-react'

export default function GestaoPage() {
  return (
    <EmptyState
      title="Gestão Rural"
      description="Em breve: controle atividades, análises e recomendações da sua propriedade em um só lugar."
      icon={<BarChart3 className="h-12 w-12" />}
    />
  )
}
