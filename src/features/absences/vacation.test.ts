import { afterEach, describe, expect, it, vi } from 'vitest'
import { generatePeriodDays, getStandardHours } from '@/lib/calculations'
import { vacationSchema } from './vacation-schema'
import { buildDailySeries, computeSummaryKpis } from '@/features/reports/aggregation'
import { vacationExportRow } from '@/features/reports/export-utils'
import type { Absence, TimeEntry } from '@/types'

const vacation: Absence = {
  id: 'a', user_id: 'u', type: 'vacation', status: 'approved',
  start_date: '2026-12-31', end_date: '2027-01-03', created_at: '', updated_at: '',
}

describe('vacaciones pagadas', () => {
  it.each(['parttime', 'fulltime'] as const)('acredita cada día calendario para %s, sin extras ni recargos', (type) => {
    const days = generatePeriodDays([], '2026-12-30', '2027-01-04', type, 180, undefined,
      [{ id: 'h', country_id: 'n', date: '2027-01-01', name: 'Feriado' }], [vacation])
    expect(days.map((day) => day.vacation_hours ?? 0)).toEqual([0, ...Array(4).fill(getStandardHours(type)), 0])
    for (const day of days.slice(1, 5)) {
      expect(day.concept).toBe('Vacaciones')
      expect(day.hours).toBe(0)
      expect([day.extra_hours, day.viatico_amount, day.night_surcharge, day.sunday_surcharge, day.holiday_surcharge]).toEqual([0, 0, 0, 0, 0])
    }
  })

  it('no acredita solicitudes pendientes o rechazadas', () => {
    for (const status of ['pending', 'rejected'] as const) {
      const days = generatePeriodDays([], '2027-01-01', '2027-01-01', 'fulltime', 0, undefined, undefined, [{ ...vacation, status }])
      expect(days[0].concept).toBe('Off')
      expect(days[0].vacation_hours).toBe(0)
    }
  })

  it('no oculta un conflicto histórico con registros de trabajo', () => {
    const entry: TimeEntry = { id: 'e', user_id: 'u', date: '2027-01-01', start_time: '08:00', end_time: '16:00', concept: '', notes: '', created_at: '', updated_at: '' }
    expect(() => generatePeriodDays([entry], '2027-01-01', '2027-01-01', 'fulltime', 0, undefined, undefined, [vacation])).toThrow('2027-01-01')
  })

  it('distingue el crédito de las horas trabajadas en reportes y exportaciones', () => {
    const days = generatePeriodDays([], '2027-01-01', '2027-01-01', 'fulltime', 0, undefined, undefined, [vacation])
    const daily = buildDailySeries(days, 'fulltime')[0]
    expect(daily.totalHours).toBe(0)
    expect(daily.vacationHours).toBe(getStandardHours('fulltime'))
    expect(computeSummaryKpis(days, 'fulltime').workingDays).toBe(0)
    expect(vacationExportRow(days[0].date, daily.vacationHours)).toEqual([
      '01/01', '-', '-', '-', '0:00', `Vacaciones pagadas (${daily.vacationHours} h)`, '', '',
    ])
  })
})

describe('validación de fechas de vacaciones', () => {
  afterEach(() => vi.useRealTimers())

  it('permite hoy en Nicaragua y rechaza el día anterior y rangos invertidos', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-01-01T04:00:00Z'))
    const value = { start_date: '2026-12-31', end_date: '2027-01-01', status: 'approved' }
    expect(vacationSchema.safeParse(value).success).toBe(true)
    expect(vacationSchema.safeParse({ ...value, start_date: '2026-12-30' }).success).toBe(false)
    expect(vacationSchema.safeParse({ ...value, end_date: '2026-12-30' }).success).toBe(false)
    expect(vacationSchema.safeParse({ ...value, end_date: '2027-02-30' }).success).toBe(false)
  })
})
