import type { PlanName } from '@prisma/client'

export const PLAN_HIERARCHY: Record<PlanName, number> = {
  ESSENCIAL: 1,
  PREMIUM: 2,
  GOLD: 3,
}

export const PLAN_FEATURES: Record<PlanName, string[]> = {
  ESSENCIAL: ['courses', 'lives', 'podcasts'],
  PREMIUM: ['courses', 'lives', 'podcasts', 'chat', 'diagnostic', 'minicourses', 'visits', 'management', 'services'],
  GOLD: ['courses', 'lives', 'podcasts', 'chat', 'diagnostic', 'minicourses', 'visits', 'management', 'services', 'field_days', 'tutoring'],
}

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  CADASTRO: '/cadastro',
  PLANOS: '/planos',

  // App
  DASHBOARD: '/dashboard',
  CURSOS: '/cursos',
  CHAT: '/chat',
  LIVES: '/lives',
  DIAGNOSTICO: '/diagnostico',
  PODCASTS: '/podcasts',
  AGENDAMENTOS: '/agendamentos',
  SERVICOS: '/servicos',
  GESTAO: '/gestao',
  PROPRIEDADES: '/propriedades',
  DIAS_DE_CAMPO: '/dias-de-campo',
  PERFIL: '/perfil',
  ASSINATURA: '/perfil/assinatura',

  // Admin
  ADMIN: '/admin',
} as const

export const PLANS = {
  ESSENCIAL: 'ESSENCIAL',
  PREMIUM: 'PREMIUM',
  GOLD: 'GOLD',
} as const satisfies Record<PlanName, PlanName>
