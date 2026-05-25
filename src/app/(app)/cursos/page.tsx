import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findCoursesByUserPlan, getUserCoursesProgress } from '@/server/repositories/courses.repository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { BookOpen, Play } from 'lucide-react'
import Link from 'next/link'

export default async function CursosPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const courses = await findCoursesByUserPlan(session.user.id)

  if (courses.length === 0) {
    return (
      <EmptyState
        title="Nenhum curso disponível"
        description="Seu plano atual não inclui cursos. Faça upgrade para acessar o catálogo completo."
        icon={<BookOpen className="h-12 w-12" />}
        action={
          <Button asChild>
            <Link href="/perfil/assinatura">Ver planos</Link>
          </Button>
        }
      />
    )
  }

  const progressMap = await getUserCoursesProgress(
    session.user.id,
    courses.map((c) => c.id)
  )
  const coursesWithProgress = courses.map((course) => ({
    ...course,
    progress: progressMap[course.id] ?? { total: 0, completed: 0, completedIds: new Set<string>(), percentage: 0 },
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Cursos</h1>
        <p className="text-muted-foreground text-sm">
          {courses.length} curso{courses.length !== 1 ? 's' : ''} disponível
          {courses.length !== 1 ? 'is' : ''}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithProgress.map((course) => (
          <Card key={course.id} className="hover:border-primary/50 transition-colors">
            {course.coverImage && (
              <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {course.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {course.progress.completed}/{course.progress.total} aulas
                  </span>
                  <span>{course.progress.percentage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${course.progress.percentage}%` }}
                  />
                </div>
              </div>
              <Button className="w-full" asChild>
                <Link href={`/cursos/${course.slug}`}>
                  <Play className="h-4 w-4 mr-2" />
                  {course.progress.completed > 0 ? 'Continuar' : 'Começar'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
