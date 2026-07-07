// Tipo de linha dos dias de campo (admin) + mock usado no modo preview (sem banco).
// A página server mapeia os dados reais (listFieldDays) para este mesmo formato.
// Obs.: o modelo FieldDay não tem vagas/inscritos — esses campos ficam apenas
// para exibição (display-only) com os valores-padrão deste mock.

export type FieldDayRow = {
  id: string
  title: string
  location: string
  date: string // ISO yyyy-mm-dd
  time: string // HH:mm
  instructor: string
  capacity: number
  registered: number
}

export const mockEvents: FieldDayRow[] = [
  { id: '1', title: 'Dia de Campo: Manejo Integrado de Pragas',   location: 'Fazenda Modelo — Patrocínio/MG', date: '2026-06-28', time: '08:00', instructor: 'Dr. Felipe Moura',     capacity: 30, registered: 28 },
  { id: '2', title: 'Demonstração: Colheitadeira de Café 2026',   location: 'Fazenda Cantagalo — Araxá/MG',   date: '2026-07-12', time: '09:00', instructor: 'Eng. Marcos Lima',     capacity: 20, registered: 15 },
  { id: '3', title: 'Workshop: Certificação Orgânica na Prática', location: 'EPAMIG — Lavras/MG',             date: '2026-07-19', time: '14:00', instructor: 'Dra. Sofia Alves',     capacity: 25, registered: 8 },
  { id: '4', title: 'Dia de Campo: Sistemas Agroflorestais',      location: 'Sítio Ecológico — Poços/MG',     date: '2026-08-02', time: '08:30', instructor: 'Dr. Felipe Moura',     capacity: 40, registered: 22 },
  { id: '5', title: 'Visita Técnica: Irrigação por Gotejamento',  location: 'Fazenda Boa Sorte — Uberaba/MG', date: '2026-05-25', time: '10:00', instructor: 'Eng. Carla Nogueira', capacity: 15, registered: 15 },
]
