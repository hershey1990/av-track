import { describe, it, expect } from 'vitest'
import {
  calcExtraHours,
  calcHours,
  calcDay,
  calcPeriodSummary,
  getStandardHours,
  calcViatico,
  calcScheduledEndTime,
  calcExtraTime,
  generatePeriodDays,
  formatTime,
  formatHours,
  formatCurrency,
} from './calculations'
import type { TimeEntry, EmploymentType } from '@/types'

// ── getStandardHours ──────────────────────────────────────────

describe('getStandardHours', () => {
  it('returns 5 for partime', () => {
    expect(getStandardHours('partime')).toBe(5)
  })

  it('returns 8 for fulltime', () => {
    expect(getStandardHours('fulltime')).toBe(8)
  })
})

// ── calcHours ─────────────────────────────────────────────────

describe('calcHours', () => {
  it('calculates exact hours', () => {
    expect(calcHours('08:00', '13:00')).toBeCloseTo(5, 2)
  })

  it('handles minutes correctly', () => {
    expect(calcHours('08:00', '13:15')).toBeCloseTo(5.25, 2)
  })

  it('handles crossing noon', () => {
    expect(calcHours('08:30', '17:45')).toBeCloseTo(9.25, 2)
  })

  it('rounds to 2 decimals', () => {
    expect(calcHours('09:00', '17:00')).toBeCloseTo(8, 2)
  })
})

// ── calcExtraHours ────────────────────────────────────────────

describe('calcExtraHours', () => {
  it('returns 0 when diff is 0', () => {
    expect(calcExtraHours(5, 5)).toBe(0)
    expect(calcExtraHours(8, 8)).toBe(0)
  })

  it('returns 0 when diff is negative (under standard)', () => {
    expect(calcExtraHours(4, 5)).toBe(0)
    expect(calcExtraHours(7, 8)).toBe(0)
  })

  it('returns 0 for less than 15 minutes extra', () => {
    // 5h 1min = 5.02h, diff = 1 min
    expect(calcExtraHours(5.02, 5)).toBe(0)
    // 5h 14min = 5.23h, diff = 14 min
    expect(calcExtraHours(5.23, 5)).toBe(0)
    // 8h 14min = 8.23h, diff = 14 min
    expect(calcExtraHours(8.23, 8)).toBe(0)
  })

  it('returns 0.5 for exactly 15 minutes extra', () => {
    // part-time: 5h + 15min = 0.5 extra hour (primer bloque)
    expect(calcExtraHours(5.25, 5)).toBe(0.5)
    // full-time: 8h + 15min = 0.5 extra hour (primer bloque)
    expect(calcExtraHours(8.25, 8)).toBe(0.5)
  })

  it('returns 0.5 for 16 minutes extra (primer bloque)', () => {
    expect(calcExtraHours(5.27, 5)).toBe(0.5)
  })

  it('returns 0.5 for exactly 30 minutes extra (mismo bloque)', () => {
    expect(calcExtraHours(5.5, 5)).toBe(0.5)
    expect(calcExtraHours(8.5, 8)).toBe(0.5)
  })

  it('returns 1.0 for 45 minutes extra (segundo bloque)', () => {
    expect(calcExtraHours(5.75, 5)).toBe(1.0)
    expect(calcExtraHours(8.75, 8)).toBe(1.0)
  })

  it('returns 1.0 for 1 hour extra (60 min, mismo bloque)', () => {
    expect(calcExtraHours(6, 5)).toBe(1.0)
    expect(calcExtraHours(9, 8)).toBe(1.0)
  })

  it('handles large overtime values', () => {
    // 2 horas extra = 120 min = (120-15)/30 = 3 → +1 = 4 → ×0.5 = 2.0
    expect(calcExtraHours(7, 5)).toBe(2.0)
  })
})

// ── calcViatico ───────────────────────────────────────────────

describe('calcViatico', () => {
  it('returns false for hours less than 7', () => {
    expect(calcViatico(6.99)).toBe(false)
  })

  it('returns true for 7 or more hours', () => {
    expect(calcViatico(7)).toBe(true)
    expect(calcViatico(8)).toBe(true)
  })
})

// ── calcDay ───────────────────────────────────────────────────

