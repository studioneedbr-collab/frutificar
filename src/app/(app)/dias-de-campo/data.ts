// Tipos dos Dias de Campo (Gold). A página server mapeia listFieldDays() real.
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
