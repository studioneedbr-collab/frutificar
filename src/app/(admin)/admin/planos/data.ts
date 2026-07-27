// Tipos da tela de Planos (admin) — compartilhados entre o server page e a view client.

export type Plan = {
  id: string
  name: string
  price: number
  color: string
  active: boolean
  subscribers: number
  revenue: string
  features: string[]
}