describe('calcDay', () => {
  const partimeEntry: TimeEntry = {
    id: '1',
    user_id: 'u1',
    date: '2025-06-17',
    start_time: '08:00',
    end_time: '13:15',
    concept: 'Soporte técnico',
    notes: '',
    created_at: '',
    updated_at: '',
  }

  const fulltimeEntry: TimeEntry = {
    id: '2',
    user_id: 'u1',
    date: '2025-06-17',
    start_time: '08:00',
    end_time: '17:15',
    concept: 'Desarrollo',
    notes: '',
    created_at: '',
    updated_at: '',
  }

  it('calculates a part-time day with 0.5 extra hour', () => {
    const result = calcDay(partimeEntry, 'partime', 180)
    expect(result.hours).toBeCloseTo(5.25, 2)
    expect(result.standard_hours).toBe(5)
    expect(result.extra_hours).toBe(0.5) // 15 min extra → primer bloque (0.5h)
    expect(result.scheduled_end_time).toBe('13:00') // 08:00 + 5h
    expect(result.extra_time).toBe('0:15')
    expect(result.viatico).toBe(0)   // under 7h
    expect(result.viatico_amount).toBe(0)
  })

  it('calculates a full-time day with 1.5 extra hours', () => {
    const result = calcDay(fulltimeEntry, 'fulltime', 180)
    expect(result.hours).toBeCloseTo(9.25, 2)
    expect(result.standard_hours).toBe(8)
    expect(result.extra_hours).toBe(1.5) // 1h15min = 75min → tercer bloque (1.5h)
    expect(result.scheduled_end_time).toBe('16:00') // 08:00 + 8h
    expect(result.extra_time).toBe('1:15')
    expect(result.viatico).toBe(1)   // over 7h
    expect(result.viatico_amount).toBe(180)
  })

  it('returns 0 extra hours when under standard', () => {
    const underEntry: TimeEntry = {
      id: '3',
      user_id: 'u1',
      date: '2025-06-17',
      start_time: '08:00',
      end_time: '12:00',
      concept: 'Reunión',
      notes: '',
      created_at: '',
      updated_at: '',
    }
    const result = calcDay(underEntry, 'fulltime', 180)
    expect(result.hours).toBeCloseTo(4, 2)
    expect(result.extra_hours).toBe(0)
    expect(result.scheduled_end_time).toBe('16:00')
    expect(result.extra_time).toBe('0:00')
  })
})

// ── calcPeriodSummary ─────────────────────────────────────────

describe('calcPeriodSummary', () => {
  const makeEntry = (date: string, start: string, end: string): TimeEntry => ({
    id: date,
    user_id: 'u1',
    date,
    start_time: start,
    end_time: end,
    concept: 'Trabajo',
    notes: '',
    created_at: '',
    updated_at: '',
  })

  it('aggregates multiple days correctly', () => {
    const entries = [
      makeEntry('2025-06-16', '08:00', '13:15'), // part-time: 5.25h, 0.5 extra
      makeEntry('2025-06-17', '08:00', '13:30'), // part-time: 5.5h, 0.5 extra
      makeEntry('2025-06-18', '08:00', '13:00'), // part-time: 5.0h, 0 extra
    ]

    const result = calcPeriodSummary(entries, 'partime', 180)

    expect(result.days).toHaveLength(3)
    expect(result.total_hours).toBeCloseTo(15.75, 2)
    expect(result.total_extra_hours).toBeCloseTo(1.0, 2) // 0.5 + 0.5 + 0
    expect(result.total_viatico).toBe(0)     // none reached 7h
    expect(result.days_with_viatico).toBe(0)
  })

  it('counts viatico correctly for full-time workers', () => {
    const entries = [
      makeEntry('2025-06-16', '08:00', '17:00'), // full-time: 9h, viatico
      makeEntry('2025-06-17', '08:00', '16:00'), // full-time: 8h, no viatico (exactly 8 is under 7... wait, 8>=7 is true)
    ]

    const result = calcPeriodSummary(entries, 'fulltime', 180)

    // 9h → 8h standard + 1h extra = segundo bloque (1.0h), viatico
    // 8h → 0 extra, viatico (8 >= 7)
    expect(result.days).toHaveLength(2)
    expect(result.total_viatico).toBe(360) // 180 * 2
    expect(result.days_with_viatico).toBe(2)
  })
})

// ── calcScheduledEndTime ──────────────────────────────────────

