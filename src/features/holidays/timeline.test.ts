import { describe, expect, it } from 'vitest'
import {
  MARKER_MIN_GAP_PCT,
  availableYears,
  buildTimelineMarkers,
  daysInMonth,
  groupByMonth,
  holidaysOfYear,
  yearPositionPct,
} from './timeline'
import type { Holiday } from '@/types'

function holiday(date: string, name = 'Festivo'): Holiday {
  return { id: `h-${date}`, country_id: 'ni', date, name }
}

describe('daysInMonth', () => {
  it('returns the length of each month', () => {
    expect(daysInMonth(2026, 1)).toBe(31)
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2026, 4)).toBe(30)
  })
})

describe('yearPositionPct', () => {
  it('places the first day of January at the start of the line', () => {
    expect(yearPositionPct('2026-01-01')).toBeCloseTo(0, 5)
  })

  it('places the last day of December at the end of the line', () => {
    // (11 + 30/31) / 12
    expect(yearPositionPct('2026-12-31')).toBeCloseTo((11 + 30 / 31) / 12 * 100, 5)
  })

  it('places a holiday on the day it falls, not on the month start', () => {
    // 19/07 → (6 + 18/31) / 12
    expect(yearPositionPct('2026-07-19')).toBeCloseTo(((6 + 18 / 31) / 12) * 100, 5)
    expect(yearPositionPct('2026-07-01')).toBeCloseTo((6 / 12) * 100, 5)
  })

  it('keeps every position inside the line', () => {
    for (let month = 1; month <= 12; month++) {
      const total = daysInMonth(2026, month)
      for (const day of [1, Math.ceil(total / 2), total]) {
        const pct = yearPositionPct(`2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
        expect(pct).toBeGreaterThanOrEqual(0)
        expect(pct).toBeLessThan(100)
      }
    }
  })
})

describe('buildTimelineMarkers', () => {
  it('sorts markers by date', () => {
    const markers = buildTimelineMarkers([
      holiday('2026-12-25', 'Navidad'),
      holiday('2026-01-01', 'Año Nuevo'),
      holiday('2026-07-19', 'Revolución'),
    ])

    expect(markers.map((m) => m.holiday.name)).toEqual([
      'Año Nuevo',
      'Revolución',
      'Navidad',
    ])
  })

  it('stacks markers that fall too close together', () => {
    // 14/09 y 15/09 están a menos de 1% de distancia.
    const markers = buildTimelineMarkers([
      holiday('2026-09-14', 'San Jacinto'),
      holiday('2026-09-15', 'Independencia'),
    ])

    expect(markers[0].level).toBe(0)
    expect(markers[1].level).toBe(1)
  })

  it('keeps far apart markers on the same level', () => {
    const markers = buildTimelineMarkers([
      holiday('2026-01-01', 'Año Nuevo'),
      holiday('2026-12-25', 'Navidad'),
    ])

    expect(markers[0].level).toBe(0)
    expect(markers[1].level).toBe(0)
  })

  it('exposes the month and day of each marker', () => {
    const [marker] = buildTimelineMarkers([holiday('2026-07-19', 'Revolución')])
    expect(marker.month).toBe(7)
    expect(marker.day).toBe(19)
  })
})

describe('groupByMonth', () => {
  it('groups holidays by month keeping chronological order', () => {
    const groups = groupByMonth([
      holiday('2026-01-01', 'Año Nuevo'),
      holiday('2026-09-14', 'San Jacinto'),
      holiday('2026-09-15', 'Independencia'),
    ])

    expect(groups.map((g) => g.month)).toEqual([1, 9])
    expect(groups[1].holidays).toHaveLength(2)
    expect(groups[1].label).toBe('Sep')
    expect(groups[1].name).toBe('Septiembre')
  })

  it('returns an empty list when there are no holidays', () => {
    expect(groupByMonth([])).toEqual([])
  })
})

describe('availableYears', () => {
  it('lists the years present plus the current year', () => {
    const years = availableYears(
      [holiday('2026-01-01'), holiday('2027-01-01')],
      2026,
    )
    expect(years).toEqual([2026, 2027])
  })

  it('includes the current year even without holidays', () => {
    expect(availableYears([], 2028)).toEqual([2028])
  })
})

describe('holidaysOfYear', () => {
  it('keeps only the holidays of the requested year', () => {
    const all = [holiday('2026-01-01'), holiday('2027-01-01')]
    expect(holidaysOfYear(all, 2027)).toHaveLength(1)
    expect(holidaysOfYear(all, 2027)[0].date).toBe('2027-01-01')
    expect(holidaysOfYear(all, 2025)).toHaveLength(0)
  })
})

describe('MARKER_MIN_GAP_PCT', () => {
  it('is smaller than a month so stacked markers stay close', () => {
    expect(MARKER_MIN_GAP_PCT).toBeLessThan(100 / 12)
  })
})
