// Cadastra (uma vez) o webhook do Asaas apontando para o app.
// Uso:
//   ASAAS_API_KEY='$aact_prod_...' ASAAS_WEBHOOK_TOKEN='...' \
//   APP_URL='https://www.frutificardigital.com.br' WEBHOOK_EMAIL='voce@exemplo.com' \
//   ./node_modules/.bin/tsx scripts/asaas-setup-webhook.ts
const key = process.env.ASAAS_API_KEY
const token = process.env.ASAAS_WEBHOOK_TOKEN
const appUrl = process.env.APP_URL?.replace(/\/$/, '')
const email = process.env.WEBHOOK_EMAIL

if (!key || !token || !appUrl || !email) {
  console.error('Defina ASAAS_API_KEY, ASAAS_WEBHOOK_TOKEN, APP_URL e WEBHOOK_EMAIL.')
  process.exit(1)
}

const base = key.startsWith('$aact_hmlg_') ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3'
const url = `${appUrl}/api/webhooks/asaas`
const headers = { 'Content-Type': 'application/json', 'User-Agent': 'frutificar-digital', access_token: key }

const events = [
  'PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE',
  'PAYMENT_DELETED', 'PAYMENT_RESTORED', 'PAYMENT_REFUNDED', 'PAYMENT_RECEIVED_IN_CASH_UNDONE',
  'PAYMENT_CHARGEBACK_REQUESTED', 'PAYMENT_CHARGEBACK_DISPUTE',
  'SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED',
]

async function main() {
  const list = (await (await fetch(`${base}/webhooks`, { headers })).json()) as { data?: { id: string; url: string }[] }
  if (list.data?.some((w) => w.url === url)) {
    console.log(`Webhook já existe para ${url} — nada a fazer.`)
    return
  }
  const res = await fetch(`${base}/webhooks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Frutificar — pagamentos', url, email, enabled: true, interrupted: false,
      apiVersion: 3, authToken: token, sendType: 'SEQUENTIALLY', events,
    }),
  })
  const body = await res.json()
  if (!res.ok) {
    console.error('Erro do Asaas:', JSON.stringify(body))
    process.exit(1)
  }
  console.log(`Webhook criado (${(body as { id: string }).id}) → ${url}`)
}

main()
