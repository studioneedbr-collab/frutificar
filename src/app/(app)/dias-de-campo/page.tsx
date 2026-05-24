import { EmptyState } from '@/components/shared/empty-state'
import { Sun } from 'lucide-react'

export default function DiasDeCampoPage() {
  return (
    <EmptyState
      title="Dias de Campo"
      description="Em breve: participe de eventos práticos no campo com especialistas e produtores."
      icon={<Sun className="h-12 w-12" />}
    />
  )
}
