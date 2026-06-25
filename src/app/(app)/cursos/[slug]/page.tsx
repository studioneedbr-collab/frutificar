// DEV PREVIEW: renderiza em request-time (depende de banco/sessão); evita prerender sem DB.
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import {
  findCourseBySlug,
  getUserCourseProgress,
  enrollUser,
} from '@/server/repositories/courses.repository'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Play } from 'lucide-react'
import Link from 'next/link'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { slug } = await params

  const course = await findCourseBySlug(slug)
  if (!course) notFound()

  // Auto-enroll if not enrolled
  await enrollUser(session.user.id, course.id)

  const progress = await getUserCourseProgress(session.user.id, course.id)

  // Find first incomplete lesson for continue button
  let firstIncompleteHref: string | null = null
  outer: for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!progress.completedIds.has(lesson.id)) {
        firstIncompleteHref = `/cursos/${slug}/${lesson.id}`
        break outer
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{course.type}</Badge>
          <span className="text-sm text-muted-foreground">
            {progress.percentage}% concluído
          </span>
        </div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {firstIncompleteHref && (
          <Button asChild>
            <Link href={firstIncompleteHref}>
              <Play className="h-4 w-4 mr-2" />
              {progress.completed > 0 ? 'Continuar de onde parei' : 'Começar curso'}
            </Link>
          </Button>
        )}
        {!firstIncompleteHref && progress.total > 0 && (
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Curso concluído!</span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/perfil/certificados">Ver certificado</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Modules & Lessons */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Conteúdo do curso</h2>
        {course.modules.map((module) => (
          <div key={module.id} className="rounded-lg border">
            <div className="px-4 py-3 bg-muted/50 rounded-t-lg">
              <h3 className="font-medium">{module.title}</h3>
              <p className="text-xs text-muted-foreground">
                {module.lessons.length} aula{module.lessons.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ul className="divide-y">
              {module.lessons.map((lesson) => {
                const isCompleted = progress.completedIds.has(lesson.id)
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/cursos/${slug}/${lesson.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className={isCompleted ? 'text-muted-foreground line-through' : ''}>
                        {lesson.title}
                      </span>
                      {lesson.durationSec && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {Math.floor(lesson.durationSec / 60)}min
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}