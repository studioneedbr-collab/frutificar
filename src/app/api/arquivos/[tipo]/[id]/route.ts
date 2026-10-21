// Download protegido de arquivos privados (documentos da propriedade e laudos de solo).
// Só o dono (ou um admin) recebe um link assinado temporário do Supabase Storage.
// Para quem não tem acesso, responde 404 — não revela se o arquivo existe.
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createSignedUrl, isPrivateRef } from '@/lib/storage'

export const dynamic = 'force-dynamic'

const SIGNED_URL_TTL = 120 // segundos

function notFound() {
  return new Response('Arquivo não encontrado.', {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function redirectTo(url: string) {
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': 'no-store' },
  })
}

// Busca o valor gravado no banco + o dono do arquivo.
async function loadFile(tipo: string, id: string): Promise<{ ownerId: string; stored: string | null } | null> {
  if (tipo === 'documento') {
    const doc = await prisma.propertyDocument.findUnique({
      where: { id },
      select: { fileUrl: true, property: { select: { userId: true } } },
    })
    return doc ? { ownerId: doc.property.userId, stored: doc.fileUrl } : null
  }
  if (tipo === 'laudo') {
    const analysis = await prisma.soilAnalysis.findUnique({
      where: { id },
      select: { nutrients: true, plot: { select: { property: { select: { userId: true } } } } },
    })
    if (!analysis) return null
    const n = analysis.nutrients as { fileUrl?: unknown } | null
    const stored = n && typeof n === 'object' && typeof n.fileUrl === 'string' ? n.fileUrl : null
    return { ownerId: analysis.plot.property.userId, stored }
  }
  return null
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ tipo: string; id: string }> },
) {
  const { tipo, id } = await ctx.params
  if ((tipo !== 'documento' && tipo !== 'laudo') || !id || id.length > 64) return notFound()

  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Não autenticado.', { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  let file: Awaited<ReturnType<typeof loadFile>>
  try {
    file = await loadFile(tipo, id)
  } catch (err) {
    console.error('[arquivos] erro ao buscar arquivo:', err)
    return new Response('Erro ao abrir o arquivo.', { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  const allowed = file && (file.ownerId === session.user.id || session.user.role === 'ADMIN')
  if (!file || !allowed || !file.stored) return notFound()

  // Arquivo novo (bucket privado) → link assinado de curta duração.
  if (isPrivateRef(file.stored)) {
    const signed = await createSignedUrl(file.stored, SIGNED_URL_TTL)
    if (!signed) return notFound()
    return redirectTo(signed)
  }

  // Upload antigo (bucket público) → segue para a URL original.
  if (/^https?:\/\//i.test(file.stored)) return redirectTo(file.stored)

  return notFound()
}
