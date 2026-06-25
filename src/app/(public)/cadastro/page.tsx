'use client'

import { useState } from 'react'
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
import { ArrowLeft, Sprout } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { registerUser } from '@/server/actions/auth'

const cadastroSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type CadastroForm = z.infer<typeof cadastroSchema>

const plans = [
  { name: 'Essencial', desc: 'Cursos e conteúdo base', color: 'oklch(0.55 0.1 220)' },
  { name: 'Premium', desc: 'Tudo + IA e gestão', color: 'oklch(0.62 0.12 55)' },
  { name: 'Gold', desc: 'Acesso total + tutoria', color: 'oklch(0.75 0.15 75)' },
]

export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CadastroForm>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(data: CadastroForm) {
    setLoading(true)
    setError(null)

    const result = await registerUser(data)
    if (!result.ok) {
      setLoading(false)
      setError(result.error)
      return
    }

    const signInResult = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (signInResult?.error) {
      // Conta criada, mas o login automático falhou: manda pro login manual.
      router.push('/login')
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-parchment)' }}
      >
        <div className="text-center px-6 max-w-sm">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'oklch(0.36 0.11 144 / 0.12)' }}
          >
            <Sprout size={32} style={{ color: 'var(--color-frutificar-green)' }} />
          </div>
          <h2
            className="mb-2"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--color-frutificar-deep)',
              letterSpacing: '-0.03em',
            }}
          >
            Conta criada!
          </h2>
          <p style={{ color: 'oklch(0.5 0.04 144)', fontSize: '0.9rem' }}>
            Redirecionando para o login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 100% 0%, oklch(0.62 0.12 55 / 0.13) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 0% 100%, oklch(0.48 0.13 144 / 0.4) 0%, transparent 65%),
            linear-gradient(168deg, oklch(0.18 0.08 150) 0%, oklch(0.13 0.06 148) 100%)
          `,
        }}
      >
        <FrutificarLogo white size={26} />

        <div className="relative z-10">
          <p
            className="text-xs font-bold tracking-[0.22em] uppercase mb-7"
            style={{ color: 'var(--color-earth)' }}
          >
            Comece hoje mesmo
          </p>

          <h1
            className="text-white leading-[1.12] mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.9rem, 3.2vw, 2.6rem)',
              fontWeight: 700,
            }}
          >
            Sua jornada<br />
            começa aqui.
          </h1>

          <p
            className="leading-relaxed mb-10"
            style={{
              color: 'oklch(0.84 0.04 144)',
              fontSize: '0.92rem',
              maxWidth: '30ch',
            }}
          >
            Escolha seu plano e tenha acesso imediato a todo o conteúdo da plataforma.
          </p>

          {/* Planos */}
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'oklch(1 0 0 / 0.06)', border: '1px solid oklch(1 0 0 / 0.1)' }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: plan.color }}
                />
                <div>
                  <p className="text-white text-sm font-semibold leading-none mb-0.5">
                    {plan.name}
                  </p>
                  <p className="text-[12px]" style={{ color: 'oklch(0.72 0.04 144)' }}>
                    {plan.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'oklch(0.55 0.04 144)', fontSize: '0.73rem' }}>
          © 2026 Frutificar Digital
        </p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ background: 'var(--color-parchment)' }}
      >
        {/* Nav topo */}
        <div className="flex items-center justify-between px-7 py-5 lg:px-12">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
            style={{ color: 'var(--color-frutificar-forest)' }}
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Entrar
          </Link>
          <div className="lg:hidden">
            <FrutificarLogo size={22} />
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 flex flex-col justify-center px-7 lg:px-14 xl:px-16 py-8 w-full max-w-xl mx-auto">
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
                Criar conta
              </span>
            </div>
            <h2
              className="leading-tight mb-3"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.7rem, 4vw, 2.1rem)',
                fontWeight: 800,
                color: 'var(--color-frutificar-deep)',
                letterSpacing: '-0.035em',
              }}
            >
              Comece gratuitamente.
            </h2>
            <p style={{ color: 'oklch(0.48 0.04 144)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Crie sua conta e explore o conteúdo da plataforma.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold" style={{ color: 'oklch(0.32 0.05 144)' }}>
                      Nome completo
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="João Silva"
                        className="h-12 bg-white rounded-lg text-sm"
                        style={{ borderColor: 'oklch(0.88 0.03 144)' }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold" style={{ color: 'oklch(0.32 0.05 144)' }}>
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="voce@email.com"
                        className="h-12 bg-white rounded-lg text-sm"
                        style={{ borderColor: 'oklch(0.88 0.03 144)' }}
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
                    <FormLabel className="text-[13px] font-semibold" style={{ color: 'oklch(0.32 0.05 144)' }}>
                      Senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mín. 6 caracteres"
                        className="h-12 bg-white rounded-lg text-sm"
                        style={{ borderColor: 'oklch(0.88 0.03 144)' }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold" style={{ color: 'oklch(0.32 0.05 144)' }}>
                      Confirmar senha
                    </FormLabel>
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
                className="w-full h-12 text-white font-bold text-[15px] rounded-lg mt-2 transition-opacity hover:opacity-90"
                disabled={loading}
                style={{
                  background: loading
                    ? 'var(--color-frutificar-forest)'
                    : 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)',
                  border: 'none',
                  letterSpacing: '0.01em',
                }}
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm mt-7" style={{ color: 'oklch(0.52 0.03 144)' }}>
            Já tem conta?{' '}
            <Link
              href="/login"
              className="font-bold hover:underline underline-offset-2"
              style={{ color: 'var(--color-frutificar-forest)' }}
            >
              Entrar
            </Link>
          </p>
        </div>

        <div className="px-7 lg:px-12 py-5">
          <p className="text-[11px]" style={{ color: 'oklch(0.65 0.02 144)' }}>
            © 2026 Frutificar Digital · frutificar.com.br
          </p>
        </div>
      </div>
    </div>
  )
}
