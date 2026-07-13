// Tipos + mock dos Dias de Campo (Gold). A página server mapeia listFieldDays() real.
// FieldDay no banco: title, location, date, instructor, description (sem vagas/inscrição —
// evento é informativo, conforme o escopo do produto).

export type FieldEvent = {
  id: string
  title: string
  local: string
  date: string // "12 jul 2026"
  time: string // "08h"
  instructor: string
  desc: string
  day: string // "12"
  month: string // "JUL"
}

export type PastEvent = { title: string; when: string }

export type FieldDaysData = {
  featured: FieldEvent | null
  upcoming: FieldEvent[]
  past: PastEvent[]
}

export const mockData: FieldDaysData = {
  featured: {
    id: 'featured',
    title: 'Cafeicultura de Precisão a Campo',
    local: 'Fazenda Modelo, Patrocínio/MG',
    date: '12 jul 2026',
    time: '08h',
    instructor: 'Helena Prado e Marcos Lima',
    desc: 'Demonstrações a campo de manejo, amostragem e tecnologias de precisão para a lavoura cafeeira.',
    day: '12',
    month: 'JUL',
  },
  upcoming: [
    { id: 'up-1', title: 'Manejo de Solo e Calagem', local: 'Araxá/MG', date: '26 jul 2026', time: '08h', instructor: 'Marcos Lima', desc: '', day: '26', month: 'JUL' },
    { id: 'up-2', title: 'Colheita e Pós-colheita do Café', local: 'Patrocínio/MG', date: '09 ago 2026', time: '07h', instructor: 'Helena Prado', desc: '', day: '09', month: 'AGO' },
    { id: 'up-3', title: 'Irrigação e Fertirrigação', local: 'Uberaba/MG', date: '23 ago 2026', time: '08h', instructor: 'Beatriz Nunes', desc: '', day: '23', month: 'AGO' },
  ],
  past: [
    { title: 'Pragas do Cafezal', when: 'mai/26' },
    { title: 'Gestão da Fazenda', when: 'abr/26' },
    { title: 'Nutrição de Plantas', when: 'mar/26' },
  ],
}
