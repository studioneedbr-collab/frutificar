import { EmptyState } from '@/components/shared/empty-state'
import { Mic2 } from 'lucide-react'

export default function PodcastsPage() {
  return (
    <EmptyState
      title="Podcasts"
      description="Em breve: ouça episódios com especialistas em agricultura, agronegócio e inovação no campo."
      icon={<Mic2 className="h-12 w-12" />}
    />
  )
}
