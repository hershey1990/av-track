/**
 * Reglas de alta de períodos.
 *
 * La regla de negocio es:
 *
 * - La fecha de inicio **puede** ser retroactiva, pero nunca anterior al día
 *   siguiente del fin del último período ya cerrado (el que tiene el `end_date`
 *   más alto entre los que terminan antes de hoy). Es decir, un período nuevo
 *   no puede "cortarle" la cola a un período ya cerrado.
 * - Un período nuevo **no puede solaparse** con ningún período existente
 *   (pasado o futuro).
 *
 * Estas funciones son puras (no dependen de React) para poder probarlas.
 */

import { shiftDate, formatDateFull } from '@/lib/timezone'

/** Datos mínimos de un período para poder aplicar las reglas. */
export interface PeriodRange {
  id: string
  name: string
  start_date: string
  end_date: string
}

const FAR_FUTURE = '9999-12-31'

/**
 * Fecha de inicio mínima admitida en el alta.
 *
 * - Si no hay períodos cerrados, el mínimo es hoy (no se puede abrir un
 *   período en el pasado sin un período previo al que encadenarse).
 * - Si los hay, el mínimo es el día siguiente al fin del último período
 *   cerrado. Puede ser anterior a hoy ⇒ se permite abrir un período
 *   retroactivo, pero nunca antes de ese último período cerrado.
 */
export function getMinStartDate(
  periods: PeriodRange[],
  today: string,
): string {
  const closed = periods.filter((p) => p.end_date < today)
  if (!closed.length) return today

  const lastClosedEnd = closed.reduce(
    (max, p) => (p.end_date > max ? p.end_date : max),
    '',
  )
  return shiftDate(lastClosedEnd, 1)
}

/**
 * Períodos que se solapan con el rango indicado.
 *
 * Dos rangos se solapan si `a.start <= b.end` y `a.end >= b.start`.
 * `excludeId` sirve para no comparar el período consigo mismo al editarlo.
 */
export function findOverlappingPeriods(
  periods: PeriodRange[],
  startDate: string,
  endDate: string,
  excludeId?: string,
): PeriodRange[] {
  if (!startDate || !endDate) return []
  return periods.filter(
    (p) =>
      p.id !== excludeId &&
      p.start_date <= endDate &&
      p.end_date >= startDate,
  )
}

/**
 * Fecha de fin máxima admitida para un inicio dado: el día anterior al
 * inicio del período siguiente (el más cercano que empieza después).
 * `undefined` si no hay ningún período posterior.
 */
export function getMaxEndDate(
  periods: PeriodRange[],
  startDate: string,
  excludeId?: string,
): string | undefined {
  if (!startDate) return undefined

  const nextStart = periods
    .filter((p) => p.id !== excludeId && p.start_date > startDate)
    .reduce((min, p) => (p.start_date < min ? p.start_date : min), FAR_FUTURE)

  return nextStart === FAR_FUTURE ? undefined : shiftDate(nextStart, -1)
}

/** Borrador de un período (sólo las fechas). */
export interface PeriodDraft {
  start_date: string
  end_date: string
}

/** Errores de validación del alta, por campo. */
export interface PeriodValidationErrors {
  start_date?: string
  end_date?: string
}

/**
 * Valida un período nuevo contra los períodos existentes.
 *
 * - El inicio no puede ser anterior al día siguiente del fin del último
 *   período cerrado (o a hoy si no hay ninguno).
 * - El rango no puede solaparse con ningún período existente.
 */
export function validateNewPeriod(
  periods: PeriodRange[],
  draft: PeriodDraft,
  today: string,
): PeriodValidationErrors {
  const errors: PeriodValidationErrors = {}

  if (!draft.start_date || !draft.end_date) return errors

  const minStart = getMinStartDate(periods, today)
  if (draft.start_date < minStart) {
    errors.start_date = `No se puede abrir un período antes del ${formatDateFull(minStart)}`
  }

  const overlapping = findOverlappingPeriods(
    periods,
    draft.start_date,
    draft.end_date,
  )
  if (overlapping.length) {
    errors.end_date = `El período se solapa con "${overlapping[0].name}"`
  }

  return errors
}
