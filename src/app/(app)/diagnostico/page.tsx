import { EmptyState } from '@/components/shared/empty-state'
import { Leaf } from 'lucide-react'

export default function DiagnosticoPage() {
  return (
    <EmptyState
      title="Diagnóstico da Propriedade"
      description="Em breve: analise seus dados de solo e receba recomendações de adubação e correção."
      icon={<Leaf className="h-12 w-12" />}
    />
  )
}
