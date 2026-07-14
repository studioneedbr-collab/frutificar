// Tipos + mock da página de Solicitações do admin (pedidos de serviço + tutoria dos alunos).

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

export const mockSolicitacoes: SolicitacaoItem[] = [
  { id: '1', user: 'João Carlos Silva', email: 'joao@exemplo.com', type: 'Análise de solo', description: 'Preciso de análise do talhão A2, café com sintoma de deficiência.', status: 'OPEN', date: '13 jul 2026' },
  { id: '2', user: 'Maria Aparecida Costa', email: 'maria@exemplo.com', type: 'Tutoria — Controle de pragas', description: 'Ferrugem persistente mesmo após aplicação.', status: 'IN_PROGRESS', date: '11 jul 2026' },
  { id: '3', user: 'Pedro Henrique Souza', email: 'pedro@exemplo.com', type: 'Laudo técnico', description: 'Laudo para financiamento Pronaf.', status: 'COMPLETED', date: '05 jul 2026' },
]
