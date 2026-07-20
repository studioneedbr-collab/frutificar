# Pagamentos recorrentes com Asaas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrar a assinatura mensal dos alunos de forma recorrente e automática via Asaas (cartão, PIX e boleto), liberando o acesso somente após o pagamento confirmado.

**Architecture:** Cliente REST fino para o Asaas + checkout embutido (branded) + webhook como fonte da verdade do status. A trava de acesso reaproveita o comportamento atual (JWT zera o plano quando a assinatura não está `ACTIVE`); o webhook flipa o status e o histórico de pagamentos passa a ser real.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma 7 (driver adapter), Asaas REST API v3, NextAuth v5 (JWT). Sem framework de testes no projeto — verificação por `tsx` scripts contra o **sandbox do Asaas** + build + E2E manual.

**Referência:** `docs/superpowers/specs/2026-07-17-pagamentos-asaas-design.md`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---------|-----------------|------|
| `src/env.ts` | Declara `ASAAS_*` | Modificar |
| `.env.example` | Documentar novas vars | Modificar (criar se não existir) |
| `prisma/schema.prisma` | `User.cpfCnpj/phone`, `SubscriptionStatus.PENDING`, `Payment.gatewayPaymentId` | Modificar |
| `src/lib/asaas.ts` | Wrapper da API do Asaas | Criar |
| `src/lib/asaas.types.ts` | Tipos de request/response do Asaas | Criar |
| `src/server/repositories/billing.repository.ts` | Persistência de assinatura/pagamento ligada ao gateway | Criar |
| `src/server/actions/auth.ts` | `registerUser` coleta CPF/plano e cria cliente+assinatura pendente | Modificar |
| `src/app/(public)/cadastro/page.tsx` | Form com CPF/CNPJ, telefone, plano | Modificar |
| `src/server/actions/checkout.ts` | Actions do checkout (cartão/PIX/boleto) | Criar |
| `src/app/(public)/checkout/page.tsx` + `checkout-view.tsx` | UI do checkout embutido | Criar |
| `src/app/api/webhooks/asaas/route.ts` | Recebe eventos e atualiza estado | Criar |
| `src/lib/asaas-webhook.ts` | Função pura: evento → mudança de estado | Criar |
| `src/proxy.ts` | Redirecionar pendente → `/checkout` | Modificar |
| `src/app/(app)/perfil/assinatura/*` | Status real + cancelar | Modificar |
| `scripts/asaas-smoke.mts` | Verificação contra sandbox | Criar (temporário) |

---

## Task 1: Configuração de ambiente (Asaas)

**Files:**
- Modify: `src/env.ts:17-19`
- Create/Modify: `.env.example`

- [ ] **Step 1: Substituir as vars genéricas de gateway por ASAAS_* em `src/env.ts`**

Trocar o bloco `// Payment gateway` (linhas ~17-19) por:

```ts
  // Asaas (pagamentos)
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_API_URL: z.string().url().default('https://sandbox.asaas.com/api/v3'),
  ASAAS_WEBHOOK_TOKEN: z.string().optional(),
```

- [ ] **Step 2: Documentar em `.env.example`**

Acrescentar:

```bash
# Asaas — pagamentos (sandbox por padrão)
ASAAS_API_KEY=
ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=
```

- [ ] **Step 3: Verificar build de tipos**

Run: `npm run build`
Expected: compila sem erro (as vars são opcionais; app sobe sem chave).

- [ ] **Step 4: Commit**

```bash
git add src/env.ts .env.example
git commit -m "chore(asaas): variáveis de ambiente do gateway"
```

---

## Task 2: Modelo de dados

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Adicionar campos de cobrança ao `User`**

No `model User`, após `updatedAt`:

```prisma
  cpfCnpj      String?
  phone        String?
```

- [ ] **Step 2: Adicionar `PENDING` ao enum**

```prisma
enum SubscriptionStatus {
  PENDING
  ACTIVE
  PAST_DUE
  CANCELED
}
```

- [ ] **Step 3: Adicionar `gatewayPaymentId` ao `Payment`**

No `model Payment`, após `id`:

```prisma
  gatewayPaymentId String? @unique
```

- [ ] **Step 4: Aplicar no banco (padrão do projeto — evita drift)**

