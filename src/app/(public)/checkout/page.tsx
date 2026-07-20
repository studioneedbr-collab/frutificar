export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { asaasConfigured } from '@/lib/asaas'
import { CheckoutView } from './checkout-view'

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  })
  if (!sub) redirect('/planos')
  if (sub.status === 'ACTIVE') redirect('/dashboard')

  return (
    <CheckoutView
      planName={sub.plan.name}
      price={Number(sub.plan.priceMonthly)}
      configured={asaasConfigured()}
    />
  )
}
