// Tipos do catálogo de serviços do admin (persistido em Service).

export type ServiceType = 'INCLUDED' | 'AVULSO'

export type ServiceItem = {
  id: string
  name: string
  description: string
  type: ServiceType
  price: number
  active: boolean
}
