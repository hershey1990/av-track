import { addDays, parseISO, format } from 'date-fns'
import { THRESHOLD_VIATICO_HORAS } from '@/config/constants'
import type { EmploymentType, DayCalculation, PeriodSummary, TimeEntry } from '@/types'

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
  viaticoRate: number
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
      days.push(calcDay(entry, type, viaticoRate))
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
      })
    }

    current = addDays(current, 1)
  }

  return days
}

export function calcDay(
  entry: TimeEntry,
  type: EmploymentType,
  viaticoRate: number
): DayCalculation {
  const hours = calcHours(entry.start_time, entry.end_time)
  const standardHours = getStandardHours(type)
  const extraHours = calcExtraHours(hours, standardHours)
  const tieneViatico = calcViatico(hours)
  const scheduledEnd = calcScheduledEndTime(entry.start_time, type)
  const extraTime = calcExtraTime(scheduledEnd, entry.end_time)

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
  }
}

export function calcPeriodSummary(
  entries: TimeEntry[],
  type: EmploymentType,
  viaticoRate: number
): PeriodSummary {
  const days = entries.map((e) => calcDay(e, type, viaticoRate))

  return {
    days,
    total_hours: Math.round(days.reduce((s, d) => s + d.hours, 0) * 100) / 100,
    total_extra_hours: Math.round(days.reduce((s, d) => s + d.extra_hours, 0) * 100) / 100,
    total_viatico: days.reduce((s, d) => s + d.viatico_amount, 0),
    days_with_viatico: days.filter((d) => d.viatico).length,
  }
}

export function formatTime(time: string): string {
  return time.substring(0, 5)
}

export function formatHours(hours: number): string {
  return hours.toFixed(2)
}

export function formatCurrency(amount: number): string {
  return `C$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}
