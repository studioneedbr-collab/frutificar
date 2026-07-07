// Tipo de linha da tabela de agendamentos (visitas técnicas) + mock do modo preview.
// A página server mapeia os dados reais (listAllVisits) para este mesmo formato.

export type Status = 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

export type Visit = {
  id: string
  user: string
  property: string
  reason: string
  date: string // exibição: "18 jun 2026"
  status: Status
  agronomist?: string
}

export const mockVisits: Visit[] = [
  { id: '1', user: 'João Carlos Silva',     property: 'Fazenda Santa Cruz',  reason: 'Diagnóstico de pragas no cafezal',       date: '18 jun 2026', status: 'CONFIRMED' },
  { id: '2', user: 'Maria Aparecida Costa', property: 'Sítio Boa Esperança', reason: 'Análise de solo — talhão norte',         date: '20 jun 2026', status: 'REQUESTED' },
  { id: '3', user: 'Pedro Henrique Souza',  property: 'Chácara São José',    reason: 'Consultoria pós-colheita café',          date: '22 jun 2026', status: 'CONFIRMED' },
  { id: '4', user: 'Roberto Santos Neto',   property: 'Fazenda Três Marias', reason: 'Avaliação de sistema de irrigação',      date: '25 jun 2026', status: 'REQUESTED' },
  { id: '5', user: 'Carlos Eduardo Rocha',  property: 'Sítio Verde Vale',    reason: 'Planejamento de adubação orgânica',      date: '28 jun 2026', status: 'CONFIRMED' },
  { id: '6', user: 'Ana Beatriz Lima',      property: 'Fazenda Serra Alta',  reason: 'Instalação de armadilhas monitoramento', date: '05 jun 2026', status: 'COMPLETED' },
  { id: '7', user: 'Marcos Antônio Prado',  property: 'Chácara Boa Vista',   reason: 'Revisão de poda — variedade Catuaí',     date: '02 jun 2026', status: 'CANCELED' },
]
