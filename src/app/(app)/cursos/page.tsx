import { EmptyState } from '@/components/shared/empty-state'
import { BookOpen } from 'lucide-react'

export default function CursosPage() {
  return (
    <EmptyState
      title="Seus Cursos"
      description="Em breve: acesse cursos completos sobre culturas, manejo e boas práticas agrícolas."
      icon={<BookOpen className="h-12 w-12" />}
    />
  )
}