describe('calcScheduledEndTime', () => {
  it('adds 5 hours for part-time', () => {
    expect(calcScheduledEndTime('03:00', 'partime')).toBe('08:00')
    expect(calcScheduledEndTime('08:00', 'partime')).toBe('13:00')
  })

  it('adds 8 hours for full-time', () => {
    expect(calcScheduledEndTime('03:00', 'fulltime')).toBe('11:00')
    expect(calcScheduledEndTime('08:00', 'fulltime')).toBe('16:00')
  })

  it('wraps around midnight correctly', () => {
    expect(calcScheduledEndTime('20:00', 'partime')).toBe('01:00')
    expect(calcScheduledEndTime('18:00', 'fulltime')).toBe('02:00')
  })
})

// ── calcExtraTime ─────────────────────────────────────────────

describe('calcExtraTime', () => {
  it('returns 0:00 when no extra time', () => {
    expect(calcExtraTime('08:00', '08:00')).toBe('0:00')
    expect(calcExtraTime('16:00', '16:00')).toBe('0:00')
  })

  it('returns 0:00 when actual is less than scheduled', () => {
    expect(calcExtraTime('08:00', '07:00')).toBe('0:00')
  })

  it('returns H:MM for extra time less than 1 hour', () => {
    expect(calcExtraTime('08:00', '08:30')).toBe('0:30')
    expect(calcExtraTime('08:00', '08:15')).toBe('0:15')
  })

  it('returns H:MM for exactly 1 hour', () => {
    expect(calcExtraTime('08:00', '09:00')).toBe('1:00')
  })

  it('returns H:MM for mixed hours and minutes', () => {
    expect(calcExtraTime('08:00', '09:30')).toBe('1:30')
    expect(calcExtraTime('08:00', '12:00')).toBe('4:00')
    expect(calcExtraTime('08:00', '13:00')).toBe('5:00')
  })

  it('works with afternoon times', () => {
    expect(calcExtraTime('16:00', '17:30')).toBe('1:30')
  })
})

// ── generatePeriodDays ────────────────────────────────────────

describe('generatePeriodDays', () => {
  const makeEntry = (date: string, start: string, end: string): TimeEntry => ({
    id: date,
    user_id: 'u1',
    date,
    start_time: start,
    end_time: end,
    concept: 'Trabajo',
    notes: '',
    created_at: '',
    updated_at: '',
  })

  it('generates all days in the period including Off days', () => {
    const entries = [
      makeEntry('2025-06-16', '08:00', '13:00'),
      makeEntry('2025-06-18', '08:00', '13:00'),
    ]

    const result = generatePeriodDays(entries, '2025-06-16', '2025-06-20', 'partime', 180)

    expect(result).toHaveLength(5) // 16, 17, 18, 19, 20
    expect(result[0].date).toBe('2025-06-16')
    expect(result[0].concept).toBe('Trabajo')
    expect(result[1].date).toBe('2025-06-17')
    expect(result[1].concept).toBe('Off')
    expect(result[1].start_time).toBe('Off')
    expect(result[1].end_time).toBe('Off')
    expect(result[1].scheduled_end_time).toBe('Off')
    expect(result[1].extra_time).toBe('Off')
    expect(result[1].hours).toBe(0)
    expect(result[1].extra_hours).toBe(0)
    expect(result[1].viatico).toBe(0)
    expect(result[2].date).toBe('2025-06-18')
    expect(result[2].concept).toBe('Trabajo')
    expect(result[3].concept).toBe('Off')
    expect(result[4].concept).toBe('Off')
  })

  it('returns empty array for empty period', () => {
    const result = generatePeriodDays([], '2025-06-16', '2025-06-15', 'fulltime', 180)
    expect(result).toHaveLength(0)
  })

  it('returns single day for same start and end', () => {
    const entries = [makeEntry('2025-06-16', '08:00', '16:00')]
    const result = generatePeriodDays(entries, '2025-06-16', '2025-06-16', 'fulltime', 180)
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2025-06-16')
  })
})

// ── format helpers ────────────────────────────────────────────

describe('formatTime', () => {
  it('returns HH:MM from full ISO time', () => {
    expect(formatTime('08:00:00')).toBe('08:00')
    expect(formatTime('13:15:00')).toBe('13:15')
  })
})

describe('formatHours', () => {
  it('formats to 2 decimal places', () => {
    expect(formatHours(5.25)).toBe('5.25')
    expect(formatHours(8)).toBe('8.00')
  })
})

describe('formatCurrency', () => {
  it('formats with currency symbol and commas', () => {
    expect(formatCurrency(180)).toBe('C$180.00')
    expect(formatCurrency(1500)).toBe('C$1,500.00')
  })
})
