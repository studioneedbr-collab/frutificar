# Deploy — Frutificar Digital

Guia para sair do **modo preview** (sem banco) e colocar no ar com **Supabase + Vercel**.

## Estado atual

- ✅ `npm run build` passa (build de produção limpo).
- ✅ Todas as telas (app + admin) renderizam no preview com dados mock.
- ✅ Schema Prisma completo (24 models) + `prisma/seed.ts` alinhado ao preview.
- 🔒 Autenticação e controle de plano ficam **desligados** enquanto `PREVIEW_MODE=true`.

O preview é controlado por uma única flag: **`PREVIEW_MODE`** (em `src/proxy.ts`).

---

## 1. Criar o banco no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → Database → Connection string**, copie:
   - **Transaction pooler** (porta `6543`) → `DATABASE_URL`
   - **Direct connection** (porta `5432`) → `DIRECT_URL`

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Origem |
|----------|--------|
| `DATABASE_URL` | Supabase (pooler 6543) |
| `DIRECT_URL` | Supabase (direta 5432) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI (para o Chat IA) |
| `PREVIEW_MODE` | `false` para ativar auth/banco |

## 3. Migrar + popular o banco

```bash
npx prisma generate          # gera o client
npx prisma migrate deploy    # aplica as migrations (usa DIRECT_URL)
npm run db:seed              # popula com o currículo do café, planos, usuário Gold, etc.
```

> O seed cria: 3 planos (R$47/97/197), admin (`admin@frutificar.com` / `admin123`),
> aluno Gold **Douglas Vargas** (`douglas@fazendasantaclara.com.br` / `aluno123`),
> curso "Cafeicultura Completa" (8 módulos), 4 minicursos, Fazenda Santa Clara (4 talhões),
> 1 visita técnica + 1 serviço (solicitações do admin), 2 lives, 1 podcast, 1 dia de campo.

## 4. Ligar a autenticação

Defina `PREVIEW_MODE=false`. Isso reativa, em `src/proxy.ts`:
- redirect para `/login` (ou `/admin/login`) quando não autenticado;
- bloqueio de rota por plano (`ROUTE_FEATURE_MAP` + `PLAN_FEATURES`).

> ⚠️ As telas internas ainda usam **dados mock** para renderizar no preview. Trocar mock → Prisma
> é o próximo passo (camada de Server Actions / repositories — ver "Pendências").

## 5. Deploy na Vercel

1. Importe o repositório na Vercel.
2. Adicione todas as variáveis de ambiente (com `PREVIEW_MODE=false`).
3. Build command padrão (`next build`). A Vercel injeta `AUTH_URL` automaticamente.
4. Configure o **Prisma** no deploy: adicione `prisma generate` ao `postinstall`
   (ou `build`) se ainda não estiver — confirme em `package.json`.

---

## Pendências para o "modo real" (pós-Supabase)

Itens que ainda dependem do banco e devem ser conectados depois do deploy:

- [ ] **Camada de dados**: trocar os mocks das telas por Server Actions com Prisma
      (criar agendamento, enviar diagnóstico, CRUD de cursos/módulos, mudar plano).
- [ ] **Solicitações do admin**: ler `TechnicalVisit` / `ServiceRequest` reais no painel.
- [ ] **Chat IA**: hoje responde offline; conectar à rota `/api/chat` (OpenAI + persistência).
- [ ] **Vídeos**: preencher `youtubeVideoId` reais nas lessons/lives (estão como `TODO_*`).
- [ ] **Pagamento (Asaas)**: checkout + webhook de assinatura.
- [ ] **Remover MOCK_SESSION** de `src/app/(app)/layout.tsx` quando a sessão real estiver ativa.
