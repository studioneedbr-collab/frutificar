# Cadastro Real de Usuário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a página `/cadastro` funcional — cria User no banco com assinatura Essencial em trial de 7 dias, faz login automático para `/dashboard`, e inicia verificação de e-mail "soft" (não bloqueante).

**Architecture:** Server Action (`registerUser`) seguindo o padrão de `profile.ts`. Trial = `Subscription` com `status: ACTIVE` + `currentPeriodEnd = hoje+7d` (sem novo enum). Verificação soft via `VerificationToken` (NextAuth) + rota `/verificar-email` + helper de e-mail que loga no console enquanto o Resend é placeholder. O `(app)/layout.tsx` passa a usar a sessão real do NextAuth (des-mock) para o login automático, header e banner funcionarem.

**Tech Stack:** Next.js 16 (App Router), Prisma 7 (+ driver adapter pg), NextAuth v5 (Credentials, JWT), bcryptjs, zod, react-hook-form, Supabase Postgres.

**Verificação:** O projeto não tem suíte de testes automatizada. Cada task verifica com `npx tsc --noEmit` (type-check), `npm run build` quando relevante, scripts Node de checagem no banco, e fluxo manual no fim. Commits frequentes.

---

## Estrutura de arquivos

| Arquivo | Ação | Responsabilidade |
|---------|------|------------------|
| `prisma/schema.prisma` | Modify | Adicionar `emailVerified DateTime?` ao `User` |
| `prisma/migrations/20260625000000_add_email_verified/migration.sql` | Create | SQL do ALTER TABLE (migration escrita à mão p/ Supabase) |
| `prisma/seed-plans.ts` | Create | Seed só dos 3 planos (Essencial/Premium/Gold) |
| `package.json` | Modify | Script `db:seed:plans` |
| `src/lib/email.ts` | Create | `sendVerificationEmail()` — stub que loga enquanto Resend é placeholder |
| `src/server/actions/auth.ts` | Create | Server action `registerUser` |
| `src/lib/auth.ts` | Modify | Expor `emailVerified` no `authorize`/`jwt`/`session` |
| `src/types/next-auth.d.ts` | Modify | Tipos de `emailVerified` em Session/JWT/User |
| `src/app/(public)/cadastro/page.tsx` | Modify | `onSubmit` real (registerUser + signIn) + senha min 8 |
| `src/app/(public)/verificar-email/page.tsx` | Create | Confirma o token e seta `emailVerified` |
| `src/app/(app)/layout.tsx` | Modify | Trocar MOCK_SESSION por `auth()` real + proteção de rota |
| `src/components/shared/email-verification-banner.tsx` | Create | Banner "confirme seu e-mail" |

---

## Task 1: Migration — adicionar `emailVerified` ao User

**Files:**
- Modify: `prisma/schema.prisma` (model User)
- Create: `prisma/migrations/20260625000000_add_email_verified/migration.sql`

- [ ] **Step 1: Adicionar o campo no schema**

No `prisma/schema.prisma`, dentro de `model User`, logo após a linha `role         Role      @default(STUDENT)`, adicionar:

```prisma
  emailVerified DateTime?
```

- [ ] **Step 2: Criar a migration SQL à mão**

Criar `prisma/migrations/20260625000000_add_email_verified/migration.sql` com:

```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" TIMESTAMP(3);
```

(Migration escrita à mão porque `prisma migrate dev` exige shadow database, que o pooler do Supabase não permite criar. O timestamp `20260625000000` é posterior às migrations existentes, então o `deploy` aplica em ordem.)

- [ ] **Step 3: Aplicar no Supabase e regenerar o client**

Run:
```bash
npx prisma migrate deploy
npx prisma generate
```
Expected: `1 migration(s) deployed` (a `20260625000000_add_email_verified`) e client regenerado.

- [ ] **Step 4: Verificar a coluna no banco**

