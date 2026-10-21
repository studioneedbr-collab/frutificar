# Variáveis de ambiente — Frutificar Digital

Referência para ligar o app em produção (Vercel) e localmente (`.env.local`).
**Nunca** comite este arquivo com valores reais preenchidos — os segredos ficam só no painel da Vercel e no `.env.local` (que é gitignored).

## Como o app decide "modo real" vs "demo"
- `PREVIEW_MODE="false"` → modo real (auth + banco + IA ligados).
- `PREVIEW_MODE="true"` ou ausente → modo demo (mock, sem banco).

---

## Obrigatórias (o app não sobe sem elas)

| Variável | Para quê | Formato / onde pegar |
|---|---|---|
| `DATABASE_URL` | Runtime (pooler 6543) | Supabase → Connect → Transaction pooler |
| `DIRECT_URL` | Migrations (session 5432) | Supabase → Connect → Session pooler |
| `NEXTAUTH_SECRET` | Assina a sessão | string aleatória 32+ chars (`openssl rand -base64 32`) |
| `AUTH_SECRET` | Auth.js v5 (mesmo valor) | = `NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | URL base p/ login e e-mails | a URL de produção, ex.: `https://frutificar.vercel.app` |
| `PREVIEW_MODE` | Liga o modo real | `"false"` |

## IA — liga Chat + Diagnóstico

| Variável | Para quê | Onde pegar |
|---|---|---|
| `OPENAI_API_KEY` | Chat IA e leitura do laudo (GPT-4o) | platform.openai.com → API keys (`sk-...`) |

Sem essa chave, chat e diagnóstico mostram erro amigável e não funcionam.

## Pagamentos — Asaas (obrigatório: sem isso ninguém consegue pagar/entrar)

| Variável | Para quê | Onde pegar |
|---|---|---|
| `ASAAS_API_KEY` | Cria clientes, assinaturas e cobranças | Asaas → Integrações → Chave de API (`$aact_prod_...`) |
| `ASAAS_WEBHOOK_TOKEN` | Autentica os avisos de pagamento do Asaas | string aleatória 32+ chars (`openssl rand -hex 24`) |
| `ASAAS_WALLET_ID` | Referência da carteira (não usado no fluxo atual) | Asaas → Minha conta |

> ⚠️ Em arquivos `.env` / `.env.local` o `$` da chave precisa ser escapado: `ASAAS_API_KEY=\$aact_prod_...`
> (o Next.js expande `$variavel`). No painel da Vercel cole o valor normal, sem barra.

Depois do deploy, cadastre o webhook uma vez:
```bash
ASAAS_API_KEY='$aact_prod_...' ASAAS_WEBHOOK_TOKEN='mesmo-valor-da-vercel' \
APP_URL='https://www.frutificardigital.com.br' WEBHOOK_EMAIL='seu@email.com' \
./node_modules/.bin/tsx scripts/asaas-setup-webhook.ts
```

## Supabase Storage — upload de arquivos (materiais, áudio, laudos)

| Variável | Para quê | Onde pegar |
|---|---|---|
| `SUPABASE_URL` | Base do Storage | `https://nvcbzzhrhbgqnsdaicpl.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Autoriza upload | Supabase → Settings → API → `service_role` |
| `SUPABASE_STORAGE_BUCKET` | Nome do bucket público | `bucket` (precisa existir e ser público) |

## E-mail (opcional — só o "enviar link de reset")

| Variável | Para quê |
|---|---|
| `BREVO_API_KEY` | Envio transacional (reset de senha por link) |
| `EMAIL_FROM` | Remetente, ex.: `frutificardigital@gmail.com` |
| `EMAIL_FROM_NAME` | Nome do remetente |
| `ADMIN_NOTIFICATION_EMAIL` | Recebe notificações do admin |

> Sem Brevo, o reset de senha por e-mail falha — mas o botão **"gerar senha temporária"** no admin funciona sempre.

## Opcionais (deixe em branco se não usar)
`YOUTUBE_API_KEY`, `GATEWAY_API_KEY`, `GATEWAY_WEBHOOK_SECRET`, `AWS_*`, `RESEND_API_KEY`, `SUPABASE_ANON_KEY`.

---

## Checklist para ligar produção
1. Criar o bucket público `bucket` no Supabase Storage (se ainda não existe).
2. Preencher `OPENAI_API_KEY` real (local e na Vercel).
3. Na Vercel, colar TODAS as obrigatórias + IA + Storage.
4. `NEXTAUTH_URL` = domínio de produção (não `localhost`).
5. Rodar as migrations contra o banco (`prisma migrate deploy`) se ainda não rodou em produção.
6. Deploy.

---

## Alertas de erro (e-mail para o admin)

Erros não tratados no servidor (páginas, APIs, server actions), falhas da IA (chat e diagnóstico), banco fora do ar e variáveis críticas ausentes geram um e-mail **"⚠️ Erro na plataforma: …"** para o admin.

| Variável | Para quê |
|---|---|
| `ADMIN_NOTIFICATION_EMAIL` | Quem recebe os alertas (sem ela, os erros só vão para os logs da Vercel) |
| `BREVO_API_KEY` | Necessária para o e-mail sair de verdade (sem ela, só log) |
| `CRON_SECRET` | Recomendado: protege `/api/cron/keepalive`, que roda todo dia e checa banco + `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `BREVO_API_KEY`, `OPENAI_API_KEY` |

Limites: no máximo 1 e-mail por tipo de erro a cada 15 min e 20 por hora. Só em produção. O e-mail nunca leva senhas, tokens, CPF, dados de cartão nem corpo de requisição.

## Backup semanal do banco (GitHub Actions)

O workflow `.github/workflows/backup-banco.yml` roda todo domingo e guarda um dump criptografado como artifact do GitHub (30 dias). Configure em **GitHub → Settings → Secrets and variables → Actions**:

| Segredo | Valor |
|---|---|
| `BACKUP_DATABASE_URL` | Supabase → Connect → **Session pooler** (porta 5432) |
| `BACKUP_PASSPHRASE` | senha forte (`openssl rand -base64 32`) — guarde fora do GitHub, sem ela o backup não abre |

Passo a passo e restauração: [docs/BACKUP.md](docs/BACKUP.md).
