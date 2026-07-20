# Integração de pagamentos recorrentes com Asaas

**Data:** 2026-07-17
**Status:** Aprovado (brainstorm) — pronto para plano de implementação

## Objetivo

Fazer os alunos da Frutificar Digital pagarem a assinatura mensal de forma
**recorrente e automatizada** através do gateway **Asaas**, com cobrança que se
repete todo mês sem intervenção manual do time.

## Decisões (do brainstorm)

| Tema | Decisão |
|------|---------|
| Métodos de pagamento | **Cartão de crédito + PIX + Boleto** |
| Momento da cobrança | **Paga na hora, sem trial.** Acesso liberado só após o 1º pagamento confirmado |
| Checkout | **Embutido no site** (branded), com tokenização de cartão feita direto no Asaas |
| Conta Asaas | O cliente cria a conta; o código fica parametrizado por env (só colar a chave) |
| CPF/CNPJ no cadastro | **Sim** — obrigatório pelo Asaas |
| Ambiente de teste | **Sandbox do Asaas** para todo o desenvolvimento |

## Como a recorrência funciona

No Asaas cria-se um **Customer** + uma **Subscription** (ciclo `MONTHLY`, valor do
plano, `nextDueDate`). A partir daí:

- **Cartão** → o Asaas cobra automaticamente todo mês (100% automático).
- **PIX / Boleto** → o Asaas gera e envia a cobrança do ciclo automaticamente; o
  aluno paga a cada mês. Sem pagamento no vencimento → assinatura fica em atraso e
  o acesso trava.

Em todos os casos a **recorrência é gerida pelo Asaas** (não implementamos cron de
cobrança); nós apenas reagimos aos eventos via webhook.

## Arquitetura / componentes

### 1. Cliente Asaas — `src/lib/asaas.ts`
Wrapper fino sobre a REST API do Asaas (via `fetch`), sem dependência extra.
- Base URL e chave por env; header de auth `access_token`.
- Funções: `createCustomer`, `createSubscription`, `tokenizeCard`,
  `getSubscription`, `cancelSubscription`, `getPayment`, `getPixQrCode`.
- Nunca recebe o número do cartão no nosso servidor (ver checkout).

### 2. Checkout embutido — `/checkout`
Página branded, aberta após a criação da conta, com abas:
- **Cartão**: formulário renderizado no nosso site; o cartão é tokenizado
  diretamente no Asaas (o PAN nunca chega ao nosso backend → mantém fora de
  escopo PCI pesado). Recebemos só o token e criamos a assinatura com
  `billingType=CREDIT_CARD`.
- **PIX**: criamos a cobrança e exibimos o **QR Code** (`encodedImage`) + código
  copia-e-cola na própria tela; status atualiza via webhook (com polling leve de
  fallback na UI).
- **Boleto**: exibimos **linha digitável** + link do PDF do boleto.

### 3. Webhook — `src/app/api/webhooks/asaas/route.ts`
Recebe eventos do Asaas e é a **fonte da verdade** do status:
- Valida o token secreto do webhook (header `asaas-access-token`).
- **Idempotente**: dedupe por `gatewayPaymentId`.
- Eventos tratados:
  - `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` → `Payment` = PAID; `Subscription` =
    ACTIVE; estende `currentPeriodEnd`; marca `emailVerified` se ainda nulo.
  - `PAYMENT_OVERDUE` → `Subscription` = PAST_DUE.
  - `PAYMENT_REFUNDED` → `Payment` = REFUNDED.
  - Eventos de cancelamento de assinatura → `Subscription` = CANCELED.

### 4. Trava de acesso — `src/proxy.ts` + sessão
Hoje o gating só checa se existe plano. Passa a checar **status da assinatura**:
- O JWT/sessão passa a expor o `subscription.status`.
- `proxy.ts` bloqueia rotas do app (não-públicas) quando status ≠ `ACTIVE`,
  redirecionando para `/checkout` (pendente) ou `/perfil/assinatura` (em atraso).
- **Admin isento** (role ADMIN sempre passa).

