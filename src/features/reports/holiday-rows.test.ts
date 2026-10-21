import { describe, expect, it } from 'vitest'
import {
  LEGACY_HOLIDAY_CONCEPT,
  extrasLabel,
  holidayExtraHours,
  holidayLabel,
  isHolidayDay,
  motivoDay,
} from './holiday-rows'
import type { DayCalculation } from '@/types'

function day(overrides: Partial<DayCalculation> = {}): DayCalculation {
  return {
    date: '2026-07-19',
    start_time: '08:00',
    scheduled_end_time: '16:00',
    end_time: '17:00',
    concept: 'Trabajo normal',
    hours: 9,
    standard_hours: 8,
    extra_hours: 1,
    extra_time: '1:00',
    viatico: 1,
    viatico_amount: 180,
    regular_hours: 9,
    night_hours: 0,
    sunday_hours: 0,
    holiday_hours: 0,
    night_surcharge: 0,
    sunday_surcharge: 0,
    holiday_surcharge: 0,
    is_sunday: false,
    is_holiday: false,
    ...overrides,
  }
}

describe('isHolidayDay', () => {
  it('detects holidays coming from the database', () => {
    const d = day({ is_holiday: true, holiday_name: 'Revolución Sandinista' })
    expect(isHolidayDay(d)).toBe(true)
  })

  it('keeps supporting the legacy "Feriado Nacional" concept', () => {
    const d = day({ concept: LEGACY_HOLIDAY_CONCEPT })
    expect(isHolidayDay(d)).toBe(true)
  })

  it('returns false for a regular working day', () => {
    expect(isHolidayDay(day())).toBe(false)
  })
})

describe('holidayLabel', () => {
  it('uses the name from the database', () => {
    const d = day({ is_holiday: true, holiday_name: 'Revolución Sandinista' })
    expect(holidayLabel(d)).toBe('Revolución Sandinista')
  })

  it('falls back to the legacy concept', () => {
    const d = day({ concept: LEGACY_HOLIDAY_CONCEPT })
    expect(holidayLabel(d)).toBe(LEGACY_HOLIDAY_CONCEPT)
  })
})

describe('holidayExtraHours', () => {
  it('uses the surcharge computed by the policy', () => {
    const d = day({
      is_holiday: true,
      holiday_name: 'Navidad',
      holiday_hours: 9,
      holiday_surcharge: 9,
    })
    expect(holidayExtraHours(d)).toBe(9)
  })

  it('falls back to the day hours when there is no policy loaded', () => {
    const d = day({ is_holiday: true, holiday_name: 'Navidad' })
    expect(holidayExtraHours(d)).toBe(9)
  })

  it('is zero for a regular working day', () => {
    expect(holidayExtraHours(day())).toBe(0)
  })
})

describe('motivoDay', () => {
  it('keeps the concept of a regular day', () => {
    expect(motivoDay(day({ concept: 'Mantenimiento' }))).toBe('Mantenimiento')
  })

  it('uses "-" when there is no concept', () => {
    expect(motivoDay(day({ concept: '' }))).toBe('-')
  })

  it('shows the holiday name when there is no concept', () => {
    const d = day({ is_holiday: true, holiday_name: 'Navidad', concept: '' })
    expect(motivoDay(d)).toBe('Navidad')
  })

  it('combines the concept with the holiday name', () => {
    const d = day({
      is_holiday: true,
      holiday_name: 'Navidad',
      concept: 'Guardia',
    })
    expect(motivoDay(d)).toBe('Guardia · Navidad')
  })
})

describe('extrasLabel', () => {
  it('returns the extra time of a regular day', () => {
    expect(extrasLabel(day(), '16:00')).toBe('1:00')
  })

  it('adds the holiday surcharge on a holiday', () => {
    // 1h de extra + 9h de recargo de feriado (pago doble) = 10h
    const d = day({
      is_holiday: true,
      holiday_name: 'Navidad',
      holiday_hours: 9,
      holiday_surcharge: 9,
    })
    expect(extrasLabel(d, '16:00')).toBe('10:00')
  })

  it('falls back to the day hours for legacy holidays without a policy', () => {
    const d = day({ concept: LEGACY_HOLIDAY_CONCEPT })
    expect(extrasLabel(d, '16:00')).toBe('10:00')
  })
})
