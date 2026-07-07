// Tipo de linha da lista de lives (admin) + mock usado no modo preview (sem banco).
// A página server mapeia os dados reais (listLives) para este mesmo formato.

export type Plan = 'ESSENCIAL' | 'PREMIUM' | 'GOLD'
export type Status = 'SCHEDULED' | 'LIVE' | 'ENDED'

export type Live = {
  id: string
  title: string
  agronomist: string
  plan: Plan
  status: Status
  date: string // ISO yyyy-mm-dd
  time: string // HH:MM
  viewers: number
  ytId: string
}

export const mockLives: Live[] = [
  { id: '1', title: 'Colheita do Café: Técnicas Modernas',        agronomist: 'Dr. Felipe Moura',  plan: 'ESSENCIAL', status: 'SCHEDULED', date: '2026-06-20', time: '19:00', viewers: 0,   ytId: 'dQw4w9WgXcQ' },
  { id: '2', title: 'AO VIVO: Diagnóstico de Pragas em Tempo Real', agronomist: 'Eng. Carla Nogueira', plan: 'PREMIUM',   status: 'LIVE',      date: '2026-06-15', time: '15:30', viewers: 234, ytId: 'dQw4w9WgXcQ' },
  { id: '3', title: 'Gestão de Custos na Propriedade Rural',       agronomist: 'Dra. Sofia Alves',  plan: 'ESSENCIAL', status: 'ENDED',     date: '2026-06-10', time: '18:00', viewers: 412, ytId: 'dQw4w9WgXcQ' },
  { id: '4', title: 'Adubação Verde: Como e Quando Usar',          agronomist: 'Dr. Felipe Moura',  plan: 'PREMIUM',   status: 'ENDED',     date: '2026-06-05', time: '19:00', viewers: 318, ytId: 'dQw4w9WgXcQ' },
  { id: '5', title: 'Mecanização Agrícola para Pequenos Prod.',    agronomist: 'Eng. Marcos Lima',  plan: 'GOLD',      status: 'ENDED',     date: '2026-06-01', time: '14:00', viewers: 156, ytId: 'dQw4w9WgXcQ' },
  { id: '6', title: 'Irrigação por Gotejamento: Instalação',       agronomist: 'Eng. Carla Nogueira', plan: 'ESSENCIAL', status: 'SCHEDULED', date: '2026-06-25', time: '10:00', viewers: 0,   ytId: '' },
]
