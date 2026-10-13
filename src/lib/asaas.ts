// Cliente mínimo da API v3 do Asaas (https://docs.asaas.com).
// Só roda no servidor: a chave nunca vai para o navegador.
import 'server-only'

export type AsaasBillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'

export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS'

export type AsaasPayment = {
  id: string
  customer: string
  subscription?: string | null
  value: number
  status: AsaasPaymentStatus
  billingType: AsaasBillingType
  dueDate: string // YYYY-MM-DD
  paymentDate?: string | null
  clientPaymentDate?: string | null
  confirmedDate?: string | null
  invoiceUrl?: string | null
  bankSlipUrl?: string | null
  externalReference?: string | null
  deleted?: boolean
}

export type AsaasSubscription = {
  id: string
  customer: string
  value: number
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  billingType: AsaasBillingType
  nextDueDate: string
  deleted?: boolean
}

export type AsaasPixQrCode = {
  encodedImage: string // PNG em base64
  payload: string // Pix copia e cola
  expirationDate: string
}

export class AsaasError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'AsaasError'
  }
}

export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY)
}

function baseUrl(apiKey: string): string {
  if (process.env.ASAAS_API_URL) return process.env.ASAAS_API_URL.replace(/\/$/, '')
  // Chaves de sandbox começam com $aact_hmlg_; as de produção com $aact_prod_.
  return apiKey.startsWith('$aact_hmlg_')
    ? 'https://api-sandbox.asaas.com/v3'
    : 'https://api.asaas.com/v3'
}

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY
  if (!apiKey) throw new AsaasError('Pagamento indisponível: ASAAS_API_KEY não configurada.', 500)

  const res = await fetch(`${baseUrl(apiKey)}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'frutificar-digital',
      access_token: apiKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })

  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : {}
  if (!res.ok) {
    const errors = (data as { errors?: { description?: string }[] }).errors
    const msg = errors?.map((e) => e.description).filter(Boolean).join(' ') || `Asaas respondeu ${res.status}`
    throw new AsaasError(msg, res.status)
  }
  return data as T
}

// ─── Clientes ─────────────────────────────────────────────

export function createCustomer(input: {
  name: string
  email: string
  cpfCnpj: string
  externalReference: string
}) {
  return request<{ id: string }>('POST', '/customers', {
    ...input,
    // Mantém os avisos do Asaas (fatura, lembrete de vencimento, recibo).
    notificationDisabled: false,
  })
}

export function updateCustomer(id: string, input: { name?: string; email?: string; cpfCnpj?: string }) {
  return request<{ id: string }>('POST', `/customers/${id}`, input)
}

// ─── Assinaturas ──────────────────────────────────────────

export function createSubscription(input: {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string
  description: string
  externalReference: string
}) {
  return request<AsaasSubscription>('POST', '/subscriptions', { ...input, cycle: 'MONTHLY' })
}

export function getSubscription(id: string) {
  return request<AsaasSubscription>('GET', `/subscriptions/${id}`)
}

/** Atualiza forma de pagamento / valor; updatePendingPayments aplica às cobranças em aberto. */
export function updateSubscription(
  id: string,
  input: { billingType?: AsaasBillingType; value?: number; description?: string },
) {
  return request<AsaasSubscription>('POST', `/subscriptions/${id}`, {
    ...input,
    updatePendingPayments: true,
  })
}

export function deleteSubscription(id: string) {
  return request<{ deleted: boolean }>('DELETE', `/subscriptions/${id}`)
}

export async function listSubscriptionPayments(id: string): Promise<AsaasPayment[]> {
  const res = await request<{ data: AsaasPayment[] }>('GET', `/subscriptions/${id}/payments?limit=100`)
  return res.data ?? []
}

// ─── Cobranças ────────────────────────────────────────────

export function getPayment(id: string) {
  return request<AsaasPayment>('GET', `/payments/${id}`)
}

export function getPixQrCode(paymentId: string) {
  return request<AsaasPixQrCode>('GET', `/payments/${paymentId}/pixQrCode`)
}

// ─── Helpers ──────────────────────────────────────────────

export const PAID_STATUSES: AsaasPaymentStatus[] = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']
export const REFUND_STATUSES: AsaasPaymentStatus[] = [
  'REFUNDED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS',
  'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL',
]

/** Data local (America/Sao_Paulo) no formato YYYY-MM-DD, como o Asaas espera. */
export function todayInBrazil(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

export const billingTypeLabel: Record<string, string> = {
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de crédito',
  BOLETO: 'Boleto',
  UNDEFINED: 'A definir',
}
