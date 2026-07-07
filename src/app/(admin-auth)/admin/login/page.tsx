'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { FrutificarLogo } from '@/components/shared/logo'
import { ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setLoading(false)
      setError('E-mail ou senha incorretos.')
      return
    }

    // Verifica se o usuário autenticado é ADMIN; caso contrário, bloqueia o acesso.
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      const session = await res.json()
      if (session?.user?.role !== 'ADMIN') {
        setLoading(false)
        setError('Esta conta não tem acesso ao painel administrativo.')
        return
      }
    } catch {
      setLoading(false)
      setError('Não foi possível validar o acesso. Tente novamente.')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(160deg, var(--color-frutificar-night) 0%, oklch(0.20 0.085 148) 100%)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, oklch(0.48 0.13 144 / 0.12) 0%, transparent 65%)',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <FrutificarLogo white size={30} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'oklch(1 0 0 / 0.04)',
            border: '1px solid oklch(1 0 0 / 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: 'oklch(0.62 0.12 55 / 0.15)',
                border: '1px solid oklch(0.62 0.12 55 / 0.3)',
                color: 'oklch(0.78 0.14 75)',
              }}
            >
              <ShieldCheck size={12} />
              ÁREA RESTRITA · ADMINISTRADORES
            </div>
          </div>

          <h1
            className="text-2xl font-bold text-white text-center mb-1"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
          >
            Painel Admin
          </h1>
          <p className="text-sm text-center mb-8" style={{ color: 'oklch(1 0 0 / 0.45)' }}>
            Acesso exclusivo para administradores
          </p>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'oklch(1 0 0 / 0.5)' }}>
                E-MAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@frutificar.com"
                className="w-full px-4 h-11 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'oklch(1 0 0 / 0.06)',
                  border: '1px solid oklch(1 0 0 / 0.12)',
                  color: 'white',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'oklch(1 0 0 / 0.5)' }}>
                SENHA
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 h-11 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'oklch(1 0 0 / 0.06)',
                  border: '1px solid oklch(1 0 0 / 0.12)',
                  color: 'white',
                }}
              />
            </div>

            {error && (
              <div
                className="text-sm font-medium px-4 py-3 rounded-xl"
                style={{
                  background: 'oklch(0.55 0.2 27 / 0.15)',
                  color: 'oklch(0.85 0.12 27)',
                  border: '1px solid oklch(0.55 0.2 27 / 0.3)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full h-11 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-85 mt-2 disabled:opacity-60"
              style={{
                background: 'linear-gradient(130deg, var(--color-frutificar-forest) 0%, var(--color-frutificar-green) 100%)',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar no painel'}
            </button>
          </form>
        </div>

        {/* Back to app */}
        <p className="text-center mt-6 text-xs" style={{ color: 'oklch(1 0 0 / 0.3)' }}>
          É produtor?{' '}
          <Link href="/login" className="underline hover:text-white/60 transition-colors" style={{ color: 'oklch(1 0 0 / 0.5)' }}>
            Acesse sua conta aqui
          </Link>
        </p>
      </div>
    </div>
  )
}
