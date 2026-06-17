import { THRESHOLD_VIATICO_HORAS } from '@/config/constants'
import type { EmploymentType, DayCalculation, PeriodSummary, TimeEntry } from '@/types'

export function getStandardHours(type: EmploymentType): number {
  return type === 'partime' ? 5 : 8
}

export function calcHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100
}

export function calcExtraHours(hours: number, standardHours: number): number {
  return Math.max(0, Math.round((hours - standardHours) * 100) / 100)
}

export function calcViatico(hours: number): boolean {
  return hours >= THRESHOLD_VIATICO_HORAS
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

  return {
    date: entry.date,
    start_time: entry.start_time,
    end_time: entry.end_time,
    concept: entry.concept,
    hours,
    standard_hours: standardHours,
    extra_hours: extraHours,
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
