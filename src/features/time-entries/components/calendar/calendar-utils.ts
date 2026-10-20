/**
 * Utilidades puras de la vista de calendario.
 *
 * Todo el app maneja fechas como strings "yyyy-MM-dd" en zona Nicaragua
 * (ver `src/lib/timezone.ts`). `react-day-picker` trabaja con objetos `Date`,
 * así que aquí se concentran las conversiones en un solo sitio:
 *
 * - `fromDateOnly` → `Date` local (nunca `new Date('yyyy-MM-dd')`, que se
 *   interpretaría como UTC midnight y desplazaría el día).
 * - `toDateOnly` → string, usando `format` de date-fns sobre ese mismo `Date`.
 *
 * El round-trip `fromDateOnly` → `toDateOnly` es exacto para cualquier día.
 */

import { calcExtraHours, calcHours, getStandardHours } from '@/lib/calculations'
import { parseDateOnly } from '@/lib/timezone'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EmploymentType, TimeEntry } from '@/types'

/** Convierte un "yyyy-MM-dd" a un `Date` local (medianoche local). */
export function fromDateOnly(dateStr: string): Date {
  const { year, month, day } = parseDateOnly(dateStr)
  return new Date(year, month - 1, day)
}

/**
 * Convierte un `Date` a "yyyy-MM-dd" usando sus getters de calendario.
 *
 * Se usan los getters (`getFullYear`/`getMonth`/`getDate`) en lugar de
 * `toISOString()` porque `react-day-picker` entrega objetos `TZDate` fijados a
 * la zona horaria objetivo: sus getters ya devuelven el día local de esa zona,
 * mientras que `toISOString()` convertiría a UTC y desplazaría la fecha.
 */
export function toDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Suma un offset de días a un "yyyy-MM-dd" sin pasar por `Date`. */
export function shiftDateOnly(dateStr: string, days: number): string {
  const { year, month, day } = parseDateOnly(dateStr)
  const d = new Date(Date.UTC(year, month - 1, day))
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Día de la semana en formato `getDay()`: 0 = domingo … 6 = sábado. */
export function getWeekdayIndex(dateStr: string): number {
  const { year, month, day } = parseDateOnly(dateStr)
  // Mediodía en UTC para que el desplazamiento no cambie el día.
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
}

/** ¿La fecha corresponde a un domingo? */
export function isSundayDate(dateStr: string): boolean {
  return getWeekdayIndex(dateStr) === 0
}

/**
 * Agrupa entradas por fecha, ordenando cada grupo por `slot_index`.
 *
 * `getEntries` (ver `../api`) ordena por `date` descendente pero **no** por
 * `slot_index`, así que el orden hay que resolverlo aquí.
 */
export function groupByDate(entries: TimeEntry[]): Map<string, TimeEntry[]> {
  const map = new Map<string, TimeEntry[]>()
  for (const entry of entries) {
    const group = map.get(entry.date)
    if (group) group.push(entry)
    else map.set(entry.date, [entry])
  }
  for (const group of map.values()) {
    group.sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0))
  }
  return map
}

export interface DaySummary {
  /** Total de horas registradas en el día. */
  totalHours: number
  /** Horas extra del día (ya aplicadas los bloques de 30 min). */
  extraHours: number
  /** Número de entradas registradas. */
  entryCount: number
}

/**
 * Resumen de un día a partir de sus entradas.
 *
 * El cálculo de horas extra usa la misma regla que el resto del app: cada
 * entrada se compara contra la jornada estándar del tipo de employment
 * (`getStandardHours`) y se acumulan los bloques de 30 minutos.
 */
export function summarizeDay(
  entries: TimeEntry[],
  profileType: EmploymentType,
): DaySummary {
  const standard = getStandardHours(profileType)
  let totalHours = 0
  let extraHours = 0

  for (const entry of entries) {
    const hours = calcHours(entry.start_time, entry.end_time)
    totalHours += hours
    extraHours += calcExtraHours(hours, standard)
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    extraHours: Math.round(extraHours * 100) / 100,
    entryCount: entries.length,
  }
}

/**
 * Formatea horas en formato compacto "H:MM" (7.5 → "7:30", 0.75 → "0:45").
 * Se usa en la celda del calendario, donde el espacio es escaso.
 */
export function formatHoursHM(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0:00'
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Rango de fechas (inclusive) de un mes "yyyy-MM".
 * Devuelve el primer y el último día como "yyyy-MM-dd".
 */
export function getMonthRange(month: string): { firstDay: string; lastDay: string } {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)
  // new Date(year, monthNum, 0) → último día del mes anterior
  const lastDayNum = new Date(year, monthNum, 0).getDate()
  return {
    firstDay: `${yearStr}-${monthStr}-01`,
    lastDay: `${yearStr}-${monthStr}-${String(lastDayNum).padStart(2, '0')}`,
  }
}

/** Mes "yyyy-MM" de una fecha "yyyy-MM-dd". */
export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

/**
 * Etiqueta larga de un día en español: "Martes 20 de octubre".
 *
 * Se construye con `fromDateOnly` (medianoche local) y se formatea con los
 * getters locales, nunca con `new Date('yyyy-MM-dd')`. Solo la primera letra
 * va en mayúscula; el resto del rótulo va en minúsculas.
 */
export function formatDayLabel(dateStr: string): string {
  const { year, month, day } = parseDateOnly(dateStr)
  const label = format(new Date(year, month - 1, day), "EEEE d 'de' MMMM", {
    locale: es,
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Suma un offset de meses a un mes "yyyy-MM". */
export function shiftMonth(month: string, months: number): string {
  const [yearStr, monthStr] = month.split('-')
  const d = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1 + months, 1))
  return d.toISOString().slice(0, 7)
}
