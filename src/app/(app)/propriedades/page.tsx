import { EmptyState } from '@/components/shared/empty-state'
import { MapPin } from 'lucide-react'

export default function PropriedadesPage() {
  return (
    <EmptyState
      title="Minhas Propriedades"
      description="Em breve: cadastre e gerencie suas propriedades rurais com mapas e dados de solo."
      icon={<MapPin className="h-12 w-12" />}
    />
  )
}