Run:
```bash
node -e "require('dotenv/config');const{Pool}=require('pg');const p=new Pool({connectionString:process.env.DIRECT_URL});p.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='User' AND column_name='emailVerified'\").then(r=>{console.log(r.rowCount?'OK emailVerified existe':'FALHOU');p.end()})"
```
Expected: `OK emailVerified existe`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): adiciona User.emailVerified (verificacao de e-mail)"
```

---

## Task 2: Seed dos 3 planos no Supabase

**Files:**
- Create: `prisma/seed-plans.ts`
- Modify: `package.json`

- [ ] **Step 1: Criar `prisma/seed-plans.ts`**

```ts
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, PlanName } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const essencialFeatures = {
  cursos: true, modulosBasicos: true, chatIA: false, downloadMateriais: false,
  visitaTecnica: false, gestaoPropriedade: true, maxPropriedades: 1, podcast: true,
  lives: false, suportePrioritario: false, certificados: false, minicursos: false,
}
const premiumFeatures = {
  cursos: true, modulosBasicos: true, chatIA: true, downloadMateriais: true,
  visitaTecnica: false, gestaoPropriedade: true, maxPropriedades: 3, podcast: true,
  lives: true, suportePrioritario: false, certificados: true, minicursos: true,
}
const goldFeatures = {
  cursos: true, modulosBasicos: true, chatIA: true, downloadMateriais: true,
  visitaTecnica: true, gestaoPropriedade: true, maxPropriedades: 10, podcast: true,
  lives: true, suportePrioritario: true, certificados: true, minicursos: true,
}

