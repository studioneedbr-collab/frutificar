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
