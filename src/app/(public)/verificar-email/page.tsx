import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  let status: 'ok' | 'invalid' = 'invalid'

  if (token) {
    const record = await prisma.verificationToken.findUnique({ where: { token } })
    if (record && record.expires > new Date()) {
      // Idempotente de propósito: NÃO deletamos o token aqui. Prescanners de e-mail
      // (antivírus corporativo, preview de links) costumam fazer GET no link antes
      // do usuário clicar; se consumíssemos o token, o clique real veria "link
      // inválido". O token expira sozinho em 24h.
      await prisma.user.update({
        where: { email: record.identifier },
        data: { emailVerified: new Date() },
      })
      status = 'ok'
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-parchment)' }}
    >
      <div className="text-center px-6 max-w-sm">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }} className="mb-3">
          {status === 'ok' ? 'E-mail confirmado!' : 'Link inválido ou expirado'}
        </h2>
        <p className="mb-6 text-sm opacity-80">
          {status === 'ok'
            ? 'Sua conta foi verificada com sucesso.'
            : 'O link de verificação não é válido ou já expirou. Faça login para reenviar.'}
        </p>
        <Link
          href={status === 'ok' ? '/dashboard' : '/login'}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: 'var(--color-frutificar-green)', color: 'white' }}
        >
          {status === 'ok' ? 'Ir para o dashboard' : 'Ir para o login'}
        </Link>
      </div>
    </div>
  )
}