## Mudanças no modelo de dados

A base já existe (`Subscription.gatewayCustomerId`, `gatewaySubscriptionId`,
`Payment`, enums). Adições mínimas:

- `User`: `cpfCnpj String?`, `phone String?`.
- `enum SubscriptionStatus`: adicionar `PENDING` (assinatura criada, ainda não
  paga = sem acesso).
- `Payment`: `gatewayPaymentId String? @unique` (mapear cobrança do Asaas e
  deduplicar webhooks).

Aplicar via `prisma db push` (padrão do projeto, evita drift de migração).

## Fluxo do cadastro (paga na hora)

1. Cadastro coleta: nome, e-mail, senha, **CPF/CNPJ**, telefone, plano escolhido.
2. Cria `User` (`emailVerified = null`) + `Customer` no Asaas + `Subscription` no
   Asaas e local com status **PENDING**.
3. Redireciona para `/checkout`.
4. Aluno paga (cartão/PIX/boleto).
5. **Webhook** confirma → status **ACTIVE** → acesso liberado.

`registerUser` (em `src/server/actions/auth.ts`) é ajustado para: (a) receber e
validar CPF/CNPJ + telefone + plano selecionado (hoje ignora o plano e fixa
ESSENCIAL com trial); (b) não conceder acesso antes do pagamento.

## Configuração / env

Novas variáveis (substituem as genéricas `GATEWAY_*`):
- `ASAAS_API_KEY` — chave da conta.
- `ASAAS_API_URL` — `https://sandbox.asaas.com/api/v3` (default) ou produção.
- `ASAAS_WEBHOOK_TOKEN` — segredo para validar o webhook.

Declaradas em `src/env.ts` como opcionais (o app sobe sem elas; o checkout exibe
aviso de "pagamentos não configurados" enquanto ausentes).

## Tratamento de erros

- Falha na API do Asaas no cadastro → não deixar usuário órfão (criar conta e
  assinatura na mesma transação lógica; se o Asaas falhar, reverter/limpar e pedir
  para tentar de novo).
- Cartão recusado → mostrar motivo e permitir trocar de método.
- Webhook fora de ordem / repetido → idempotência por `gatewayPaymentId`.
- Assinatura sem webhook (raro) → polling leve na tela de checkout como fallback.

## Testes

Ambiente **sandbox** do Asaas para tudo:
- Cartões de teste do Asaas (aprovado/recusado).
- Cobrança PIX/boleto de sandbox.
- Webhook: disparo pelo sandbox e/ou POST manual assinado.
- **E2E**: cadastro → pagar (cartão sandbox) → webhook → acesso concedido;
  repetir para PIX e boleto; simular `PAYMENT_OVERDUE` → acesso trava.

## Escopo

**Nesta entrega:**
- Cadastro pago (3 métodos, checkout embutido), webhook, trava de acesso por
  status, cancelamento de assinatura, recorrência automática via Asaas,
  histórico de pagamentos real em `/perfil/assinatura` e `/admin/assinaturas`.

**Fora (v2):**
- Upgrade/downgrade de plano com rateio (proration).
- Cupons/descontos.
- E-mails de cobrança/dunning customizados (o Asaas já envia os dele).
- Checkout de cartão com recursos avançados além da tokenização.

## Unidades e responsabilidades

| Unidade | Faz | Depende de |
|---------|-----|-----------|
| `lib/asaas.ts` | Fala com a API do Asaas | env (chave/URL) |
| `/checkout` (UI + actions) | Coleta pagamento, cria cobrança/assinatura | `lib/asaas`, sessão |
| `api/webhooks/asaas` | Traduz eventos → estado no banco | Prisma, `lib/asaas` |
| `proxy.ts` + sessão | Autoriza acesso pelo status | banco (via JWT) |
| Repositórios (subscription/payments) | Persistência | Prisma |

Cada unidade é testável isoladamente: a API é mockável; o webhook é uma função
pura de (evento → mudança de estado); a trava é (status → permitido/negado).
