// Tipos + dados mock da tela de Agendamentos (compartilhados entre o server page e a view client).
// O ícone é resolvido na view a partir de um mapa type→icon, por isso aqui guardamos só `type`.

export type AppointmentStatus = 'Confirmado' | 'Pendente' | 'Concluído'

export type Appointment = {
  id: string
  // Tipo do atendimento (usado para mapear o ícone na view via iconForType).
  type: string
  title: string
  agro: string
  when: string
  place: string
  status: AppointmentStatus
  // Distingue qual Server Action chamar ao cancelar (visita técnica x solicitação de serviço).
  kind: 'visit' | 'service'
}

export type HistoryItem = {
  type: string
  agro: string
  when: string
}

export const initialUpcoming: Appointment[] = [
  {
    id: '1',
    type: 'Visita Técnica',
    title: 'Visita Técnica',
    agro: 'Agr. Helena Prado',
    when: 'Ter, 02 jul · 09h00',
    place: 'Fazenda Santa Clara — Talhão A2',
    status: 'Confirmado',
    kind: 'visit',
  },
  {
    id: '2',
    type: 'Diagnóstico de Solo',
    title: 'Diagnóstico de Solo (coleta)',
    agro: 'Agr. Marcos Lima',
    when: 'Qui, 11 jul · 14h00',
    place: 'Fazenda Santa Clara — Talhão C1',
    status: 'Pendente',
    kind: 'service',
  },
]

export const history: HistoryItem[] = [
  { type: 'Visita Técnica', agro: 'Agr. Helena Prado', when: '04 jun · 09h00' },
  { type: 'Diagnóstico de Solo', agro: 'Agr. Marcos Lima', when: '21 mai · 15h00' },
  { type: 'Consultoria Agronômica', agro: 'Agr. Beatriz Nunes', when: '08 mai · 10h30' },
  { type: 'Visita Técnica', agro: 'Agr. Helena Prado', when: '17 abr · 08h30' },
]