async function main() {
  await prisma.plan.upsert({
    where: { name: PlanName.ESSENCIAL }, update: { priceMonthly: 47, features: essencialFeatures },
    create: { name: PlanName.ESSENCIAL, priceMonthly: 47, features: essencialFeatures, maxProperties: 1 },
  })
  await prisma.plan.upsert({
    where: { name: PlanName.PREMIUM }, update: { priceMonthly: 97, features: premiumFeatures },
    create: { name: PlanName.PREMIUM, priceMonthly: 97, features: premiumFeatures, maxProperties: 3 },
  })
  await prisma.plan.upsert({
    where: { name: PlanName.GOLD }, update: { priceMonthly: 197, features: goldFeatures },
    create: { name: PlanName.GOLD, priceMonthly: 197, features: goldFeatures, maxProperties: 10 },
  })
  console.log('Planos seedados: Essencial R$47 · Premium R$97 · Gold R$197')
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
```

- [ ] **Step 2: Adicionar o script no `package.json`**

Em `scripts`, logo após `"db:seed": "prisma db seed",` adicionar:

```json
    "db:seed:plans": "tsx prisma/seed-plans.ts",
```

- [ ] **Step 3: Rodar o seed dos planos**

Run: `npm run db:seed:plans`
Expected: `Planos seedados: Essencial R$47 · Premium R$97 · Gold R$197`

- [ ] **Step 4: Verificar no banco**

Run:
```bash
node -e "require('dotenv/config');const{Pool}=require('pg');const p=new Pool({connectionString:process.env.DIRECT_URL});p.query('SELECT name FROM \"Plan\" ORDER BY name').then(r=>{console.log(r.rows.map(x=>x.name).join(', '));p.end()})"
```
Expected: `ESSENCIAL, GOLD, PREMIUM`

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-plans.ts package.json
git commit -m "feat(db): seed dos 3 planos (script db:seed:plans)"
```

---

## Task 3: Helper de e-mail (stub do Resend)

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: Criar `src/lib/email.ts`**

```ts
import 'server-only'

/**
 * Envia o e-mail de verificação. Enquanto RESEND_API_KEY for placeholder/vazio,
 * apenas loga o link no console (não lança erro). Quando a chave real existir,
 * trocar o corpo por uma chamada ao Resend — a assinatura permanece igual.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const link = `${baseUrl}/verificar-email?token=${token}`
  const key = process.env.RESEND_API_KEY

  if (!key || key === 'placeholder') {
    console.info(`[email:stub] Verificação para ${email}: ${link}`)
    return
  }

  // TODO(resend): quando a chave real existir, enviar via Resend aqui.
  console.info(`[email] Verificação para ${email}: ${link}`)
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros novos relacionados a `email.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat(email): helper sendVerificationEmail (stub enquanto Resend e placeholder)"
```

---

## Task 4: Server Action `registerUser`

**Files:**
- Create: `src/server/actions/auth.ts`

- [ ] **Step 1: Criar `src/server/actions/auth.ts`**

```ts
'use server'

import { z } from 'zod'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros (confirma que `subscription`, `verificationToken` e os enums batem com o client gerado).

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/auth.ts
git commit -m "feat(auth): server action registerUser (User + trial Essencial 7d + token)"
```

---

## Task 5: Expor `emailVerified` no NextAuth

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/types/next-auth.d.ts`

- [ ] **Step 1: Tipar `emailVerified` em `src/types/next-auth.d.ts`**

Substituir o conteúdo inteiro do arquivo por:

```ts
import type { Role, PlanName } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      plan: PlanName | null
      emailVerified: boolean
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    emailVerified: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    plan: PlanName | null
    emailVerified: boolean
  }
}
```

- [ ] **Step 2: Atualizar `authorize`, `jwt` e `session` em `src/lib/auth.ts`**

No `authorize`, atualizar o `select` e o objeto retornado:

```ts
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, passwordHash: true, role: true, deletedAt: true, emailVerified: true },
        })

        if (!user || user.deletedAt) return null
        if (!user.passwordHash) return null

        const passwordValid = await bcrypt.compare(password, user.passwordHash)
        if (!passwordValid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified != null }
```

No callback `jwt`, dentro do `if (user) { ... }`, adicionar após `token.role = user.role`:

```ts
        token.emailVerified = user.emailVerified
```

No callback `session`, dentro do `if (token && session.user) { ... }`, adicionar:

```ts
        session.user.emailVerified = token.emailVerified as boolean
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros (o retorno do `authorize` agora satisfaz a interface `User` com `emailVerified`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/types/next-auth.d.ts
git commit -m "feat(auth): expoe emailVerified na sessao/JWT"
```

---

## Task 6: Ligar a página `/cadastro` (registerUser + login automático)

**Files:**
- Modify: `src/app/(public)/cadastro/page.tsx`

- [ ] **Step 1: Atualizar imports e o schema de senha (min 8)**

No topo do arquivo, adicionar aos imports existentes:

```ts
import { signIn } from 'next-auth/react'
import { registerUser } from '@/server/actions/auth'
```

No `cadastroSchema`, trocar as duas linhas de senha de `min(6, ...)` para:

```ts
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirmação de senha obrigatória'),
```

- [ ] **Step 2: Substituir o corpo do `onSubmit`**

Trocar a função `onSubmit` inteira (o bloco mock com `setTimeout`) por:

```ts
  async function onSubmit(data: CadastroForm) {
    setLoading(true)
    setError(null)

    const result = await registerUser(data)
    if (!result.ok) {
      setLoading(false)
      setError(result.error)
      return
    }

    const signInResult = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (signInResult?.error) {
      // Conta criada, mas o login automático falhou: manda pro login manual.
      router.push('/login')
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/cadastro/page.tsx"
git commit -m "feat(cadastro): onSubmit real (registerUser + login automatico -> dashboard)"
```

---

## Task 7: Rota de verificação de e-mail

**Files:**
- Create: `src/app/(public)/verificar-email/page.tsx`

- [ ] **Step 1: Criar `src/app/(public)/verificar-email/page.tsx`**

```tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  let status: 'ok' | 'invalid' = 'invalid'

  if (token) {
    const record = await prisma.verificationToken.findUnique({ where: { token } })
    if (record && record.expires > new Date()) {
      await prisma.$transaction([
        prisma.user.update({
          where: { email: record.identifier },
          data: { emailVerified: new Date() },
        }),
        prisma.verificationToken.delete({ where: { token } }),
      ])
      status = 'ok'
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-parchment)' }}
    >
      <div className="text-center px-6 max-w-sm">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }} className="mb-3">
          {status === 'ok' ? 'E-mail confirmado!' : 'Link inválido ou expirado'}
        </h2>
        <p className="mb-6 text-sm opacity-80">
          {status === 'ok'
            ? 'Sua conta foi verificada com sucesso.'
            : 'O link de verificação não é válido ou já expirou. Faça login para reenviar.'}
        </p>
        <Link
          href={status === 'ok' ? '/dashboard' : '/login'}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: 'var(--color-frutificar-green)', color: 'white' }}
        >
          {status === 'ok' ? 'Ir para o dashboard' : 'Ir para o login'}
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/verificar-email/page.tsx"
git commit -m "feat(auth): rota /verificar-email confirma o token e seta emailVerified"
```

---

## Task 8: Des-mockar o `(app)/layout.tsx` (sessão real + proteção)

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Substituir o arquivo inteiro**

```tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { EmailVerificationBanner } from '@/components/shared/email-verification-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const userPlan = session.user.plan

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userPlan={userPlan} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header userPlan={userPlan} userName={session.user.name ?? 'Usuário'} />
        {!session.user.emailVerified && <EmailVerificationBanner />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

(O componente `EmailVerificationBanner` é criado na Task 9; este arquivo já o importa. Faça a Task 9 antes do build da Task 10.)

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: erro apenas em `email-verification-banner` por ainda não existir — resolvido na Task 9. Demais linhas sem erro.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/layout.tsx"
git commit -m "feat(app): layout usa sessao real do NextAuth + protege rota"
```

---

## Task 9: Banner "confirme seu e-mail"

**Files:**
- Create: `src/components/shared/email-verification-banner.tsx`

- [ ] **Step 1: Criar `src/components/shared/email-verification-banner.tsx`**

```tsx
import { MailWarning } from 'lucide-react'

export function EmailVerificationBanner() {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
      style={{ background: 'oklch(0.92 0.06 75)', color: 'oklch(0.4 0.09 60)' }}
    >
      <MailWarning size={16} className="shrink-0" />
      <span>
        Confirme seu e-mail para garantir o acesso à sua conta. Verifique sua caixa de entrada.
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: sem erros (a importação na Task 8 agora resolve).

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/email-verification-banner.tsx
git commit -m "feat(app): banner de verificacao de e-mail (soft)"
```

---

## Task 10: Build final + verificação manual ponta a ponta

**Files:** nenhum (verificação)

- [ ] **Step 1: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros; rotas `/cadastro` e `/verificar-email` aparecem na listagem.

- [ ] **Step 2: Subir o dev server**

Run: `npm run dev` (deixar rodando em outro terminal)
Expected: app sobe em `http://localhost:3000`.

- [ ] **Step 3: Fluxo manual de cadastro**

1. Abrir `http://localhost:3000/cadastro`.
2. Preencher nome, e-mail novo, senha (≥8) igual nos dois campos, enviar.
3. Esperado: tela de sucesso e redirecionamento para `/dashboard` (já logado; header mostra o nome real e plano **Essencial**).
4. Esperado: banner "Confirme seu e-mail" visível no topo.

- [ ] **Step 4: Conferir User + Subscription no banco**

Run:
```bash
node -e "require('dotenv/config');const{Pool}=require('pg');const p=new Pool({connectionString:process.env.DIRECT_URL});p.query('SELECT u.email,u.\"emailVerified\",s.status,s.\"currentPeriodEnd\" FROM \"User\" u JOIN \"Subscription\" s ON s.\"userId\"=u.id ORDER BY u.\"createdAt\" DESC LIMIT 1').then(r=>{console.log(r.rows[0]);p.end()})"
```
Expected: o e-mail cadastrado, `emailVerified: null`, `status: ACTIVE`, `currentPeriodEnd` ~7 dias à frente.

- [ ] **Step 5: Confirmar o e-mail**

1. Pegar o link `[email:stub] Verificação para ...` impresso no console do dev server.
2. Abrir o link no navegador (logado).
3. Esperado: página "E-mail confirmado!"; ao recarregar `/dashboard` após novo login, o banner some (o `emailVerified` no JWT atualiza no próximo login).

- [ ] **Step 6: Conferir duplicidade**

1. Tentar cadastrar o mesmo e-mail de novo.
2. Esperado: erro "Este e-mail já está cadastrado."

- [ ] **Step 7: Commit final (se houver ajuste) e push**

```bash
git push origin main
```
Expected: push aceito; redeploy na Vercel disparado.

---

## Notas de implementação

- **Banner após verificar:** como o `emailVerified` vive no JWT, ele só reflete `true` no próximo login. Aceitável para verificação soft (a página de confirmação já dá o feedback imediato). Forçar refresh de sessão é follow-up opcional (YAGNI).
- **`NEXTAUTH_URL`:** o link de verificação usa `process.env.NEXTAUTH_URL`. Em produção, definir a URL real no Vercel (já anotado nas variáveis de ambiente).
- **Resend:** quando a chave real entrar, trocar só o corpo de `sendVerificationEmail` — nenhuma outra mudança.
- **Páginas internas mockadas:** seguem com dados mock; de-mock de cada página é trabalho separado (fora deste plano).
```
