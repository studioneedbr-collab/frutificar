// Tipos da página de Solicitações do admin (pedidos de serviço + tutoria dos alunos).

export type SolStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED'

export type SolicitacaoItem = {
  id: string
  user: string
  email: string
  type: string          // serviceType (ex.: "Análise de solo" ou "Tutoria — Pragas")
  description: string
  status: SolStatus
  date: string          // dd mmm yyyy
}
