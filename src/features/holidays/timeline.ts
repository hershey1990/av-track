/**
 * Helpers puros de la línea de tiempo de feriados.
 *
 * Todo el cálculo de posiciones vive aquí (sin React) para poder testearlo:
 * la línea dibuja el año completo de enero a diciembre, y cada feriado se
 * ubica en el porcentaje horizontal que le corresponde según el día real
 * dentro de su mes.
 *
 * Ejemplo: el 1 de enero cae en el 0% del año y el 31 de diciembre en el
 * 100%. El 19 de julio queda en ((7 - 1) + 18/31) / 12 ≈ 54.8%.
 */

import type { Holiday } from '@/types'

/** Etiquetas de los meses en español (índice 0 = enero). */
export const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const

/** Nombres completos de los meses, para la columna "Mes" de la tabla. */
export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const

/**
 * Separación mínima (en % del año) entre dos marcadores para que puedan
 * compartir la misma fila. Por debajo de este umbral se apilan en niveles
 * distintos para que los nombres no se tapen.
 */
export const MARKER_MIN_GAP_PCT = 3.5

/** Un feriado posicionado en la línea de tiempo. */
export interface TimelineMarker {
  holiday: Holiday
  /** Posición horizontal dentro del año (0-100). */
  leftPct: number
  /** Nivel vertical (0 = fila base) para evitar que los marcadores se pisen. */
  level: number
  /** Mes (1-12). */
  month: number
  /** Día del mes (1-31). */
  day: number
}

/** Un mes con los feriados que caen en él. */
export interface MonthGroup {
  /** Mes (1-12). */
  month: number
  /** Etiqueta corta: "Jul". */
  label: string
  /** Etiqueta larga: "Julio". */
  name: string
  holidays: Holiday[]
}

/** Número de días de un mes (1-12) en un año dado. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Posición horizontal de una fecha "yyyy-MM-dd" dentro de la línea del año,
 * como porcentaje (0-100).
 */
export function yearPositionPct(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const total = daysInMonth(year, month)
  // (mes - 1) meses completos + los días transcurridos del mes actual.
  const fraction = ((month - 1) + (day - 1) / total) / 12
  return fraction * 100
}

/** ¿La fecha pertenece al año dado? */
export function isInYear(dateStr: string, year: number): boolean {
  return dateStr.startsWith(`${year}-`)
}

/**
 * Construye los marcadores de la línea de tiempo, ordenados por fecha y
 * escalonados verticalmente cuando están demasiado cerca.
 */
export function buildTimelineMarkers(holidays: Holiday[]): TimelineMarker[] {
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))

  // Última posición usada en cada nivel, para apilar los marcadores cercanos.
  const lastPctByLevel: number[] = []

  return sorted.map((holiday) => {
    const [, month, day] = holiday.date.split('-').map(Number)
    const leftPct = yearPositionPct(holiday.date)

    let level = 0
    while (
      level < lastPctByLevel.length &&
      leftPct - lastPctByLevel[level] < MARKER_MIN_GAP_PCT
    ) {
      level++
    }
    lastPctByLevel[level] = leftPct

    return { holiday, leftPct, level, month, day }
  })
}

/** Agrupa los feriados por mes, en orden cronológico. */
export function groupByMonth(holidays: Holiday[]): MonthGroup[] {
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))
  const groups: MonthGroup[] = []

  for (const holiday of sorted) {
    const month = Number(holiday.date.slice(5, 7))
    const last = groups[groups.length - 1]
    if (last && last.month === month) {
      last.holidays.push(holiday)
    } else {
      groups.push({
        month,
        label: MONTH_LABELS[month - 1],
        name: MONTH_NAMES[month - 1],
        holidays: [holiday],
      })
    }
  }

  return groups
}

/**
 * Años disponibles para el selector: los que tienen feriados registrados más
 * el año en curso, para que siempre haya algo que mostrar.
 */
export function availableYears(holidays: Holiday[], currentYear: number): number[] {
  const years = new Set<number>(holidays.map((h) => Number(h.date.slice(0, 4))))
  years.add(currentYear)
  return [...years].sort((a, b) => a - b)
}

/** Filtra los feriados de un año concreto. */
export function holidaysOfYear(holidays: Holiday[], year: number): Holiday[] {
  return holidays.filter((h) => isInYear(h.date, year))
}
