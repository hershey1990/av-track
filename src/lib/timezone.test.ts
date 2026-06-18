import { describe, it, expect } from 'vitest'
import {
  NICARAGUA_TIMEZONE,
  getTodayNicaragua,
  parseDateOnly,
  formatDateShort,
  formatDateFull,
  getMonthRangeNicaragua,
} from './timezone'

describe('NICARAGUA_TIMEZONE', () => {
  it('should be America/Managua', () => {
    expect(NICARAGUA_TIMEZONE).toBe('America/Managua')
  })
})

describe('getTodayNicaragua', () => {
  it('should return a yyyy-MM-dd string', () => {
    const result = getTodayNicaragua()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should return a valid date', () => {
    const result = getTodayNicaragua()
    const [y, m, d] = result.split('-').map(Number)
    expect(y).toBeGreaterThanOrEqual(2025)
    expect(m).toBeGreaterThanOrEqual(1)
    expect(m).toBeLessThanOrEqual(12)
    expect(d).toBeGreaterThanOrEqual(1)
    expect(d).toBeLessThanOrEqual(31)
  })

  it('should match the date in America/Managua timezone', () => {
    const result = getTodayNicaragua()
    // Compare against Intl.DateTimeFormat in same timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Managua',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    expect(result).toBe(formatter.format(new Date()))
  })
})

describe('parseDateOnly', () => {
  it('should parse "2025-01-15" correctly', () => {
    const result = parseDateOnly('2025-01-15')
    expect(result).toEqual({ year: 2025, month: 1, day: 15 })
  })

  it('should parse "2025-12-31" correctly', () => {
    const result = parseDateOnly('2025-12-31')
    expect(result).toEqual({ year: 2025, month: 12, day: 31 })
  })

  it('should parse single-digit month/day correctly', () => {
    const result = parseDateOnly('2025-03-05')
    expect(result).toEqual({ year: 2025, month: 3, day: 5 })
  })
})

describe('formatDateShort', () => {
  it('should format as dd/MM', () => {
    expect(formatDateShort('2025-01-15')).toBe('15/01')
  })

  it('should pad single digits', () => {
    expect(formatDateShort('2025-03-05')).toBe('05/03')
  })

  it('should work for year-end dates', () => {
    expect(formatDateShort('2025-12-31')).toBe('31/12')
  })

  it('should NOT be affected by timezone (no Date constructor)', () => {
    // This is the key test: formatDateShort must never use new Date()
    // so it always shows the exact date from the database
    expect(formatDateShort('2025-06-15')).toBe('15/06')
  })
})

describe('formatDateFull', () => {
  it('should format as dd/MM/yyyy', () => {
    expect(formatDateFull('2025-01-15')).toBe('15/01/2025')
  })

  it('should pad single digits', () => {
    expect(formatDateFull('2025-03-05')).toBe('05/03/2025')
  })

  it('should work for year-end dates', () => {
    expect(formatDateFull('2025-12-31')).toBe('31/12/2025')
  })

  it('should NOT be affected by timezone (no Date constructor)', () => {
    expect(formatDateFull('2025-06-15')).toBe('15/06/2025')
  })
})

describe('getMonthRangeNicaragua', () => {
  it('should return valid date strings', () => {
    const { firstDay, lastDay } = getMonthRangeNicaragua()
    expect(firstDay).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(lastDay).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('firstDay should be the 1st of the month', () => {
    const { firstDay } = getMonthRangeNicaragua()
    expect(firstDay.endsWith('-01')).toBe(true)
  })

  it('lastDay should be after firstDay', () => {
    const { firstDay, lastDay } = getMonthRangeNicaragua()
    expect(lastDay >= firstDay).toBe(true)
  })

  it('lastDay should be a valid end-of-month', () => {
    const { lastDay } = getMonthRangeNicaragua()
    const [y, m, d] = lastDay.split('-').map(Number)
    // last day of month must be between 28 and 31
    expect(d).toBeGreaterThanOrEqual(28)
    expect(d).toBeLessThanOrEqual(31)
  })

  it('should use Nicaragua timezone', () => {
    // Verify that the year/month matches America/Managua
    const { firstDay } = getMonthRangeNicaragua()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Managua',
      year: 'numeric',
      month: '2-digit',
    })
    const expectedPrefix = formatter.format(new Date()) // "yyyy-MM"
    expect(firstDay.startsWith(expectedPrefix)).toBe(true)
  })
})
