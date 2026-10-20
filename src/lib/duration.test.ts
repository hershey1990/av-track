import { describe, it, expect } from 'vitest'
import { formatDurationHMS } from './calculations'

describe('formatDurationHMS', () => {
  it('formats zero', () => {
    expect(formatDurationHMS(0)).toBe('0:00:00')
  })

  it('formats seconds', () => {
    expect(formatDurationHMS(45)).toBe('0:00:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatDurationHMS(125)).toBe('0:02:05')
  })

  it('formats hours, minutes and seconds', () => {
    expect(formatDurationHMS(3661)).toBe('1:01:01')
  })

  it('formats durations over 10 hours', () => {
    expect(formatDurationHMS(36000 + 600)).toBe('10:10:00')
  })

  it('pads minutes and seconds with a leading zero', () => {
    expect(formatDurationHMS(3600 + 5 * 60 + 7)).toBe('1:05:07')
  })

  it('truncates fractional seconds', () => {
    expect(formatDurationHMS(59.9)).toBe('0:00:59')
  })

  it('clamps negative values to zero', () => {
    expect(formatDurationHMS(-10)).toBe('0:00:00')
  })
})
