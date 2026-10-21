/**
 * Generador del nombre automático de un período.
 *
 * El nombre es opcional en el formulario: si el admin lo deja vacío se deriva
 * de las fechas con el mismo formato que usan los períodos ya existentes
 * ("Octubre 2026 a Noviembre 2026", "Diciembre 2026 a Enero 2027").
 */

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { fromDateOnly } from '@/lib/timezone'

/** "octubre 2026" → "Octubre 2026" (el locale `es` devuelve el mes en minúscula). */
function monthYear(date: Date): string {
  const label = format(date, 'MMMM yyyy', { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/**
 * Construye el nombre de un período a partir de sus fechas.
 *
 * - Mismo mes y año → "Octubre 2026".
 * - Meses distintos → "Octubre 2026 a Noviembre 2026" (el año se repite en
 *   cada extremo, también cuando el rango cruza el cambio de año).
 * - Fechas ausentes o incompletas → "" (el nombre queda vacío y el formulario
 *   lo trata como "sin nombre").
 */
export function buildPeriodName(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ''

  const start = fromDateOnly(startDate)
  const end = fromDateOnly(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''

  const startLabel = monthYear(start)
  const endLabel = monthYear(end)

  return startLabel === endLabel ? startLabel : `${startLabel} a ${endLabel}`
}
