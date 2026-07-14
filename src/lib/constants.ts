import type { PlanName } from '@prisma/client'

export const PLAN_HIERARCHY: Record<PlanName, number> = {
  ESSENCIAL: 1,
  PREMIUM: 2,
  GOLD: 3,
}

// Alinhado ao que cada plano anuncia em /planos (features do banco):
//  Essencial → cursos, podcasts, gestão (e serviços/suporte)
//  Premium   → + chat IA, diagnóstico, minicursos, lives, materiais
//  Gold      → + visita técnica/agendamento, dias de campo, tutoria
export const PLAN_FEATURES = {
  ESSENCIAL: ['courses', 'podcasts', 'management', 'services'] as const,
  PREMIUM: ['courses', 'podcasts', 'management', 'services', 'chat', 'diagnostic', 'minicourses', 'live_streams'] as const,
  GOLD: ['courses', 'podcasts', 'management', 'services', 'chat', 'diagnostic', 'minicourses', 'live_streams', 'visits', 'field_days', 'tutoring'] as const,
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
