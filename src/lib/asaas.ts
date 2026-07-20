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
  nextDueDate: string
  description?: string
  creditCardToken?: string
}): Promise<AsaasSubscription> {
  return call<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ ...data, cycle: 'MONTHLY' }),
  })
}

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
