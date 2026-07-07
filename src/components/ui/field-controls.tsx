'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from './select'

// Estilo base compartilhado com os inputs dos modais.
const fieldStyle: React.CSSProperties = {
  border: '1px solid oklch(0.91 0.01 144)',
  background: 'oklch(0.99 0.005 144)',
}
const C = {
  deep: 'oklch(0.24 0.09 144)',
  muted: 'oklch(0.5 0.04 144)',
  green: 'oklch(0.48 0.13 144)',
  greenSoft: 'oklch(0.48 0.13 144 / 0.1)',
}

// ─────────────────────────────── SelectField ───────────────────────────────

export type Option = { value: string; label: string }

export function SelectField({
  value, onValueChange, options, placeholder = 'Selecione', id, disabled, className,
}: {
  value?: string
  onValueChange?: (value: string) => void
  options: Option[]
  placeholder?: string
  id?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange?.(String(v))}>
      <SelectTrigger
        id={id}
        disabled={disabled}
        className={cn('w-full h-auto min-h-[42px] py-2.5 rounded-lg text-sm', className)}
        style={fieldStyle}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ─────────────────────────────── DateField ───────────────────────────────

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
function parseISO(s?: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
function formatBR(s?: string): string {
  const d = parseISO(s)
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : ''
}

export function DateField({
  value, onChange, placeholder = 'Selecione a data', id, className,
}: {
  value?: string
  onChange?: (iso: string) => void
  placeholder?: string
  id?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseISO(value)
  const [view, setView] = React.useState<Date>(() => selected ?? new Date())

  React.useEffect(() => {
    if (open && selected) setView(new Date(selected.getFullYear(), selected.getMonth(), 1))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayISO = toISO(new Date())
  const selectedISO = selected ? toISO(selected) : null

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function pick(day: number) {
    onChange?.(toISO(new Date(year, month, day)))
    setOpen(false)
  }
  const shift = (n: number) => setView(new Date(year, month + n, 1))

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.13_144_/_0.3)]',
          className,
        )}
        style={fieldStyle}
      >
        <span style={{ color: value ? C.deep : 'oklch(0.6 0.03 144)' }}>
          {value ? formatBR(value) : placeholder}
        </span>
        <Calendar size={15} style={{ color: C.muted }} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="start" className="z-[120]">
          <Popover.Popup
            className="rounded-2xl bg-white p-3 outline-none"
            style={{ border: '1px solid oklch(0.91 0.01 144)', boxShadow: '0 16px 44px oklch(0.16 0.07 152 / 0.18)', width: 280 }}
          >
            {/* Cabeçalho do mês */}
            <div className="flex items-center justify-between mb-2.5 px-1">
              <button
                type="button" onClick={() => shift(-1)} aria-label="Mês anterior"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: C.deep }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold" style={{ color: C.deep, fontFamily: 'var(--font-heading)' }}>
                {MONTHS[month]} {year}
              </span>
              <button
                type="button" onClick={() => shift(1)} aria-label="Próximo mês"
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[oklch(0.96_0.01_144)]"
                style={{ color: C.deep }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((w, i) => (
                <div key={i} className="text-center text-[10px] font-bold py-1" style={{ color: 'oklch(0.62 0.03 144)' }}>
                  {w}
                </div>
              ))}
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (day === null) return <div key={`b${i}`} />
                const iso = toISO(new Date(year, month, day))
                const isSelected = iso === selectedISO
                const isToday = iso === todayISO
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => pick(day)}
                    className="h-8 rounded-lg text-sm font-medium transition-colors"
                    style={
                      isSelected
                        ? { background: C.green, color: 'white', fontWeight: 700 }
                        : {
                            color: C.deep,
                            background: 'transparent',
                            ...(isToday ? { boxShadow: 'inset 0 0 0 1.5px oklch(0.48 0.13 144 / 0.45)' } : {}),
                          }
                    }
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = C.greenSoft }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Atalho: hoje */}
            <div className="mt-2.5 pt-2.5 flex justify-between items-center" style={{ borderTop: '1px solid oklch(0.93 0.01 144)' }}>
              <button
                type="button"
                onClick={() => { onChange?.(todayISO); setOpen(false) }}
                className="text-xs font-bold transition-opacity hover:opacity-70"
                style={{ color: C.green }}
              >
                Hoje
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange?.(''); setOpen(false) }}
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: C.muted }}
                >
                  Limpar
                </button>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ─────────────────────────────── TimeField ───────────────────────────────

/** Gera horários de start..end (h) em passos de stepMin minutos. */
export function timeOptions(startH = 6, endH = 20, stepMin = 30): Option[] {
  const out: Option[] = []
  for (let h = startH; h <= endH; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      if (h === endH && m > 0) break
      const v = `${pad(h)}:${pad(m)}`
      out.push({ value: v, label: `${v}h` })
    }
  }
  return out
}

export function TimeField({
  value, onValueChange, placeholder = 'Selecione o horário', id, className,
}: {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  id?: string
  className?: string
}) {
  return (
    <SelectField
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={timeOptions()}
      placeholder={placeholder}
      className={className}
    />
  )
}
