import { addDays, parseISO, format } from 'date-fns'
import { THRESHOLD_VIATICO_HORAS } from '@/config/constants'
import type {
  EmploymentType,
  DayCalculation,
  PeriodSummary,
  TimeEntry,
  PolicyConfig,
  Holiday,
} from '@/types'

// ── Helpers ────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function isSunday(dateStr: string): boolean {
  return new Date(dateStr + 'T12:00:00').getDay() === 0
}

function isHoliday(dateStr: string, holidays?: Holiday[]): Holiday | undefined {
  return holidays?.find((h) => h.date === dateStr)
}

/**
 * Calculate how many hours of a shift fall within the night window.
 * Handles windows that cross midnight (e.g. 19:00-06:00).
 */
export function calcNightHours(
  start: string,
  end: string,
  nightStart: string,
  nightEnd: string,
): number {
  const s = timeToMinutes(start)
  let e = timeToMinutes(end)
  const crossesMidnight = e <= s
  if (crossesMidnight) e += 24 * 60

  const ns = timeToMinutes(nightStart)
  const ne = timeToMinutes(nightEnd)
  let totalNight = 0

  if (ns > ne) {
    // Night window crosses midnight (e.g. 19:00-06:00)
    // On the clock: two sub-windows [00:00, ne) and [ns, 24:00)
    if (crossesMidnight) {
      // Shift also crosses midnight → compare on extended timeline
      totalNight = Math.max(0, Math.min(e, ne + 24 * 60) - Math.max(s, ns))
    } else {
      // Shift is fully within one calendar day
      const w1 = Math.max(0, Math.min(e, ne) - Math.max(s, 0))      // [00:00, ne)
      const w2 = Math.max(0, Math.min(e, 24 * 60) - Math.max(s, ns)) // [ns, 24:00)
      totalNight = Math.min(w1 + w2, e - s)
    }
  } else {
    // Simple window: no midnight crossing
    totalNight = Math.max(0, Math.min(e, ne) - Math.max(s, ns))
  }

  return Math.round((totalNight / 60) * 100) / 100
}

// ── Core calculations ─────────────────────────────────────────

export function getStandardHours(type: EmploymentType): number {
  return type === 'parttime' ? 5 : 8
}

export function calcHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100
}

export function calcExtraHours(hours: number, standardHours: number): number {
  const diffMinutes = Math.round((hours - standardHours) * 60)
  if (diffMinutes < 15) return 0
  // Bloques de 30 min: el umbral de 15 min activa el primer bloque
  return (Math.floor((diffMinutes - 15) / 30) + 1) * 0.5
}

export function calcViatico(hours: number): boolean {
  return hours >= THRESHOLD_VIATICO_HORAS
}

