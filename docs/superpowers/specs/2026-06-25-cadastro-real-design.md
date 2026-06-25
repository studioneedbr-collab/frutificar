# Design — Cadastro real de usuário (Frutificar Digital)

**Data:** 2026-06-25
**Status:** Aprovado, pronto para plano de implementação

## Problema

A página `/cadastro` ([src/app/(public)/cadastro/page.tsx](../../../src/app/(public)/cadastro/page.tsx)) é um mock: o `onSubmit(_data)` ignora os dados e só faz `setTimeout → router.push('/login')`. Não existe `prisma.user.create` em nenhum lugar do projeto. Resultado: ninguém consegue criar conta de verdade, e sem conta não há login.

O banco já tem toda a estrutura (`User`, `Subscription`, `Plan`, `VerificationToken`, `Account`, `Session`). Falta a funcionalidade.

## Objetivo

Cadastro funcional que cria o usuário no banco, dá uma assinatura Essencial em trial de 7 dias, faz login automático levando ao dashboard, e inicia verificação de e-mail "soft" (não bloqueante).

## Decisões de produto (confirmadas)

- **Plano inicial:** Essencial em **trial de 7 dias**.
- **Pós-cadastro:** **login automático → /dashboard**.
- **Verificação de e-mail:** **soft** — conta criada e usável na hora; banner "confirme seu e-mail" até confirmar. Envio real só funciona quando o Resend tiver chave (hoje é placeholder).
- **Senha mínima:** **8 caracteres** (alinhado com `changePassword`; o mock usava 6).
- **Seed:** rodar **apenas os 3 planos** no Supabase (não popular usuários/cursos demo).

## Decisões técnicas (confirmadas)

- **Abordagem:** Server Action (segue o padrão de [src/server/actions/profile.ts](../../../src/server/actions/profile.ts)). Sem API route.
- **Trial sem novo enum:** `SubscriptionStatus` continua `ACTIVE / PAST_DUE / CANCELED`. Trial = `status: ACTIVE` + `currentPeriodEnd: hoje + 7 dias`. "Ser trial" fica implícito por `gatewaySubscriptionId == null` (nunca pagou). Evita mexer nas checagens de `status === ACTIVE` espalhadas pelo app.

## Componentes

### 1. Migration — `add_email_verified`
Adiciona à model `User` em `prisma/schema.prisma`:
```prisma
emailVerified DateTime?   // null = não verificado; data = verificado
```
Aplicada com `prisma migrate dev` localmente e `prisma migrate deploy` no Supabase. `VerificationToken` (NextAuth) já existe e é reusada — sem mudança nela.

### 2. Server Action — `src/server/actions/auth.ts`
Função `registerUser(input: unknown): Promise<ActionResult>` (mesmo `ActionResult` de `profile.ts`). Passos, dentro de uma transação Prisma (`prisma.$transaction`):

1. Valida com zod: `name` (≥1), `email` (email), `password` (≥8), `confirmPassword` (refine: igual a password).
2. `prisma.user.findUnique({ where: { email } })` → se existir, `{ ok: false, error: 'Este e-mail já está cadastrado.' }`.
3. `bcrypt.hash(password, 12)`.
4. `prisma.plan.findUnique({ where: { name: 'ESSENCIAL' } })` → se ausente, `{ ok: false, error: 'Plano indisponível. Tente novamente em instantes.' }` (não deveria ocorrer após o seed).
5. `prisma.user.create` com `Subscription` aninhada:
   - User: `name`, `email`, `passwordHash`, `role: STUDENT`, `emailVerified: null`.
   - Subscription: `planId` (Essencial), `status: ACTIVE`, `currentPeriodEnd: now + 7 dias`.
6. Cria `VerificationToken` (identifier = email, token aleatório, expires = now + 24h) e chama `sendVerificationEmail` (seção 4).
7. Retorna `{ ok: true }`.

