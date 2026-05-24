import { auth } from '@/lib/auth'
import { canAccessFeature } from '@/lib/access-control'
import type { Feature } from '@/lib/constants'

interface PlanGateProps {
  feature: Feature
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function PlanGate({ feature, children, fallback = null }: PlanGateProps) {
  const session = await auth()
  const plan = session?.user?.plan ?? null
  if (!canAccessFeature(plan, feature)) return <>{fallback}</>
  return <>{children}</>
}
