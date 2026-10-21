# Backup do banco

Todo **domingo às 06:00 UTC** (03:00 em Brasília) o GitHub Actions roda o workflow
[`backup-banco.yml`](../.github/workflows/backup-banco.yml): faz um `pg_dump` do banco
do Supabase, criptografa com GPG (AES256) e guarda o arquivo `backup-AAAA-MM-DD.dump.gpg`
como *artifact* do GitHub por **30 dias**. Não custa nada e não ocupa disco no Supabase.

## 1. Configurar os 2 segredos (uma vez só)

No GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Nome | Valor |
|---|---|
| `BACKUP_DATABASE_URL` | Supabase → **Connect** → **Session pooler** (porta **5432**). Ex.: `postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres` |
| `BACKUP_PASSPHRASE` | Uma senha forte, ex.: `openssl rand -base64 32` |

> ⚠️ Guarde a `BACKUP_PASSPHRASE` também num gerenciador de senhas. O GitHub não
> deixa ler o segredo depois — **sem ela o backup não pode ser aberto**.

Se algum segredo faltar, o workflow falha logo no primeiro passo com a mensagem do que está faltando.

## 2. Rodar manualmente

GitHub → aba **Actions** → **Backup do banco** → **Run workflow**.

## 3. Baixar e restaurar

1. Actions → abra a execução desejada → em **Artifacts**, baixe `backup-AAAA-MM-DD.dump.gpg`
   (vem dentro de um `.zip`; descompacte).
2. Descriptografe (pede a `BACKUP_PASSPHRASE`):
   ```bash
   gpg --decrypt -o backup.dump backup-AAAA-MM-DD.dump.gpg
   ```
3. Restaure (precisa de `pg_restore` versão 17 ou maior — `brew install postgresql@17` no Mac):
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges -d "postgresql://...:5432/postgres" backup.dump
   ```
   > `--clean` **apaga e recria** as tabelas do destino. Confira a URL antes de rodar.
   > Avisos sobre esquemas internos do Supabase (`auth`, `storage`, extensões) podem ser ignorados.

## ⚠️ Teste a restauração pelo menos uma vez

Backup que nunca foi restaurado não é backup. Crie um projeto Supabase de teste (grátis)
ou um Postgres local (`docker run -e POSTGRES_PASSWORD=x -p 5433:5432 postgres:17`),
restaure o último backup nele e confira se os dados aparecem. Apague o `backup.dump`
descriptografado ao terminar — ele contém dados pessoais dos alunos.
