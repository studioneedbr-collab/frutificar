// Tipos da página de Assinaturas (admin).

export type Plan = 'GOLD' | 'PREMIUM' | 'ESSENCIAL'
export type Status = 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export type Sub = {
  id: string
  name: string
  email: string
  plan: Plan
  value: string
  status: Status
  renewal: string
  gateway: string
}
