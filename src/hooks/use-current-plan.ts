'use client'

import { useSession } from 'next-auth/react'
import { PLAN_FEATURES } from '@/lib/constants'
import type { PlanName } from '@prisma/client'

export function useCurrentPlan() {
  const { data: session, status } = useSession()
  const plan = (session?.user?.plan ?? null) as PlanName | null

  function canAccess(feature: string): boolean {
    if (!plan) return false
    return (PLAN_FEATURES[plan] as readonly string[]).includes(feature)
  }

  return {
    plan,
    isLoading: status === 'loading',
    canAccess,
  }
}
