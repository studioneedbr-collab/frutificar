// DEV PREVIEW: renderiza em request-time (depende de banco/sessão); evita prerender sem DB.
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { findCourseBySlug } from '@/server/repositories/courses.repository'
import { LessonPlayer } from '@/components/courses/lesson-player'
import { CheckCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { slug, lessonId } = await params

  const [course, lesson, progressRecord] = await Promise.all([
    findCourseBySlug(slug),
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        materials: true,
        module: { select: { title: true, courseId: true } },
      },
    }),
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
    }),
  ])

  if (!course || !lesson) notFound()

  // Build flat list of all lessons for prev/next navigation
  const allLessons = course.modules.flatMap((m) => m.lessons)
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  // Get all completed lesson IDs for sidebar
  const completedProgressRecords = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      completed: true,
      lesson: { module: { courseId: course.id } },
    },
    select: { lessonId: true },
  })
  const completedIds = new Set(completedProgressRecords.map((p) => p.lessonId))

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/cursos/${slug}`} className="hover:text-foreground">
              {course.title}
            </Link>
            <span>/</span>
            <span>{lesson.title}</span>
          </div>

          <h1 className="text-xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground text-sm">{lesson.description}</p>
          )}

          {/* Video player */}
          {lesson.youtubeVideoId ? (
            <LessonPlayer
              lessonId={lesson.id}
              youtubeVideoId={lesson.youtubeVideoId}
              isCompleted={progressRecord?.completed ?? false}
            />
          ) : (
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              Vídeo não disponível
            </div>
          )}

          {/* Materials */}
          {lesson.materials.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Materiais complementares</h3>
              <ul className="space-y-1">
                {lesson.materials.map((material) => (
                  <li key={material.id}>
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {material.title} ({material.type})
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prev/Next navigation */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            {prevLesson ? (
              <Button variant="outline" asChild>
                <Link href={`/cursos/${slug}/${prevLesson.id}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Button asChild>
                <Link href={`/cursos/${slug}/${nextLesson.id}`}>
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/cursos/${slug}`}>Ver curso completo</Link>
              </Button>
            )}
          </div>

          {/* Lista de aulas — versão mobile (colapsável), já que a sidebar some no celular */}
          <details className="lg:hidden rounded-lg border overflow-hidden" open>
            <summary className="px-4 py-3 bg-muted/50 font-medium text-sm cursor-pointer select-none">
              Aulas do curso
            </summary>
            <div className="max-h-[60vh] overflow-y-auto">
              {course.modules.map((module) => (
                <div key={module.id}>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/20 border-t">
                    {module.title}
                  </div>
                  {module.lessons.map((l) => {
                    const isDone = completedIds.has(l.id)
                    const isCurrent = l.id === lessonId
                    return (
                      <Link
                        key={l.id}
                        href={`/cursos/${slug}/${l.id}`}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors ${
                          isCurrent ? 'bg-primary/10 text-primary font-medium' : ''
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{l.title}</span>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Sidebar — lesson list */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-6 rounded-lg border overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 font-medium text-sm">Aulas do curso</div>
            <div className="max-h-[70vh] overflow-y-auto">
              {course.modules.map((module) => (
                <div key={module.id}>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/20 border-t">
                    {module.title}
                  </div>
                  {module.lessons.map((l) => {
                    const isDone = completedIds.has(l.id)
                    const isCurrent = l.id === lessonId
                    return (
                      <Link
                        key={l.id}
                        href={`/cursos/${slug}/${l.id}`}
                        className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/30 transition-colors ${
                          isCurrent ? 'bg-primary/10 text-primary font-medium' : ''
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{l.title}</span>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}