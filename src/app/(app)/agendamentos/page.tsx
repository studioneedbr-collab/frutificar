import { EmptyState } from '@/components/shared/empty-state'
import { Calendar } from 'lucide-react'

export default function AgendamentosPage() {
  return (
    <EmptyState
      title="Agendamentos"
      description="Em breve: agende visitas técnicas de agrônomos à sua propriedade de forma simples e rápida."
      icon={<Calendar className="h-12 w-12" />}
    />
  )
}
