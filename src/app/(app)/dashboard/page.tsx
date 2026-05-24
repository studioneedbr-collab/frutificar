import { EmptyState } from '@/components/shared/empty-state'
import { LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
  return (
    <EmptyState
      title="Dashboard"
      description="Em breve: resumo de progresso, lives agendadas e recomendações da propriedade."
      icon={<LayoutDashboard className="h-12 w-12" />}
    />
  )
}
