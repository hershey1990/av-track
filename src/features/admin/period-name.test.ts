import { describe, it, expect } from 'vitest'
import { buildPeriodName } from './period-name'

describe('buildPeriodName', () => {
  it('genera el nombre de una quincena que cruza meses', () => {
    expect(buildPeriodName('2026-10-16', '2026-11-15')).toBe(
      'Octubre 2026 a Noviembre 2026',
    )
  })

  it('usa sólo el mes cuando inicio y fin están en el mismo mes', () => {
    expect(buildPeriodName('2026-10-01', '2026-10-31')).toBe('Octubre 2026')
  })

  it('incluye ambos años cuando el rango cruza el cambio de año', () => {
    expect(buildPeriodName('2026-12-16', '2027-01-15')).toBe(
      'Diciembre 2026 a Enero 2027',
    )
  })

  it('distingue meses iguales de años distintos', () => {
    expect(buildPeriodName('2026-10-01', '2027-10-31')).toBe(
      'Octubre 2026 a Octubre 2027',
    )
  })

  it('devuelve cadena vacía si falta alguna fecha', () => {
    expect(buildPeriodName('', '2026-11-15')).toBe('')
    expect(buildPeriodName('2026-10-16', '')).toBe('')
    expect(buildPeriodName('', '')).toBe('')
  })

  it('devuelve cadena vacía con fechas incompletas', () => {
    expect(buildPeriodName('2026-10', '2026-11')).toBe('')
    expect(buildPeriodName('no-date', '2026-11-15')).toBe('')
  })

  it('no depende de la zona horaria del navegador', () => {
    // 16/10/2026 y 15/11/2026 deben ser October/November en cualquier zona.
    expect(buildPeriodName('2026-10-16', '2026-11-15')).toContain('Octubre 2026')
    expect(buildPeriodName('2026-10-16', '2026-11-15')).toContain('Noviembre 2026')
  })
})
