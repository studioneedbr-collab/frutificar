// DEV PREVIEW: renderiza em request-time (depende de banco/sessão); evita prerender sem DB.
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'

export default async function PlanosPage() {
  const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } })

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
        <h1
          className="text-4xl font-bold text-center mb-4"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          Planos e Preços
        </h1>
        <p className="text-center text-muted-foreground mb-12">
          Escolha o plano ideal para sua propriedade
        </p>

        {plans.length === 0 ? (
          <p className="text-center text-muted-foreground">Planos em breve.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => {
              const features = plan.features as Record<string, unknown>
              const isPremium = plan.name === 'PREMIUM'
              return (
                <Card
                  key={plan.name}
                  className={isPremium ? 'border-primary shadow-lg md:scale-105' : ''}
                >
                  {isPremium && (
                    <div
                      className="text-center text-xs font-semibold py-1 rounded-t-lg text-white"
                      style={{ background: 'var(--color-frutificar-green)' }}
                    >
                      MAIS POPULAR
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {Number(plan.priceMonthly) === 0
                        ? 'Gratuito'
                        : `R$ ${Number(plan.priceMonthly).toFixed(2)}`}
                      {Number(plan.priceMonthly) > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {Object.entries(features).map(([key, value]) => (
                        <li key={key} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">
                            <span className="font-medium text-foreground">{key}:</span> {String(value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isPremium ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/cadastro">Começar</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}