// Tipos e mock da página de Assinaturas (admin). O mock é usado em PREVIEW_MODE
// ou como fallback quando o banco não está disponível.

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

export const mockSubscriptions: Sub[] = [
  { id: '1', name: 'João Carlos Silva',     email: 'joao.silva@email.com',     plan: 'GOLD',      value: 'R$ 197',  status: 'ACTIVE',   renewal: '12 jul 2026',  gateway: 'Asaas #1234' },
  { id: '2', name: 'Maria Aparecida Costa', email: 'maria.costa@email.com',    plan: 'PREMIUM',   value: 'R$ 97',   status: 'ACTIVE',   renewal: '11 jul 2026',  gateway: 'Asaas #1235' },
  { id: '3', name: 'Pedro Henrique Souza',  email: 'pedro.souza@email.com',    plan: 'ESSENCIAL', value: 'R$ 47',   status: 'ACTIVE',   renewal: '10 jul 2026',  gateway: 'Asaas #1236' },
  { id: '4', name: 'Ana Beatriz Lima',      email: 'ana.lima@email.com',       plan: 'GOLD',      value: 'R$ 197',  status: 'PAST_DUE', renewal: '09 jun 2026',  gateway: 'Asaas #1237' },
  { id: '5', name: 'Carlos Eduardo Rocha',  email: 'carlos.rocha@email.com',   plan: 'PREMIUM',   value: 'R$ 97',   status: 'ACTIVE',   renewal: '08 jul 2026',  gateway: 'Asaas #1238' },
  { id: '6', name: 'Fernanda Oliveira',     email: 'fernanda.oliveira@email.com', plan: 'ESSENCIAL', value: 'R$ 47', status: 'CANCELED', renewal: '—',            gateway: 'Asaas #1239' },
  { id: '7', name: 'Roberto Santos Neto',   email: 'roberto.santos@email.com', plan: 'GOLD',      value: 'R$ 197',  status: 'ACTIVE',   renewal: '06 jul 2026',  gateway: 'Asaas #1240' },
  { id: '8', name: 'Marcos Antônio Prado',  email: 'marcos.prado@email.com',   plan: 'ESSENCIAL', value: 'R$ 47',   status: 'ACTIVE',   renewal: '04 jul 2026',  gateway: 'Asaas #1241' },
]
