// Tipos + dados mock das "Solicitações recentes" do dashboard admin.
// Compartilhados entre o server page e a view client (mesmo padrão de Propriedades).

export type Solicitation = {
  id: string
  kind: 'visit' | 'service'
  type: string
  user: string
  detail: string
  when: string
}

export const mockSolicitations: Solicitation[] = [
  {
    id: '1',
    kind: 'visit',
    type: 'Visita técnica',
    user: 'João Carlos Silva',
    detail: 'Fazenda Santa Clara — Talhão A2',
    when: 'há 12 min',
  },
  {
    id: '2',
    kind: 'service',
    type: 'Diagnóstico de solo',
    user: 'Maria Aparecida Costa',
    detail: 'coleta agendada · Talhão B1',
    when: 'há 40 min',
  },
  {
    id: '3',
    kind: 'service',
    type: 'Serviço avulso: Análise foliar',
    user: 'Roberto Santos',
    detail: 'Sítio Boa Vista',
    when: 'há 1 h',
  },
  {
    id: '4',
    kind: 'visit',
    type: 'Nova assinatura Gold',
    user: 'Helena Prado',
    detail: 'upgrade Premium → Gold',
    when: 'há 2 h',
  },
  {
    id: '5',
    kind: 'service',
    type: 'Consultoria agronômica',
    user: 'Marcos Lima',
    detail: '1h · financeiro da safra',
    when: 'há 3 h',
  },
]
