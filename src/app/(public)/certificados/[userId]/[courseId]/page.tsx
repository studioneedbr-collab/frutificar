// DEV PREVIEW: renderiza em request-time (depende de banco/sessão); evita prerender sem DB.
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ userId: string; courseId: string }>
}) {
  const { userId, courseId } = await params

  const certificate = await prisma.certificate.findFirst({
    where: { userId, courseId },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  })

  if (!certificate) notFound()

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: 'linear-gradient(135deg, #0e3d1f 0%, #1a5c2e 100%)' }}
    >
      <div className="bg-white rounded-2xl p-12 max-w-2xl w-full text-center shadow-2xl space-y-6">
        <div className="text-5xl">🌱</div>
        <h1 className="text-2xl font-bold text-gray-800">Certificado de Conclusão</h1>
        <p className="text-gray-500 text-sm">Certificamos que</p>
        <p className="text-3xl font-bold text-green-800">{certificate.user.name}</p>
        <p className="text-gray-500">concluiu com êxito o curso</p>
        <p className="text-xl font-semibold text-gray-800">{certificate.course.title}</p>
        <p className="text-gray-500 text-sm">
          em{' '}
          {new Date(certificate.issuedAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-400">
            Frutificar Digital — Plataforma de Educação Agrícola
          </p>
          <p className="text-xs text-gray-300 mt-1">ID: {certificate.id}</p>
        </div>
      </div>
    </div>
  )
}