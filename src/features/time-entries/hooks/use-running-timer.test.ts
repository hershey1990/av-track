import { describe, it, expect } from 'vitest'
import { eachDate, splitSegments } from './use-running-timer'
import { getNicaraguaDateTime } from '@/lib/timezone'

// ── eachDate ─────────────────────────────────────────────────

describe('eachDate', () => {
  it('returns a single day when from === to', () => {
    expect(eachDate('2026-10-19', '2026-10-19')).toEqual(['2026-10-19'])
  })

  it('returns every day in the range, inclusive', () => {
    expect(eachDate('2026-10-17', '2026-10-20')).toEqual([
      '2026-10-17',
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
    ])
  })

  it('crosses month boundaries', () => {
    expect(eachDate('2026-09-29', '2026-10-02')).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ])
  })

  it('crosses year boundaries', () => {
    expect(eachDate('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
  })

  it('handles leap days', () => {
    expect(eachDate('2028-02-28', '2028-03-01')).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
    ])
  })
})

// ── splitSegments ────────────────────────────────────────────

describe('splitSegments', () => {
  it('returns one segment for a run inside a single day', () => {
    const start = new Date('2026-10-19T14:00:00Z')
    const end = new Date('2026-10-19T15:30:00Z')
    const segments = splitSegments(start, end)

    expect(segments).toHaveLength(1)
    expect(segments[0].date).toBe('2026-10-19')
    expect(segments[0].start_time).toMatch(/^\d{2}:\d{2}$/)
    expect(segments[0].end_time).toMatch(/^\d{2}:\d{2}$/)
  })

  it('splits a run that crosses midnight into two rows', () => {
    // 22:00 → 01:00 en hora local de Nicaragua (UTC-6).
    const start = new Date('2026-10-20T04:00:00Z') // 22:00 del 19 oct
    const end = new Date('2026-10-20T07:00:00Z') // 01:00 del 20 oct
    const segments = splitSegments(start, end)

    expect(segments).toHaveLength(2)
    expect(segments[0].date).toBe('2026-10-19')
    expect(segments[0].start_time).toBe('22:00')
    expect(segments[0].end_time).toBe('23:59')

    expect(segments[1].date).toBe('2026-10-20')
    expect(segments[1].start_time).toBe('00:00')
    expect(segments[1].end_time).toBe('01:00')
  })

  it('never produces a zero-length segment', () => {
    const start = new Date('2026-10-20T04:00:00Z')
    const end = new Date('2026-10-20T07:00:00Z')
    for (const segment of splitSegments(start, end)) {
      expect(segment.end_time).not.toBe(segment.start_time)
    }
  })
})

// ── getNicaraguaDateTime ─────────────────────────────────────

describe('getNicaraguaDateTime', () => {
  it('applies the UTC-6 offset', () => {
    const result = getNicaraguaDateTime(new Date('2026-10-20T04:30:00Z'))
    expect(result.date).toBe('2026-10-19')
    expect(result.time).toBe('22:30')
  })

  it('formats the hour with a leading zero', () => {
    const result = getNicaraguaDateTime(new Date('2026-10-20T16:05:00Z'))
    expect(result.time).toBe('10:05')
  })
})