Tratamento de erro: `try/catch` envolvendo a transação → `{ ok: false, error: 'Erro ao criar conta.' }` em falhas inesperadas; colisão de e-mail tratada antes (passo 2) e também defensivamente no catch (unique constraint P2002).

### 3. Auto-login → dashboard (na página)
A action não autentica sozinha. A página `/cadastro`:
1. Chama `registerUser(data)`.
2. Se `ok`: chama `signIn('credentials', { email, password, redirect: false })`.
3. `router.push('/dashboard')`.
4. Se `!ok`: mostra o erro no formulário (toast/inline).

O provider de credenciais já existe em [src/lib/auth.ts](../../../src/lib/auth.ts) e bloqueia `deletedAt`.

### 4. Verificação de e-mail (soft) — `src/lib/email.ts`
- `sendVerificationEmail(email, token)`: monta o link `/(URL)/verificar-email?token=…`. Enquanto `RESEND_API_KEY` for `placeholder`/vazio, **apenas `console.info` do link** (não lança erro). Quando a chave real existir, envia via Resend. Interface estável — só o corpo muda.
- Rota `GET /verificar-email` (`src/app/(public)/verificar-email/...`): lê `token`, busca `VerificationToken`, se válido e não expirado seta `User.emailVerified = now()`, deleta o token e redireciona para `/dashboard` com toast de sucesso. Token inválido/expirado → mensagem amigável.
- **Banner** "Confirme seu e-mail": no layout autenticado, exibido quando `session.user.emailVerified == null`. Expor `emailVerified` no callback `session`/`jwt` do NextAuth (hoje expõe `id`, `role`, `plan`). Não bloqueia nenhuma funcionalidade.

### 5. Página `/cadastro`
Trocar `onSubmit` mock pela chamada real (seção 3). Mantém layout, react-hook-form e o schema zod (com `password.min(8)`).

### 6. Pré-requisito de dados — seed dos planos
A assinatura exige o `Plan` ESSENCIAL no banco. `prisma/seed.ts` já faz `upsert` dos 3 planos. Entrega: rodar **apenas o seed dos planos** no Supabase (extrair/garantir os 3 `plan.upsert`; não criar usuários/cursos demo).

## Fluxo de dados (feliz)

```
/cadastro (form) → registerUser() [tx: valida → hash → cria User+Subscription → cria token → envia e-mail (stub)]
  → ok → signIn(credentials) → /dashboard (com banner "confirme seu e-mail")
  → usuário clica no link do e-mail → /verificar-email?token → emailVerified=now → /dashboard (banner some)
```

## Tratamento de erros

| Caso | Resposta |
|------|----------|
| E-mail já cadastrado | `{ ok:false, error:'Este e-mail já está cadastrado.' }` |
| Senhas não conferem | Erro de validação zod no `confirmPassword` |
| Plano Essencial ausente | `{ ok:false, error:'Plano indisponível...' }` |
| Falha na transação | `{ ok:false, error:'Erro ao criar conta.' }` |
| signIn falha pós-criação | Conta criada; redireciona a `/login` com aviso para entrar manualmente |
| Token de verificação inválido/expirado | Página de verificação com mensagem amigável |

## Testes / verificação

Projeto não tem suíte automatizada hoje. Verificação:
1. `npm run build` passa.
2. Fluxo manual: cadastrar → cair no `/dashboard` → ver banner → User+Subscription criados no banco (checar via query) → abrir link logado no console → banner some (`emailVerified` setado).
3. Reenviar mesmo e-mail → erro "já cadastrado".

(Testes de unidade da `registerUser` ficam como follow-up opcional.)

## Fora de escopo (YAGNI)

- Excluir conta (soft-delete) e admin de usuários ligado ao banco — próximos passos separados.
- Envio real de e-mail / template HTML — entra quando o Resend for configurado.
- Enum `TRIALING`, reembolso de trial, cobrança automática ao fim do trial.
