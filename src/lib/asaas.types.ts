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
  status: string
  dueDate: string
  invoiceUrl?: string
  bankSlipUrl?: string
  identificationField?: string
}

export interface AsaasPixQrCode {
  encodedImage: string
  payload: string
  expirationDate?: string
}

export interface AsaasError {
  errors: { code: string; description: string }[]
}
