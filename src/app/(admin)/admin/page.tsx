import { EmptyState } from '@/components/shared/empty-state'
import { BarChart3 } from 'lucide-react'

export default function AdminPage() {
  return (
    <EmptyState
      title="Painel Admin"
      description="Em construção. Gerencie usuários, planos, cursos e conteúdo da plataforma."
      icon={<BarChart3 className="h-12 w-12" />}
    />
  )
}