export function calcScheduledEndTime(
  startTime: string,
  type: EmploymentType
): string {
  const [sh, sm] = startTime.split(':').map(Number)
  const addHours = type === 'parttime' ? 5 : 8
  const totalMinutes = sh * 60 + sm + addHours * 60
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calcExtraTime(scheduledEnd: string, actualEnd: string): string {
  const [sh, sm] = scheduledEnd.split(':').map(Number)
  const [eh, em] = actualEnd.split(':').map(Number)
  const scheduledMinutes = sh * 60 + sm
  const actualMinutes = eh * 60 + em
  const diff = actualMinutes - scheduledMinutes
  if (diff <= 0) return '0:00'
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function generatePeriodDays(
  entries: TimeEntry[],
  startDate: string,
  endDate: string,
  type: EmploymentType,
  viaticoRate: number,
  policy?: PolicyConfig,
  holidays?: Holiday[]
): DayCalculation[] {
  const entryMap = new Map<string, TimeEntry>()
  for (const e of entries) {
    entryMap.set(e.date, e)
  }

  const days: DayCalculation[] = []
  let current = parseISO(startDate)
  const end = parseISO(endDate)

  while (current <= end) {
    const dateStr = format(current, 'yyyy-MM-dd')
    const entry = entryMap.get(dateStr)

    if (entry) {
      days.push(calcDay(entry, type, viaticoRate, policy, holidays))
    } else {
      days.push({
        date: dateStr,
        start_time: 'Off',
        scheduled_end_time: 'Off',
        end_time: 'Off',
        concept: 'Off',
        hours: 0,
        standard_hours: getStandardHours(type),
        extra_hours: 0,
        extra_time: 'Off',
        viatico: 0,
        viatico_amount: 0,
        regular_hours: 0,
        night_hours: 0,
        sunday_hours: 0,
        holiday_hours: 0,
        night_surcharge: 0,
        sunday_surcharge: 0,
        holiday_surcharge: 0,
        is_sunday: false,
        is_holiday: false,
      })
    }

    current = addDays(current, 1)
  }

  return days
}

export function calcDay(
  entry: TimeEntry,
  type: EmploymentType,
  viaticoRate: number,
  policy?: PolicyConfig,
  holidays?: Holiday[]
): DayCalculation {
  const hours = calcHours(entry.start_time, entry.end_time)
  const standardHours = getStandardHours(type)
  const extraHours = calcExtraHours(hours, standardHours)
  const tieneViatico = calcViatico(hours)
  const scheduledEnd = calcScheduledEndTime(entry.start_time, type)
  const extraTime = calcExtraTime(scheduledEnd, entry.end_time)

  const dateStr = entry.date
  const sunday = isSunday(dateStr)
  const holiday = isHoliday(dateStr, holidays)

  // Calculate regular vs night hours
  let regularHours = hours
  let nightHours = 0
  let nightSurcharge = 0
  let sundaySurcharge = 0
  let holidaySurcharge = 0

  if (policy) {
    nightHours = calcNightHours(
      entry.start_time,
      entry.end_time,
      policy.night_start,
      policy.night_end,
    )
    regularHours = Math.round((hours - nightHours) * 100) / 100

    if (nightHours > 0) {
      nightSurcharge = Math.round(nightHours * (policy.night_surcharge_pct / 100) * 100) / 100
    }
    if (sunday) {
      sundaySurcharge = Math.round(hours * (policy.sunday_surcharge_pct / 100) * 100) / 100
      // If also night hours, apply both surcharges
    }
    if (holiday) {
      holidaySurcharge = Math.round(hours * (policy.holiday_surcharge_pct / 100) * 100) / 100
    }
  } else {
    regularHours = hours
  }

  return {
    date: entry.date,
    start_time: entry.start_time,
    scheduled_end_time: scheduledEnd,
    end_time: entry.end_time,
    concept: entry.concept,
    hours,
    standard_hours: standardHours,
    extra_hours: extraHours,
    extra_time: extraTime,
    viatico: tieneViatico ? 1 : 0,
    viatico_amount: tieneViatico ? viaticoRate : 0,
    regular_hours: regularHours,
    night_hours: nightHours,
    sunday_hours: sunday ? hours : 0,
    holiday_hours: holiday ? hours : 0,
    night_surcharge: nightSurcharge,
    sunday_surcharge: sundaySurcharge,
    holiday_surcharge: holidaySurcharge,
    is_sunday: sunday,
    is_holiday: !!holiday,
    holiday_name: holiday?.name,
  }
}

export function calcPeriodSummary(
  entries: TimeEntry[],
  type: EmploymentType,
  viaticoRate: number,
  policy?: PolicyConfig,
  holidays?: Holiday[]
): PeriodSummary {
  const days = entries.map((e) => calcDay(e, type, viaticoRate, policy, holidays))

  return {
    days,
    total_hours: Math.round(days.reduce((s, d) => s + d.hours, 0) * 100) / 100,
    total_extra_hours: Math.round(days.reduce((s, d) => s + d.extra_hours, 0) * 100) / 100,
    total_viatico: days.reduce((s, d) => s + d.viatico_amount, 0),
    days_with_viatico: days.filter((d) => d.viatico).length,
  }
}

// ── Format helpers ─────────────────────────────────────────────

export function formatTime(time: string): string {
  return time.substring(0, 5)
}

export function formatHours(hours: number): string {
  return hours.toFixed(2)
}

export function formatCurrency(amount: number, currency = 'C$'): string {
  return `${currency}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}
