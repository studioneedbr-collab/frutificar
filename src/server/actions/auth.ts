'use server'

import { z } from 'zod'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import type { ActionResult } from '@/lib/action-types'

const TRIAL_DAYS = 7

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido.'),
    password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória.'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

export async function registerUser(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const { name, email, password } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return { ok: false, error: 'Este e-mail já está cadastrado.' }
    }

    const plan = await prisma.plan.findUnique({ where: { name: 'ESSENCIAL' }, select: { id: true } })
    if (!plan) {
      return { ok: false, error: 'Plano indisponível. Tente novamente em instantes.' }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const periodEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
    const token = randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'STUDENT',
          emailVerified: null,
          subscription: {
            create: {
              planId: plan.id,
              status: 'ACTIVE',
              currentPeriodEnd: periodEnd,
            },
          },
        },
      }),
      prisma.verificationToken.create({
        data: { identifier: email, token, expires: tokenExpires },
      }),
    ])

    await sendVerificationEmail(email, token)
    return { ok: true, data: undefined }
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'Este e-mail já está cadastrado.' }
    }
    return { ok: false, error: 'Erro ao criar conta.' }
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
