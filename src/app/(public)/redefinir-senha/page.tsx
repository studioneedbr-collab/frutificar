import Link from 'next/link'
import { FrutificarLogo } from '@/components/shared/logo'
import { ArrowLeft } from 'lucide-react'
import { ResetForm } from './reset-form'

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-parchment)' }}>
      <div className="flex items-center justify-between px-7 py-5 lg:px-12">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
          style={{ color: 'var(--color-frutificar-forest)' }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Entrar
        </Link>
        <FrutificarLogo size={22} />
      </div>

      <div className="flex-1 flex flex-col justify-center px-7 lg:px-14 py-8 w-full max-w-md mx-auto">
        {token ? (
          <ResetForm token={token} />
        ) : (
          <div className="text-center">
            <h2
              className="mb-3"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--color-frutificar-deep)',
                letterSpacing: '-0.03em',
              }}
            >
              Link inválido
            </h2>
            <p className="mb-6" style={{ color: 'oklch(0.48 0.04 144)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Este link de redefinição é inválido ou está incompleto. Solicite um novo.
            </p>
            <Link
              href="/esqueci-senha"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'var(--color-frutificar-green)', color: 'white' }}
            >
              Solicitar novo link
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
