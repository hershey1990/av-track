import { describe, it, expect } from 'vitest'
import {
  getMinStartDate,
  findOverlappingPeriods,
  getMaxEndDate,
  validateNewPeriod,
  type PeriodRange,
} from './period-rules'

const TODAY = '2026-10-20'

const p = (
  id: string,
  start_date: string,
  end_date: string,
  name = id,
): PeriodRange => ({ id, name, start_date, end_date })

describe('getMinStartDate', () => {
  it('devuelve hoy si no hay períodos cerrados', () => {
    const periods = [p('f1', '2026-11-01', '2026-11-15')]
    expect(getMinStartDate(periods, TODAY)).toBe(TODAY)
  })

  it('devuelve hoy si no hay ningún período', () => {
    expect(getMinStartDate([], TODAY)).toBe(TODAY)
  })

  it('devuelve el día siguiente del fin del último período cerrado', () => {
    const periods = [
      p('a', '2026-06-16', '2026-07-15'),
      p('b', '2026-09-16', '2026-10-15'),
    ]
    expect(getMinStartDate(periods, TODAY)).toBe('2026-10-16')
  })

  it('ignora los períodos que terminan hoy o después', () => {
    const periods = [
      p('a', '2026-09-16', '2026-10-15'),
      p('b', '2026-10-20', '2026-11-15'),
    ]
    expect(getMinStartDate(periods, TODAY)).toBe('2026-10-16')
  })

  it('permite un inicio retroactivo (anterior a hoy) tras el último cerrado', () => {
    const periods = [p('a', '2026-09-16', '2026-10-18')]
    // el último período cerrado termina ayer → el mínimo es hoy
    expect(getMinStartDate(periods, TODAY)).toBe('2026-10-19')
    expect(getMinStartDate(periods, TODAY) < TODAY).toBe(true)
  })
})

describe('findOverlappingPeriods', () => {
  const periods = [
    p('a', '2026-06-16', '2026-07-15'),
    p('b', '2026-09-16', '2026-10-15'),
    p('c', '2026-11-01', '2026-11-15'),
  ]

  it('detecta el solapamiento con un período pasado', () => {
    const found = findOverlappingPeriods(periods, '2026-07-10', '2026-07-20')
    expect(found.map((x) => x.id)).toEqual(['a'])
  })

  it('detecta el solapamiento con un período futuro', () => {
    const found = findOverlappingPeriods(periods, '2026-11-10', '2026-11-20')
    expect(found.map((x) => x.id)).toEqual(['c'])
  })

  it('no detecta solapamiento si el rango cae en un hueco', () => {
    expect(findOverlappingPeriods(periods, '2026-10-16', '2026-10-31')).toEqual(
      [],
    )
  })

  it('excluye el propio período al editarlo', () => {
    const found = findOverlappingPeriods(
      periods,
      '2026-09-20',
      '2026-10-20',
      'b',
    )
    expect(found.map((x) => x.id)).toEqual([])
  })

  it('devuelve vacío si faltan fechas', () => {
    expect(findOverlappingPeriods(periods, '', '2026-10-20')).toEqual([])
  })
})

describe('getMaxEndDate', () => {
  const periods = [
    p('a', '2026-06-16', '2026-07-15'),
    p('b', '2026-11-01', '2026-11-15'),
  ]

  it('devuelve el día anterior al inicio del período siguiente', () => {
    expect(getMaxEndDate(periods, '2026-10-16')).toBe('2026-10-31')
  })

  it('devuelve undefined si no hay período posterior', () => {
    expect(getMaxEndDate(periods, '2026-12-01')).toBeUndefined()
  })

  it('excluye el propio período', () => {
    expect(getMaxEndDate(periods, '2026-06-16', 'a')).toBe('2026-10-31')
  })
})

describe('validateNewPeriod', () => {
  const periods = [
    p('a', '2026-09-16', '2026-10-15', 'Septiembre 2026 a Octubre 2026'),
  ]

  it('acepta un período que empieza el día siguiente del último cerrado', () => {
    const errors = validateNewPeriod(
      periods,
      { start_date: '2026-10-16', end_date: '2026-11-15' },
      TODAY,
    )
    expect(errors).toEqual({})
  })

  it('acepta un período retroactivo posterior al último cerrado', () => {
    const errors = validateNewPeriod(
      periods,
      { start_date: '2026-10-16', end_date: '2026-10-19' },
      TODAY,
    )
    expect(errors).toEqual({})
  })

  it('rechaza un inicio anterior al último período cerrado', () => {
    const errors = validateNewPeriod(
      periods,
      { start_date: '2026-10-10', end_date: '2026-11-15' },
      TODAY,
    )
    expect(errors.start_date).toContain('No se puede abrir un período antes del')
  })

  it('rechaza un inicio igual al fin del último período cerrado', () => {
    const errors = validateNewPeriod(
      periods,
      { start_date: '2026-10-15', end_date: '2026-11-15' },
      TODAY,
    )
    expect(errors.start_date).toBeDefined()
  })

  it('rechaza un solapamiento con un período existente', () => {
    const withFuture = [
      ...periods,
      p('f', '2026-11-01', '2026-11-15', 'Noviembre 2026'),
    ]
    const errors = validateNewPeriod(
      withFuture,
      { start_date: '2026-10-20', end_date: '2026-11-20' },
      TODAY,
    )
    expect(errors.end_date).toContain('Noviembre 2026')
  })

  it('no valida nada si faltan fechas', () => {
    expect(
      validateNewPeriod(periods, { start_date: '', end_date: '' }, TODAY),
    ).toEqual({})
  })

  it('exige hoy como mínimo si no hay períodos cerrados', () => {
    const errors = validateNewPeriod(
      [p('f', '2026-11-01', '2026-11-15')],
      { start_date: '2026-10-16', end_date: '2026-10-31' },
      TODAY,
    )
    expect(errors.start_date).toBeDefined()
  })
})
