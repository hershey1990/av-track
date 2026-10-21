/**
 * Reglas de feriado para los exports (Excel y PDF).
 *
 * La fuente de verdad de "este día es festivo" es la tabla `holidays` del
 * país, que llega ya resuelta en `DayCalculation.is_holiday`. Antes de que
 * esa tabla existiera, los feriados se registraban escribiendo el concepto
 * "Feriado Nacional" a mano, así que ese caso se conserva como respaldo
 * para no perder el pago doble de los registros históricos.
 */

import { calcExtraTime } from '@/lib/calculations'
import { extraTimeToMinutes } from './export-utils'
import type { DayCalculation } from '@/types'

/** Concepto con el que se registraban los feriados antes de la tabla. */
export const LEGACY_HOLIDAY_CONCEPT = 'Feriado Nacional'

/** ¿El día corresponde a un feriado? */
export function isHolidayDay(day: DayCalculation): boolean {
  return day.is_holiday || day.concept?.trim() === LEGACY_HOLIDAY_CONCEPT
}

/** Nombre del festivo (de la tabla `holidays` si lo hay). */
export function holidayLabel(day: DayCalculation): string {
  return day.holiday_name?.trim() || LEGACY_HOLIDAY_CONCEPT
}

/**
 * Horas extra que el día aporta al total por ser feriado.
 *
 * Con la política del país el recargo es `holiday_surcharge` (100% ⇒ las
 * horas se pagan al doble). Si la política no está cargada se cae a las
 * horas del día, que es como se comportaba el export anterior.
 */
export function holidayExtraHours(day: DayCalculation): number {
  if (!isHolidayDay(day)) return 0
  if (day.holiday_surcharge > 0) return day.holiday_surcharge
  return day.hours
}

/** Texto de la columna "MOTIVO HORAS EXTRAS". */
export function motivoDay(day: DayCalculation): string {
  const concept = day.concept?.trim()
  if (!isHolidayDay(day)) return concept || '-'

  const label = holidayLabel(day)
  if (!concept || concept === LEGACY_HOLIDAY_CONCEPT) return label
  return `${concept} · ${label}`
}

/**
 * Texto de la columna "EXTRAS": el tiempo extra del turno más el recargo
 * de feriado, para que la fila refleje lo que realmente se paga.
 */
export function extrasLabel(day: DayCalculation, scheduledEnd: string): string {
  const extraTime = calcExtraTime(scheduledEnd, day.end_time)
  const holidayHours = holidayExtraHours(day)
  if (holidayHours <= 0) return extraTime

  const totalMinutes =
    extraTimeToMinutes(extraTime) + Math.round(holidayHours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}
