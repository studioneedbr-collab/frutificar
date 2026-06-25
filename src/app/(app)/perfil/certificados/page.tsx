// DEV PREVIEW: renderiza em request-time (depende de banco/sessão); evita prerender sem DB.
export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserCertificates } from '@/server/repositories/courses.repository'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Award } from 'lucide-react'
import Link from 'next/link'

export default async function CertificadosPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const certificates = await getUserCertificates(session.user.id)

  if (certificates.length === 0) {
    return (
      <EmptyState
        title="Nenhum certificado ainda"
        description="Conclua um curso para receber seu certificado de conclusão."
        icon={<Award className="h-12 w-12" />}
        action={
          <Button asChild>
            <Link href="/cursos">Ver cursos</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus Certificados</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <Card key={cert.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{cert.course.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Concluído em{' '}
                    {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Award className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/certificados/${session.user.id}/${cert.courseId}`}
                  target="_blank"
                >
                  Ver certificado
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}