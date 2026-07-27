// Tipo de linha da tabela de agendamentos (visitas técnicas).
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
