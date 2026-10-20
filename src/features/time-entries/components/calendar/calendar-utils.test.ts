import { describe, it, expect } from 'vitest'
import {
  formatHoursHM,
  fromDateOnly,
  getMonthKey,
  getMonthRange,
  getWeekdayIndex,
  groupByDate,
  isSundayDate,
  shiftDateOnly,
  shiftMonth,
  summarizeDay,
  toDateOnly,
} from './calendar-utils'
import type { TimeEntry } from '@/types'

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 'e1',
    user_id: 'u1',
    date: '2026-10-20',
    start_time: '08:00:00',
    end_time: '16:00:00',
    slot_index: 0,
    concept: 'Cliente X',
    notes: '',
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-20T10:00:00Z',
    ...overrides,
  }
}

describe('fromDateOnly / toDateOnly', () => {
  it('debe convertir un string a un Date local a medianoche', () => {
    const date = fromDateOnly('2026-10-20')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(20)
    expect(date.getHours()).toBe(0)
  })

  it('debe hacer round-trip exacto', () => {
    for (const day of ['2026-01-01', '2026-02-28', '2026-03-01', '2026-12-31']) {
      expect(toDateOnly(fromDateOnly(day))).toBe(day)
    }
  })

  it('debe hacer round-trip en años bisiestos', () => {
    expect(toDateOnly(fromDateOnly('2028-02-29'))).toBe('2028-02-29')
  })

  it('no debe usar new Date(string) (que interpretaría UTC midnight)', () => {
    // Un string "yyyy-MM-dd" con new Date() cae en UTC midnight; en una zona
    // horaria negativa eso es el día anterior. fromDateOnly no debe shifting.
    const date = fromDateOnly('2026-10-20')
    expect(date.getDate()).toBe(20)
  })
})

describe('shiftDateOnly', () => {
  it('debe avanzar y retroceder días', () => {
    expect(shiftDateOnly('2026-10-20', 1)).toBe('2026-10-21')
    expect(shiftDateOnly('2026-10-20', -1)).toBe('2026-10-19')
  })

  it('debe cruzar el cambio de mes', () => {
    expect(shiftDateOnly('2026-10-31', 1)).toBe('2026-11-01')
    expect(shiftDateOnly('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('debe cruzar el cambio de año', () => {
    expect(shiftDateOnly('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDateOnly('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('debe manejar años bisiestos', () => {
    expect(shiftDateOnly('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('getWeekdayIndex / isSundayDate', () => {
  it('debe identificar los días de la semana', () => {
    // 2026-10-19 es lunes, 2026-10-25 es domingo
    expect(getWeekdayIndex('2026-10-19')).toBe(1)
    expect(getWeekdayIndex('2026-10-25')).toBe(0)
    expect(getWeekdayIndex('2026-10-24')).toBe(6)
  })

  it('debe detectar domingos', () => {
    expect(isSundayDate('2026-10-25')).toBe(true)
    expect(isSundayDate('2026-10-20')).toBe(false)
  })
})

describe('groupByDate', () => {
  it('debe agrupar por fecha', () => {
    const map = groupByDate([
      makeEntry({ id: 'a', date: '2026-10-20' }),
      makeEntry({ id: 'b', date: '2026-10-21' }),
      makeEntry({ id: 'c', date: '2026-10-20' }),
    ])

    expect(map.get('2026-10-20')).toHaveLength(2)
    expect(map.get('2026-10-21')).toHaveLength(1)
    expect(map.size).toBe(2)
  })

  it('debe ordenar por slot_index (getEntries no lo hace)', () => {
    const map = groupByDate([
      makeEntry({ id: 'second', date: '2026-10-20', slot_index: 1 }),
      makeEntry({ id: 'first', date: '2026-10-20', slot_index: 0 }),
    ])

    expect(map.get('2026-10-20')?.map((e) => e.id)).toEqual(['first', 'second'])
  })

  it('debe tratar slot_index ausente como 0', () => {
    const map = groupByDate([
      makeEntry({ id: 'no-slot', date: '2026-10-20', slot_index: undefined }),
    ])
    expect(map.get('2026-10-20')).toHaveLength(1)
  })
})

describe('summarizeDay', () => {
  it('debe sumar las horas de todas las entradas del día', () => {
    const summary = summarizeDay(
      [
        makeEntry({ start_time: '08:00:00', end_time: '12:00:00' }),
        makeEntry({ start_time: '13:00:00', end_time: '16:00:00', slot_index: 1 }),
      ],
      'fulltime',
    )

    expect(summary.totalHours).toBe(7)
    expect(summary.entryCount).toBe(2)
  })

  it('debe calcular horas extra sobre la jornada estándar', () => {
    // fulltime = 8h estándar; 10h trabajadas → 2h extra
    const summary = summarizeDay(
      [makeEntry({ start_time: '08:00:00', end_time: '18:00:00' })],
      'fulltime',
    )

    expect(summary.totalHours).toBe(10)
    expect(summary.extraHours).toBe(2)
  })

  it('debe usar la jornada estándar de parttime', () => {
    // parttime = 5h estándar; 7h trabajadas → 2h extra
    const summary = summarizeDay(
      [makeEntry({ start_time: '08:00:00', end_time: '15:00:00' })],
      'parttime',
    )

    expect(summary.totalHours).toBe(7)
    expect(summary.extraHours).toBe(2)
  })

  it('debe devolver ceros sin entradas', () => {
    const summary = summarizeDay([], 'fulltime')
    expect(summary).toEqual({ totalHours: 0, extraHours: 0, entryCount: 0 })
  })
})

describe('formatHoursHM', () => {
  it('debe formatear horas decimales', () => {
    expect(formatHoursHM(7.5)).toBe('7:30')
    expect(formatHoursHM(0.75)).toBe('0:45')
    expect(formatHoursHM(8)).toBe('8:00')
    expect(formatHoursHM(1.25)).toBe('1:15')
  })

  it('debe manejar valores no positivos', () => {
    expect(formatHoursHM(0)).toBe('0:00')
    expect(formatHoursHM(-3)).toBe('0:00')
  })
})

describe('getMonthRange', () => {
  it('debe devolver el primer y último día del mes', () => {
    expect(getMonthRange('2026-10')).toEqual({
      firstDay: '2026-10-01',
      lastDay: '2026-10-31',
    })
  })

  it('debe manejar febrero en año bisiesto', () => {
    expect(getMonthRange('2028-02').lastDay).toBe('2028-02-29')
  })

  it('debe manejar febrero en año no bisiesto', () => {
    expect(getMonthRange('2026-02').lastDay).toBe('2026-02-28')
  })
})

describe('getMonthKey / shiftMonth', () => {
  it('debe extraer el mes de una fecha', () => {
    expect(getMonthKey('2026-10-20')).toBe('2026-10')
  })

  it('debe desplazar meses', () => {
    expect(shiftMonth('2026-10', 1)).toBe('2026-11')
    expect(shiftMonth('2026-10', -1)).toBe('2026-09')
  })

  it('debe cruzar el cambio de año', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2027-01', -1)).toBe('2026-12')
  })
})
