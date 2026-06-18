/**
 * Nicaragua timezone utilities.
 *
 * Nicaragua observes Central Standard Time (UTC-6) year-round with no
 * daylight saving time.  All date computations in this app MUST use
 * these helpers so that behaviour is correct regardless of the
 * browser / system timezone.
 */

export const NICARAGUA_TIMEZONE = 'America/Managua'

/** Return today's date in Nicaragua as "yyyy-MM-dd". */
export function getTodayNicaragua(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: NICARAGUA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

/**
 * Parse a "yyyy-MM-dd" date-only string into its components.
 * This purposely avoids `new Date(str)` which treats the input as UTC
 * midnight and shifts the displayed date for timezones west of UTC.
 */
export function parseDateOnly(dateStr: string): {
  year: number
  month: number
  day: number
} {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

/**
 * Format a "yyyy-MM-dd" date string for short display (dd/MM).
 * Safe for date-only values from the database.
 */
export function formatDateShort(dateStr: string): string {
  const { month, day } = parseDateOnly(dateStr)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
}

/**
 * Format a "yyyy-MM-dd" date string for full display (dd/MM/yyyy).
 * Safe for date-only values from the database.
 */
export function formatDateFull(dateStr: string): string {
  const { year, month, day } = parseDateOnly(dateStr)
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

/**
 * Return the first and last day of the current month in Nicaragua
 * timezone as "yyyy-MM-dd" strings.
 */
export function getMonthRangeNicaragua(): {
  firstDay: string
  lastDay: string
} {
  const now = new Date()
  const yearMonthFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: NICARAGUA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  })
  const [yearStr, monthStr] = yearMonthFormatter.format(now).split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  // new Date(year, month, 0) → last day of previous month; .getDate()
  // is independent of timezone for this purpose
  const lastDayNum = new Date(year, month, 0).getDate()

  return {
    firstDay: `${yearStr}-${monthStr}-01`,
    lastDay: `${yearStr}-${monthStr}-${String(lastDayNum).padStart(2, '0')}`,
  }
}
