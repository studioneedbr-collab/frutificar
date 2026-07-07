'use client'

import { useState } from 'react'
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
import { ArrowLeft, MailCheck } from 'lucide-react'
import { requestPasswordReset } from '@/server/actions/auth'

const schema = z.object({ email: z.string().email('Email inválido') })
type FormValues = z.infer<typeof schema>

export default function EsqueciSenhaPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: FormValues) {
    setLoading(true)
    await requestPasswordReset(data)
    setLoading(false)
    // Resposta sempre igual, exista ou não a conta (não vazamos e-mails cadastrados).
    setSent(true)
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-parchment)' }}
    >
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
        {sent ? (
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'oklch(0.36 0.11 144 / 0.12)' }}
            >
              <MailCheck size={32} style={{ color: 'var(--color-frutificar-green)' }} />
            </div>
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
              Verifique seu e-mail
            </h2>
            <p style={{ color: 'oklch(0.48 0.04 144)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha.
              O link expira em 1 hora.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-earth)' }} />
                <span
                  className="text-[11px] font-bold tracking-[0.2em] uppercase"
                  style={{ color: 'var(--color-earth)' }}
                >
                  Recuperar acesso
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
                Esqueceu a senha?
              </h2>
              <p style={{ color: 'oklch(0.48 0.04 144)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm mt-6" style={{ color: 'oklch(0.52 0.03 144)' }}>
              Lembrou a senha?{' '}
              <Link
                href="/login"
                className="font-bold hover:underline underline-offset-2"
                style={{ color: 'var(--color-frutificar-forest)' }}
              >
                Entrar
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
