import { describe, it, expect } from 'vitest'
import { describeDbError } from './db-errors'

describe('describeDbError', () => {
  it('usa el mensaje de un Error normal', () => {
    expect(describeDbError(new Error('algo falló'))).toBe('algo falló')
  })

  it('devuelve un texto genérico para valores desconocidos', () => {
    expect(describeDbError(undefined)).toBe('Ocurrió un error inesperado')
  })

  it('traduce una restricción UNIQUE genérica', () => {
    const error = {
      message: 'duplicate key value violates unique constraint "time_entries_user_id_date_slot_index_key"',
      code: '23505',
      details: 'Key (user_id, date, slot_index)=(...) already exists.',
    }
    expect(describeDbError(error)).toBe('Ya existe un registro con esos datos')
  })

  it('traduce una tabla inexistente', () => {
    const error = {
      message: "Could not find the table 'public.absences' in the schema cache",
      code: '42P01',
    }
    expect(describeDbError(error)).toContain('public.absences')
  })

  it('traduce una función inexistente', () => {
    const error = {
      message:
        'Searched for the function public.list_colleagues without parameters, but no matches were found in the schema cache.',
      code: '42883',
    }
    expect(describeDbError(error)).toContain('public.list_colleagues')
  })

  it('traduce una columna inexistente', () => {
    const error = { message: "column absences.slot_index does not exist", code: '42703' }
    expect(describeDbError(error)).toContain('migraciones pendientes')
  })

  it('traduce un error de permisos de RLS', () => {
    const error = { message: 'new row violates row-level security policy', code: '42501' }
    expect(describeDbError(error)).toContain('Permisos insuficientes')
  })

  it('usa el details cuando no hay código conocido', () => {
    const error = { message: 'algo raro', code: 'XX000', details: 'detalle útil' }
    expect(describeDbError(error)).toBe('detalle útil')
  })
})
