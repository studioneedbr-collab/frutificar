import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PLAN_FEATURES } from '@/lib/constants'
import { Check, Lock } from 'lucide-react'
import Link from 'next/link'
import type { PlanName } from '@prisma/client'

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueado?: string; reason?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  })

  const allPlans = await prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } })
  const currentPlanName = subscription?.plan?.name as PlanName | undefined
  const blockedFeature = params.bloqueado

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Minha Assinatura</h1>
        {blockedFeature && (
          <div className="mt-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" />
            O recurso <strong>{blockedFeature}</strong> não está disponível no seu plano atual. Faça upgrade para continuar.
          </div>
        )}
      </div>

      {subscription ? (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plano Atual</CardTitle>
              <Badge>{currentPlanName}</Badge>
            </div>
            <CardDescription>
              Válido até {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {currentPlanName && PLAN_FEATURES[currentPlanName].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Você não possui uma assinatura ativa.
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Planos disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allPlans.map((plan) => {
            const isCurrent = plan.name === currentPlanName
            return (
              <Card key={plan.name} className={isCurrent ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {isCurrent && <Badge variant="secondary">Atual</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {(PLAN_FEATURES[plan.name as PlanName] ?? []).map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/planos">Ver detalhes</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
