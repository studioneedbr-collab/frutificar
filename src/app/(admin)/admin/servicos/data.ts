// Tipos + mock do catálogo de serviços do admin (persistido em Service).

export type ServiceType = 'INCLUDED' | 'AVULSO'

export type ServiceItem = {
  id: string
  name: string
  description: string
  type: ServiceType
  price: number
  active: boolean
}

export const mockServices: ServiceItem[] = [
  { id: '1', name: 'Análise de Solo', description: 'Análise completa NPK + micronutrientes por talhão', type: 'AVULSO', price: 280, active: true },
  { id: '2', name: 'Consultoria Fitossanitária', description: 'Identificação e controle de pragas e doenças', type: 'INCLUDED', price: 0, active: true },
  { id: '3', name: 'Laudo Técnico', description: 'Laudo para financiamento bancário — Pronaf', type: 'AVULSO', price: 450, active: true },
  { id: '4', name: 'Projeto de Irrigação', description: 'Dimensionamento de sistema de gotejamento', type: 'AVULSO', price: 980, active: true },
  { id: '5', name: 'Acompanhamento Mensal', description: 'Visita técnica e relatório de acompanhamento', type: 'INCLUDED', price: 0, active: false },
]
