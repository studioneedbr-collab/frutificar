'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FrutificarLogo } from '@/components/shared/logo'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

const features = [
  'Cursos práticos com especialistas em campo',
  'Assistente IA treinada em agronomia',
  'Gestão digital da sua propriedade rural',
]

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    setError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Email ou senha incorretos.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — identidade da marca ────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 90% 65% at 0% 100%, oklch(0.36 0.11 144 / 0.6) 0%, transparent 70%),
            radial-gradient(ellipse 55% 45% at 100% 5%, oklch(0.62 0.12 55 / 0.14) 0%, transparent 60%),
            linear-gradient(168deg, oklch(0.18 0.08 150) 0%, oklch(0.13 0.06 148) 100%)
          `,
        }}
      >
        {/* Texture de fundo sutil */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 0h80v80H0z' fill='none'/%3E%3Ccircle cx='40' cy='40' r='1' fill='white'/%3E%3Ccircle cx='0' cy='0' r='1' fill='white'/%3E%3Ccircle cx='80' cy='0' r='1' fill='white'/%3E%3Ccircle cx='0' cy='80' r='1' fill='white'/%3E%3Ccircle cx='80' cy='80' r='1' fill='white'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Logo */}
        <FrutificarLogo white size={26} />

        {/* Conteúdo central */}
        <div className="relative z-10">
          <p
            className="text-xs font-bold tracking-[0.22em] uppercase mb-7"
            style={{ color: 'var(--color-earth)' }}
          >
            Plataforma Educacional Agrícola
          </p>

          <h1
            className="text-white leading-[1.12] mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.9rem, 3.2vw, 2.65rem)',
              fontWeight: 700,
            }}
          >
            Cultive conhecimento.<br />
            Colha resultados.
          </h1>

          <p
            className="leading-relaxed mb-10"
            style={{
              color: 'oklch(0.84 0.04 144)',
              fontSize: '0.92rem',
              maxWidth: '32ch',
            }}
          >
            A maior plataforma de educação e consultoria para produtores rurais do Brasil.
          </p>

          <ul className="space-y-4">
            {features.map((feat) => (
              <li key={feat} className="flex items-center gap-3.5">
                <span
                  className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full"
                  style={{
                    background: 'oklch(0.62 0.12 55 / 0.18)',
                    border: '1px solid oklch(0.62 0.12 55 / 0.45)',
                  }}
                >
                  <Check
                    size={10}
                    style={{ color: 'var(--color-earth)' }}
                    strokeWidth={3}
                  />
                </span>
                <span style={{ color: 'oklch(0.88 0.03 144)', fontSize: '0.875rem' }}>
                  {feat}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rodapé */}
        <p style={{ color: 'oklch(0.55 0.04 144)', fontSize: '0.73rem' }}>
          © 2026 Frutificar Digital
        </p>
      </div>

      {/* ── RIGHT PANEL — formulário ─────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ background: 'var(--color-parchment)' }}
      >
        {/* Nav topo */}
        <div className="flex items-center justify-between px-7 py-5 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-frutificar-forest)' }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Início
          </Link>
          {/* Logo visível apenas no mobile */}
          <div className="lg:hidden">
            <FrutificarLogo size={22} />
          </div>
        </div>

        {/* Área do formulário */}
        <div className="flex-1 flex flex-col justify-center px-7 lg:px-14 xl:px-16 py-8 w-full max-w-xl mx-auto">
          {/* Cabeçalho */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: 'var(--color-earth)' }}
              />
              <span
                className="text-[11px] font-bold tracking-[0.2em] uppercase"
                style={{ color: 'var(--color-earth)' }}
              >
                Entrar
              </span>
            </div>
            <h2
              className="leading-tight mb-3"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.7rem, 4vw, 2.15rem)',
                fontWeight: 800,
                color: 'var(--color-frutificar-deep)',
                letterSpacing: '-0.035em',
              }}
            >
              Bem-vindo de volta.
            </h2>
            <p style={{ color: 'oklch(0.48 0.04 144)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Acesse sua conta para continuar aprendendo e crescendo.
            </p>
          </div>

          {/* Formulário */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel
                      className="text-[13px] font-semibold"
                      style={{ color: 'oklch(0.32 0.05 144)' }}
                    >
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="voce@email.com"
                        className="h-12 bg-white rounded-lg text-sm"
                        style={{
                          borderColor: 'oklch(0.88 0.03 144)',
                          color: 'var(--color-frutificar-deep)',
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1.5">
                      <FormLabel
                        className="text-[13px] font-semibold"
                        style={{ color: 'oklch(0.32 0.05 144)' }}
                      >
                        Senha
                      </FormLabel>
                      <Link
                        href="#"
                        className="text-[12px] font-semibold hover:underline underline-offset-2"
                        style={{ color: 'var(--color-frutificar-green)' }}
                      >
                        Esqueceu?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 bg-white rounded-lg text-sm"
                        style={{ borderColor: 'oklch(0.88 0.03 144)' }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div
                  className="text-sm font-medium px-4 py-3 rounded-lg"
                  style={{
                    background: 'oklch(0.95 0.03 27)',
                    color: 'oklch(0.45 0.2 27)',
                    border: '1px solid oklch(0.88 0.06 27)',
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-white font-bold text-[15px] rounded-lg mt-1 transition-opacity hover:opacity-90"
                disabled={loading}
                style={{
                  background: loading
                    ? 'var(--color-frutificar-forest)'
                    : 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)',
                  border: 'none',
                  letterSpacing: '0.01em',
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>

          {/* DEV PREVIEW — remover quando banco estiver rodando */}
          <div className="mt-4">
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'oklch(0.88 0.03 144)' }} />
              <span className="text-xs font-medium" style={{ color: 'oklch(0.65 0.02 144)' }}>preview</span>
              <div className="flex-1 h-px" style={{ background: 'oklch(0.88 0.03 144)' }} />
            </div>
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full h-11 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                background: 'oklch(0.48 0.13 144 / 0.08)',
                color: 'var(--color-frutificar-forest)',
                border: '1px dashed oklch(0.48 0.13 144 / 0.3)',
              }}
            >
              Entrar como aluno (sem banco)
            </Link>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'oklch(0.52 0.03 144)' }}>
            Não tem conta?{' '}
            <Link
              href="/cadastro"
              className="font-bold hover:underline underline-offset-2"
              style={{ color: 'var(--color-frutificar-forest)' }}
            >
              Criar conta gratuita
            </Link>
          </p>
        </div>

        {/* Rodapé */}
        <div className="px-7 lg:px-12 py-5">
          <p className="text-[11px]" style={{ color: 'oklch(0.65 0.02 144)' }}>
            © 2026 Frutificar Digital · frutificar.com.br
          </p>
        </div>
      </div>
    </div>
  )
}