Run: `./node_modules/.bin/prisma db push`
Expected: "Your database is now in sync with your Prisma schema." + client regenerado.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(asaas): campos de cobrança no schema (cpfCnpj, PENDING, gatewayPaymentId)"
```

---

## Task 3: Tipos do Asaas

**Files:**
- Create: `src/lib/asaas.types.ts`

- [ ] **Step 1: Escrever os tipos**

```ts
export type AsaasBillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'UNDEFINED'

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  value: number
  cycle: 'MONTHLY'
  status: string
  nextDueDate: string
}

export interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  value: number
  netValue?: number
  billingType: AsaasBillingType
  status: string           // PENDING | CONFIRMED | RECEIVED | OVERDUE | REFUNDED ...
  dueDate: string
  invoiceUrl?: string
  bankSlipUrl?: string     // PDF do boleto
  identificationField?: string // linha digitável do boleto
}

export interface AsaasPixQrCode {
  encodedImage: string     // base64 PNG do QR
  payload: string          // copia-e-cola
  expirationDate?: string
}

export interface AsaasError {
  errors: { code: string; description: string }[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/asaas.types.ts
git commit -m "feat(asaas): tipos da API"
```

---

## Task 4: Cliente Asaas

**Files:**
- Create: `src/lib/asaas.ts`

- [ ] **Step 1: Escrever o wrapper**

```ts
import { env } from '@/env'
import type {
  AsaasCustomer, AsaasSubscription, AsaasPayment, AsaasPixQrCode, AsaasBillingType,
} from './asaas.types'

class AsaasNotConfiguredError extends Error {
  constructor() { super('Asaas não configurado (defina ASAAS_API_KEY).') }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.ASAAS_API_KEY) throw new AsaasNotConfiguredError()
  const res = await fetch(`${env.ASAAS_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: env.ASAAS_API_KEY,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (body?.errors?.[0]?.description as string) ?? `Asaas HTTP ${res.status}`
    throw new Error(msg)
  }
  return body as T
}

export const asaasConfigured = () => Boolean(env.ASAAS_API_KEY)

export function createCustomer(data: {
  name: string; email: string; cpfCnpj: string; mobilePhone?: string
}): Promise<AsaasCustomer> {
  return call<AsaasCustomer>('/customers', { method: 'POST', body: JSON.stringify(data) })
}

export function createSubscription(data: {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string           // YYYY-MM-DD
  description?: string
  creditCardToken?: string
}): Promise<AsaasSubscription> {
  return call<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ ...data, cycle: 'MONTHLY' }),
  })
}

// Cobrança atual de uma assinatura (a primeira, para exibir PIX/boleto no checkout)
export function listSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
  return call<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments`)
}

export function getPayment(id: string): Promise<AsaasPayment> {
  return call<AsaasPayment>(`/payments/${id}`)
}

export function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return call<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`)
}

export function tokenizeCard(data: {
  customer: string
  creditCard: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string }
  creditCardHolderInfo: { name: string; email: string; cpfCnpj: string; postalCode: string; addressNumber: string; phone: string }
  remoteIp: string
}): Promise<{ creditCardToken: string }> {
  return call<{ creditCardToken: string }>('/creditCard/tokenize', {
    method: 'POST', body: JSON.stringify(data),
  })
}

export function cancelSubscription(id: string): Promise<{ deleted: boolean }> {
  return call<{ deleted: boolean }>(`/subscriptions/${id}`, { method: 'DELETE' })
}
```

> Nota de implementação: confirmar os paths exatos (`/creditCard/tokenize`, `/subscriptions/{id}/payments`, `/payments/{id}/pixQrCode`) na doc oficial do Asaas durante a execução; ajustar se divergir. O contrato das funções não muda.

- [ ] **Step 2: Verificar tipos**

Run: `npm run build`
Expected: compila.

- [ ] **Step 3: Commit**

```bash
git add src/lib/asaas.ts
git commit -m "feat(asaas): cliente da API"
```

---

## Task 5: Repositório de billing

**Files:**
- Create: `src/server/repositories/billing.repository.ts`

- [ ] **Step 1: Escrever funções de persistência**

```ts
import { prisma } from '@/lib/prisma'
import type { PlanName, SubscriptionStatus } from '@prisma/client'

export async function setBillingIdentity(userId: string, cpfCnpj: string, phone: string) {
  return prisma.user.update({ where: { id: userId }, data: { cpfCnpj, phone } })
}

export async function createPendingSubscription(params: {
  userId: string; planId: string; gatewayCustomerId: string; gatewaySubscriptionId: string; periodEnd: Date
}) {
  return prisma.subscription.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId, planId: params.planId, status: 'PENDING',
      currentPeriodEnd: params.periodEnd,
      gatewayCustomerId: params.gatewayCustomerId,
      gatewaySubscriptionId: params.gatewaySubscriptionId,
    },
    update: {
      planId: params.planId, status: 'PENDING',
      gatewayCustomerId: params.gatewayCustomerId,
      gatewaySubscriptionId: params.gatewaySubscriptionId,
    },
  })
}

export async function getSubscriptionByGatewaySub(gatewaySubscriptionId: string) {
  return prisma.subscription.findFirst({ where: { gatewaySubscriptionId } })
}

// Idempotente: se já existe um Payment com este gatewayPaymentId, não duplica.
export async function recordPaymentAndActivate(params: {
  gatewayPaymentId: string; userId: string; subscriptionId: string
  amount: number; method: string; status: SubscriptionStatus; periodEnd?: Date
}) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({ where: { gatewayPaymentId: params.gatewayPaymentId } })
    if (!existing) {
      await tx.payment.create({
        data: {
          gatewayPaymentId: params.gatewayPaymentId, userId: params.userId,
          subscriptionId: params.subscriptionId, amount: params.amount,
          status: 'PAID', method: params.method,
        },
      })
    }
    await tx.subscription.update({
      where: { id: params.subscriptionId },
      data: { status: params.status, ...(params.periodEnd ? { currentPeriodEnd: params.periodEnd } : {}) },
    })
    // Auto-verifica e-mail no primeiro pagamento confirmado
    await tx.user.updateMany({
      where: { id: params.userId, emailVerified: null },
      data: { emailVerified: new Date() },
    })
  })
}

export async function markSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
  return prisma.subscription.update({ where: { id: subscriptionId }, data: { status } })
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run build`
Expected: compila.

- [ ] **Step 3: Commit**

```bash
git add src/server/repositories/billing.repository.ts
git commit -m "feat(asaas): repositório de billing"
```

---

## Task 6: Cadastro coleta CPF/CNPJ, telefone e plano

**Files:**
- Modify: `src/server/actions/auth.ts:19-95`
- Modify: `src/app/(public)/cadastro/page.tsx`

- [ ] **Step 1: Estender o schema e a lógica de `registerUser`**

No `registerSchema`, adicionar:

```ts
  cpfCnpj: z.string().min(11, 'Informe um CPF ou CNPJ válido.').max(18),
  phone: z.string().min(10, 'Informe um telefone com DDD.').max(15),
  plan: z.enum(['ESSENCIAL', 'PREMIUM', 'GOLD']),
```

Substituir o miolo (busca de plano fixo ESSENCIAL + trial) por: buscar o plano
escolhido, criar o usuário SEM assinatura ativa, criar o cliente + assinatura
pendente no Asaas, e devolver o `subscriptionId`/redirecionar para o checkout.

```ts
const { name, email, password, cpfCnpj, phone, plan: planName } = parsed.data
// ...verifica e-mail existente...
const plan = await prisma.plan.findUnique({ where: { name: planName } })
if (!plan) return { ok: false, error: 'Plano indisponível.' }

const passwordHash = await bcrypt.hash(password, 12)
const user = await prisma.user.create({
  data: { name, email, passwordHash, role: 'STUDENT', emailVerified: null, cpfCnpj, phone },
})

// Se o Asaas ainda não está configurado, cria assinatura PENDING sem gateway
// (permite testar o fluxo de UI antes da chave). Caso contrário, cria no Asaas.
let gatewayCustomerId = '', gatewaySubscriptionId = ''
if (asaasConfigured()) {
  const customer = await createCustomer({ name, email, cpfCnpj, mobilePhone: phone })
  const nextDueDate = new Date().toISOString().slice(0, 10)
  const sub = await createSubscription({
    customer: customer.id, billingType: 'UNDEFINED',
    value: Number(plan.priceMonthly), nextDueDate, description: `Assinatura ${planName}`,
  })
  gatewayCustomerId = customer.id
  gatewaySubscriptionId = sub.id
}

await createPendingSubscription({
  userId: user.id, planId: plan.id, gatewayCustomerId, gatewaySubscriptionId,
  periodEnd: new Date(Date.now() + 31 * 864e5),
})

return { ok: true, data: { userId: user.id } }
```

Remover o uso de `TRIAL_DAYS` para conceder acesso (não há mais trial ativo).
Imports novos: `asaasConfigured, createCustomer, createSubscription` de `@/lib/asaas`; `createPendingSubscription, ` de billing repo.

- [ ] **Step 2: Adicionar campos ao formulário de cadastro**

Em `cadastro/page.tsx`, incluir inputs controlados para **CPF/CNPJ** e **telefone**
(máscara simples), e garantir que o **plano selecionado** é enviado no payload do
`registerUser`. Após sucesso, `router.push('/checkout')`.

- [ ] **Step 3: Verificar build + fluxo sem chave**

Run: `npm run build`
Expected: compila. Manual: cadastro cria usuário com assinatura `PENDING` (sem acesso).

- [ ] **Step 4: Commit**

```bash
git add src/server/actions/auth.ts "src/app/(public)/cadastro/page.tsx"
git commit -m "feat(asaas): cadastro coleta CPF/CNPJ, telefone e plano; cria assinatura pendente"
```

---

## Task 7: Actions do checkout

**Files:**
- Create: `src/server/actions/checkout.ts`

- [ ] **Step 1: Escrever as actions (cartão / PIX / boleto)**

```ts
'use server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/action-types'
import * as asaas from '@/lib/asaas'

async function currentSub() {
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { user: true, plan: true },
  })
}

// PIX / Boleto: devolve os dados da 1ª cobrança da assinatura para exibir na tela.
export async function getCharge(billing: 'PIX' | 'BOLETO'): Promise<ActionResult<{
  pixQr?: { image: string; payload: string }; boleto?: { url: string; line: string }
}>> {
  const sub = await currentSub()
  if (!sub?.gatewaySubscriptionId) return { ok: false, error: 'Assinatura não encontrada.' }
  try {
    const { data } = await asaas.listSubscriptionPayments(sub.gatewaySubscriptionId)
    const charge = data[0]
    if (!charge) return { ok: false, error: 'Cobrança ainda não gerada. Tente novamente.' }
    if (billing === 'PIX') {
      const qr = await asaas.getPixQrCode(charge.id)
      return { ok: true, data: { pixQr: { image: qr.encodedImage, payload: qr.payload } } }
    }
    return { ok: true, data: { boleto: { url: charge.bankSlipUrl ?? '', line: charge.identificationField ?? '' } } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Cartão: recebe o token gerado no cliente e recria a assinatura como CREDIT_CARD.
export async function payWithCard(creditCardToken: string): Promise<ActionResult> {
  const sub = await currentSub()
  if (!sub?.gatewayCustomerId) return { ok: false, error: 'Assinatura não encontrada.' }
  try {
    // Cancela a assinatura UNDEFINED e cria uma nova com cartão (recorrência automática).
    if (sub.gatewaySubscriptionId) await asaas.cancelSubscription(sub.gatewaySubscriptionId)
    const newSub = await asaas.createSubscription({
      customer: sub.gatewayCustomerId, billingType: 'CREDIT_CARD',
      value: Number(sub.plan.priceMonthly),
      nextDueDate: new Date().toISOString().slice(0, 10),
      description: `Assinatura ${sub.plan.name}`, creditCardToken,
    })
    await prisma.subscription.update({
      where: { id: sub.id }, data: { gatewaySubscriptionId: newSub.id },
    })
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// Tokeniza o cartão no servidor (o PAN vem do form, é enviado ao Asaas e descartado).
export async function tokenizeCard(input: {
  number: string; holderName: string; expiryMonth: string; expiryYear: string; ccv: string
  postalCode: string; addressNumber: string
}): Promise<ActionResult<{ token: string }>> {
  const sub = await currentSub()
  if (!sub?.gatewayCustomerId || !sub.user.cpfCnpj) return { ok: false, error: 'Dados incompletos.' }
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'
  try {
    const { creditCardToken } = await asaas.tokenizeCard({
      customer: sub.gatewayCustomerId,
      creditCard: { holderName: input.holderName, number: input.number, expiryMonth: input.expiryMonth, expiryYear: input.expiryYear, ccv: input.ccv },
      creditCardHolderInfo: {
        name: input.holderName, email: sub.user.email, cpfCnpj: sub.user.cpfCnpj,
        postalCode: input.postalCode, addressNumber: input.addressNumber, phone: sub.user.phone ?? '',
      },
      remoteIp: ip,
    })
    return { ok: true, data: { token: creditCardToken } }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
```

> Decisão de segurança: como o checkout é embutido, o número do cartão passa pelo
> Server Action apenas em trânsito para o Asaas e **nunca é persistido**. Guardamos
> só o `creditCardToken`. (Alternativa v2: tokenização 100% client-side com o SDK
> do Asaas para não tocar no PAN nem em trânsito.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compila.

- [ ] **Step 3: Commit**

```bash
git add src/server/actions/checkout.ts
git commit -m "feat(asaas): actions do checkout (cartão, PIX, boleto)"
```

---

## Task 8: UI do checkout embutido

**Files:**
- Create: `src/app/(public)/checkout/page.tsx`
- Create: `src/app/(public)/checkout/checkout-view.tsx`

- [ ] **Step 1: `page.tsx` (server) — carrega a assinatura pendente do usuário**

```tsx
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
    where: { userId: session.user.id }, include: { plan: true },
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
```

- [ ] **Step 2: `checkout-view.tsx` (client) — abas Cartão/PIX/Boleto**

Client component com 3 abas:
- **Cartão**: form (número, validade, CVV, nome, CEP, número) → chama `tokenizeCard` → `payWithCard(token)` → em sucesso, faz polling de `/api/auth/session` até `plan != null` (ou instrui "aguarde a confirmação") → `router.push('/dashboard')`.
- **PIX**: chama `getCharge('PIX')`, exibe `<img src={data:image/png;base64,...}>` + botão copiar payload; faz polling leve do status.
- **Boleto**: chama `getCharge('BOLETO')`, exibe linha digitável + link do PDF.
- Se `!configured`: exibe aviso "Pagamentos em configuração — volte em breve" e desabilita os botões (permite ver a UI sem a chave).

Reutilizar tokens de design das outras telas (verde-escuro, cards arredondados).

- [ ] **Step 3: Build + inspeção visual local**

Run: `npm run build && npm run dev`
Expected: `/checkout` renderiza as 3 abas; sem chave, mostra o aviso de configuração.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/checkout"
git commit -m "feat(asaas): checkout embutido (cartão, PIX, boleto)"
```

---

## Task 9: Função pura de webhook + teste

**Files:**
- Create: `src/lib/asaas-webhook.ts`
- Create: `scripts/asaas-webhook.test.mts`

- [ ] **Step 1: Escrever a tradução evento → intenção de estado (pura, testável)**

```ts
import type { SubscriptionStatus } from '@prisma/client'

export type WebhookIntent =
  | { kind: 'activate'; paymentId: string; extendDays: number }
  | { kind: 'status'; status: SubscriptionStatus }
  | { kind: 'ignore' }

export function interpretAsaasEvent(event: string): WebhookIntent {
  switch (event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED':
      return { kind: 'activate', paymentId: '', extendDays: 31 }
    case 'PAYMENT_OVERDUE':
      return { kind: 'status', status: 'PAST_DUE' }
    case 'PAYMENT_REFUNDED':
    case 'SUBSCRIPTION_DELETED':
      return { kind: 'status', status: 'CANCELED' }
    default:
      return { kind: 'ignore' }
  }
}
```

- [ ] **Step 2: Escrever o teste (tsx, padrão do projeto)**

```ts
import assert from 'node:assert'
import { interpretAsaasEvent } from '../src/lib/asaas-webhook.ts'

assert.equal(interpretAsaasEvent('PAYMENT_CONFIRMED').kind, 'activate')
assert.equal(interpretAsaasEvent('PAYMENT_OVERDUE').kind, 'status')
assert.deepEqual(interpretAsaasEvent('PAYMENT_OVERDUE'), { kind: 'status', status: 'PAST_DUE' })
assert.equal(interpretAsaasEvent('QUALQUER_OUTRO').kind, 'ignore')
console.log('✅ interpretAsaasEvent ok')
```

- [ ] **Step 3: Rodar o teste**

Run: `./node_modules/.bin/tsx scripts/asaas-webhook.test.mts`
Expected: `✅ interpretAsaasEvent ok`

- [ ] **Step 4: Commit**

```bash
git add src/lib/asaas-webhook.ts scripts/asaas-webhook.test.mts
git commit -m "feat(asaas): interpretação pura de eventos de webhook + teste"
```

---

## Task 10: Endpoint de webhook

**Files:**
- Create: `src/app/api/webhooks/asaas/route.ts`

- [ ] **Step 1: Escrever o handler**

```ts
import { env } from '@/env'
import { prisma } from '@/lib/prisma'
import { interpretAsaasEvent } from '@/lib/asaas-webhook'
import * as billing from '@/server/repositories/billing.repository'

export async function POST(request: Request) {
  // Validação do token do webhook (configurado no painel do Asaas)
  const token = request.headers.get('asaas-access-token')
  if (env.ASAAS_WEBHOOK_TOKEN && token !== env.ASAAS_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }
  const body = await request.json().catch(() => null)
  const event = body?.event as string | undefined
  const payment = body?.payment as { id: string; subscription?: string; value: number; billingType: string } | undefined
  if (!event) return new Response('ok', { status: 200 })

  const intent = interpretAsaasEvent(event)
  if (intent.kind === 'ignore' || !payment?.subscription) return new Response('ok', { status: 200 })

  const sub = await billing.getSubscriptionByGatewaySub(payment.subscription)
  if (!sub) return new Response('ok', { status: 200 }) // assinatura desconhecida — ignora

  try {
    if (intent.kind === 'activate') {
      await billing.recordPaymentAndActivate({
        gatewayPaymentId: payment.id, userId: sub.userId, subscriptionId: sub.id,
        amount: payment.value, method: payment.billingType, status: 'ACTIVE',
        periodEnd: new Date(Date.now() + intent.extendDays * 864e5),
      })
    } else if (intent.kind === 'status') {
      await billing.markSubscriptionStatus(sub.id, intent.status)
    }
  } catch (e) {
    console.error('[asaas webhook]', e)
    return new Response('error', { status: 500 }) // Asaas re-tenta
  }
  return new Response('ok', { status: 200 })
}
```

- [ ] **Step 2: Build + smoke local (POST simulado)**

Run: `npm run dev` e em outro terminal:
```bash
curl -s -X POST localhost:3000/api/webhooks/asaas \
  -H 'Content-Type: application/json' \
  -d '{"event":"PAYMENT_CONFIRMED","payment":{"id":"pay_test","subscription":"sub_x","value":97}}' -w '\n%{http_code}\n'
```
Expected: `ok` + `200` (assinatura desconhecida → ignora sem erro).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/asaas/route.ts
git commit -m "feat(asaas): endpoint de webhook (idempotente, valida token)"
```

---

## Task 11: Trava de acesso e redirecionamento

**Files:**
- Modify: `src/proxy.ts:60-75`
- Modify: `src/lib/auth.ts` (comentário; comportamento já correto)

- [ ] **Step 1: Redirecionar quem tem assinatura pendente para o checkout**

Como o JWT já zera `plan` quando não está `ACTIVE`, hoje o proxy manda para
`/planos`. Melhorar: se o usuário está logado e sem plano ativo, mandar para
`/checkout` (onde ele finaliza o pagamento) em vez de `/planos`.

No bloco `if (!userPlan)`:

```ts
    if (!userPlan) {
      // Logado mas assinatura não ativa (pendente/atrasada) → finalizar pagamento
      const url = new URL('/checkout', req.url)
      return NextResponse.redirect(url)
    }
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compila.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts src/lib/auth.ts
git commit -m "feat(asaas): acesso bloqueado até pagamento (redireciona ao checkout)"
```

---

## Task 12: Painel do aluno — status real e cancelar

**Files:**
- Modify: `src/app/(app)/perfil/assinatura/page.tsx`
- Modify: `src/app/(app)/perfil/assinatura/assinatura-view.tsx`
- Create: action `cancelMySubscription` em `src/server/actions/checkout.ts`

- [ ] **Step 1: Action de cancelamento**

Em `checkout.ts`:

```ts
export async function cancelMySubscription(): Promise<ActionResult> {
  const sub = await currentSub()
  if (!sub) return { ok: false, error: 'Sem assinatura.' }
  try {
    if (sub.gatewaySubscriptionId) await asaas.cancelSubscription(sub.gatewaySubscriptionId)
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELED' } })
    return { ok: true, data: undefined }
  } catch (e) { return { ok: false, error: (e as Error).message } }
}
```

- [ ] **Step 2: Exibir status/próxima cobrança + botão cancelar**

Na `page.tsx`, carregar `subscription.status`, `currentPeriodEnd` e os pagamentos
reais (já existe `listMyPayments`). Na view, mostrar o status (Ativa/Pendente/
Em atraso/Cancelada), a data da próxima cobrança e um botão **Cancelar assinatura**
(com confirmação) que chama `cancelMySubscription`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compila.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/perfil/assinatura" src/server/actions/checkout.ts
git commit -m "feat(asaas): painel do aluno com status real e cancelamento"
```

---

## Task 13: Verificação E2E contra o sandbox

**Files:**
- Create: `scripts/asaas-smoke.mts` (temporário)

> Só executável quando `ASAAS_API_KEY` de sandbox estiver no `.env.local`.

- [ ] **Step 1: Script que exercita a API real de sandbox**

```ts
import { config } from 'dotenv'; config({ path: '.env.local' })
import * as asaas from '../src/lib/asaas.ts'

if (!asaas.asaasConfigured()) { console.log('⏭️  sem ASAAS_API_KEY — pulei'); process.exit(0) }
const c = await asaas.createCustomer({ name: 'Teste Sandbox', email: `t${Date.now()}@ex.com`, cpfCnpj: '24971563792' })
console.log('✅ customer', c.id)
const s = await asaas.createSubscription({ customer: c.id, billingType: 'PIX', value: 47, nextDueDate: new Date().toISOString().slice(0,10) })
console.log('✅ subscription', s.id)
const { data } = await asaas.listSubscriptionPayments(s.id)
console.log('✅ 1ª cobrança', data[0]?.id)
const qr = await asaas.getPixQrCode(data[0].id)
console.log('✅ pix payload', qr.payload.slice(0, 20) + '…')
```

- [ ] **Step 2: Rodar (após colar a chave de sandbox)**

Run: `./node_modules/.bin/tsx scripts/asaas-smoke.mts`
Expected: cria customer, subscription e obtém QR de PIX no sandbox.

- [ ] **Step 3: E2E manual completo**

1. Cadastro com CPF de teste → cai no `/checkout`.
2. Pagar com cartão de teste do sandbox → webhook `PAYMENT_CONFIRMED` → status ACTIVE → `/dashboard` libera.
3. Repetir com PIX (marcar como pago no painel sandbox) e boleto.
4. Simular `PAYMENT_OVERDUE` no sandbox → acesso trava (`/checkout`).

- [ ] **Step 4: Remover o script temporário e commitar**

```bash
git rm scripts/asaas-smoke.mts
git commit -m "chore(asaas): remove script de smoke temporário"
```

---

## Configuração final (pelo cliente / no deploy)

1. Criar conta Asaas → pegar chave **sandbox** (testes) e **produção**.
2. No Vercel: `ASAAS_API_KEY`, `ASAAS_API_URL` (produção: `https://api.asaas.com/v3`), `ASAAS_WEBHOOK_TOKEN`.
3. No painel Asaas → **Integrações → Webhooks**: URL `https://www.frutificardigital.com.br/api/webhooks/asaas`, com o mesmo `ASAAS_WEBHOOK_TOKEN`, eventos de pagamento habilitados.
4. Redeploy.

---

## Self-review (cobertura da spec)

- Métodos cartão/PIX/boleto → Tasks 7, 8. ✔
- Paga na hora, sem trial → Task 6 (remove trial, cria PENDING). ✔
- Checkout embutido → Task 8. ✔
- Webhook fonte da verdade + idempotência → Tasks 9, 10 (`gatewayPaymentId @unique`). ✔
- Trava de acesso por status → Task 11 (+ JWT já zera plano). ✔
- CPF/CNPJ + telefone no cadastro → Tasks 2, 6. ✔
- Env parametrizado (só colar a chave) → Tasks 1, 4 (`asaasConfigured()` degrada com elegância). ✔
- Cancelamento → Task 12. ✔
- Sandbox/E2E → Task 13. ✔
- Fora de escopo (proration, cupons, dunning) → não incluído, conforme spec. ✔
