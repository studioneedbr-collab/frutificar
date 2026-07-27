// Tipo de linha dos dias de campo (admin).
// A página server mapeia os dados reais (listFieldDaysWithCounts) para este mesmo formato.
// Obs.: o modelo FieldDay não tem vagas/inscritos — esses campos ficam apenas
// para exibição (display-only).

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
