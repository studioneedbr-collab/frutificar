'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { completeLesson } from '@/server/actions/courses'

interface LessonPlayerProps {
  lessonId: string
  youtubeVideoId: string
  isCompleted: boolean
  onComplete?: () => void
}

export function LessonPlayer({
  lessonId,
  youtubeVideoId,
  isCompleted,
  onComplete,
}: LessonPlayerProps) {
  const [completed, setCompleted] = useState(isCompleted)
  const [marking, setMarking] = useState(false)

  async function handleMarkComplete() {
    setMarking(true)
    const result = await completeLesson(lessonId)
    setMarking(false)
    if (result.ok) {
      setCompleted(true)
      onComplete?.()
    }
  }

  return (
    <div className="space-y-4">
      {/* YouTube embed — responsive 16:9 */}
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          title="Aula"
        />
      </div>

      {/* Mark complete button */}
      <div className="flex items-center gap-3">
        {completed ? (
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <CheckCircle className="h-5 w-5" />
            Aula concluída
          </div>
        ) : (
          <Button onClick={handleMarkComplete} disabled={marking} variant="outline">
            {marking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Marcando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como concluída
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
