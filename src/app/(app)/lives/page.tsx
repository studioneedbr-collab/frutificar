import { EmptyState } from '@/components/shared/empty-state'
import { Radio } from 'lucide-react'

export default function LivesPage() {
  return (
    <EmptyState
      title="Lives"
      description="Em breve: transmissões ao vivo com agrônomos e especialistas do campo."
      icon={<Radio className="h-12 w-12" />}
    />
  )
}
