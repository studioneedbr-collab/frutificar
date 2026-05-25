import type { PlanName } from '@prisma/client'

export const PLAN_HIERARCHY: Record<PlanName, number> = {
  ESSENCIAL: 1,
  PREMIUM: 2,
  GOLD: 3,
}

export const PLAN_FEATURES = {
  ESSENCIAL: ['courses', 'chat', 'diagnostic'] as const,
  PREMIUM: ['courses', 'chat', 'diagnostic', 'minicourses', 'visits', 'management', 'services', 'podcasts', 'live_streams'] as const,
  GOLD: ['courses', 'chat', 'diagnostic', 'minicourses', 'visits', 'management', 'services', 'podcasts', 'live_streams', 'field_days', 'tutoring'] as const,
} as const satisfies Record<PlanName, readonly string[]>

export type Feature = typeof PLAN_FEATURES[PlanName][number]

// Dashboard accessible to all authenticated users regardless of plan
export const ROUTE_FEATURE_MAP: Record<string, Feature> = {
  '/cursos': 'courses',
  '/chat': 'chat',
  '/diagnostico': 'diagnostic',
  '/minicursos': 'minicourses',
  '/agendamentos': 'visits',
  '/gestao': 'management',
  '/servicos': 'services',
  '/podcasts': 'podcasts',
  '/lives': 'live_streams',
  '/dias-de-campo': 'field_days',
  '/tutoring': 'tutoring',
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
