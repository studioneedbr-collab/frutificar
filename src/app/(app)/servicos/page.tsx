import { EmptyState } from '@/components/shared/empty-state'
import { Wrench } from 'lucide-react'

export default function ServicosPage() {
  return (
    <EmptyState
      title="Serviços"
      description="Em breve: solicite serviços especializados para sua propriedade rural."
      icon={<Wrench className="h-12 w-12" />}
    />
  )
}
