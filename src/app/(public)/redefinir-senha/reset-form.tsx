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
import Link from 'next/link'
import { resetPassword } from '@/server/actions/auth'

const schema = z
  .object({
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetForm({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(data: FormValues) {
    setLoading(true)
    setError(null)
    const result = await resetPassword({ token, ...data })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 1800)
  }

  if (done) {
    return (
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
          Senha redefinida!
        </h2>
        <p style={{ color: 'oklch(0.48 0.04 144)', fontSize: '0.9rem' }}>
          Redirecionando para o login...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-earth)' }} />
          <span
            className="text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--color-earth)' }}
          >
            Nova senha
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
          Crie uma nova senha
        </h2>
        <p style={{ color: 'oklch(0.48 0.04 144)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Escolha uma senha com pelo menos 8 caracteres.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-semibold" style={{ color: 'oklch(0.32 0.05 144)' }}>
                  Nova senha
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Mín. 8 caracteres"
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
            className="w-full h-12 text-white font-bold text-[15px] rounded-lg mt-1 transition-opacity hover:opacity-90"
            disabled={loading}
            style={{
              background: loading
                ? 'var(--color-frutificar-forest)'
                : 'linear-gradient(130deg, var(--color-frutificar-night) 0%, var(--color-frutificar-forest) 100%)',
              border: 'none',
            }}
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm mt-6" style={{ color: 'oklch(0.52 0.03 144)' }}>
        <Link
          href="/login"
          className="font-bold hover:underline underline-offset-2"
          style={{ color: 'var(--color-frutificar-forest)' }}
        >
          Voltar ao login
        </Link>
      </p>
    </>
  )
}
