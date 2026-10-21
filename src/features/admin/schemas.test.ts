import { describe, it, expect } from 'vitest'
import { periodSchema } from './schemas'

describe('periodSchema', () => {
  it('acepta un rango válido', () => {
    const result = periodSchema.safeParse({
      name: 'Octubre 2026',
      start_date: '2026-10-16',
      end_date: '2026-11-15',
    })
    expect(result.success).toBe(true)
  })

  it('acepta un nombre vacío (se deriva de las fechas)', () => {
    const result = periodSchema.safeParse({
      name: '',
      start_date: '2026-10-16',
      end_date: '2026-11-15',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza que la fecha de fin sea anterior a la de inicio', () => {
    const result = periodSchema.safeParse({
      name: '',
      start_date: '2026-11-15',
      end_date: '2026-10-16',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['end_date'])
      expect(result.error.issues[0].message).toContain('no puede ser anterior')
    }
  })

  it('acepta inicio y fin el mismo día', () => {
    const result = periodSchema.safeParse({
      name: '',
      start_date: '2026-10-16',
      end_date: '2026-10-16',
    })
    expect(result.success).toBe(true)
  })

  it('exige las fechas', () => {
    const result = periodSchema.safeParse({ name: '', start_date: '', end_date: '' })
    expect(result.success).toBe(false)
  })

  it('acepta una fecha de inicio pasada (el límite depende de los períodos existentes)', () => {
    const result = periodSchema.safeParse({
      name: '',
      start_date: '2026-06-16',
      end_date: '2026-07-15',
    })
    expect(result.success).toBe(true)
  })
})
