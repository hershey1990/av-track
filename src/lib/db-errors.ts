/**
 * Utilidades para traducir los errores de Supabase a mensajes que el
 * usuario pueda entender.  Antes los errores se silenciaban por completo,
 * lo que hacía imposible diagnosticar fallos de permisos o de esquema.
 */

interface SupabaseError {
  message?: string
  code?: string
  details?: string
  hint?: string
}

function isSupabaseError(error: unknown): error is SupabaseError {
  return typeof error === 'object' && error !== null && 'message' in error
}

/** Extrae el mensaje real de un error de Supabase / PostgREST. */
export function describeDbError(error: unknown): string {
  if (!isSupabaseError(error)) {
    return error instanceof Error ? error.message : 'Ocurrió un error inesperado'
  }

  const code = error.code
  const details = error.details ?? ''
  const message = error.message ?? ''

  switch (code) {
    case 'PGRST301':
      return 'No tenés permiso para realizar esta operación'
    case '42501':
      return 'Permisos insuficientes: pedí a un administrador que revise tus permisos'
    case '23505':
      return 'Ya existe un registro con esos datos'
    case '23503':
      return 'La referencia apunta a un registro que no existe'
    case '23502':
      return 'Falta un campo obligatorio en la base de datos'
    case '23514':
      return 'La operación viola una restricción de la base de datos (revisá los datos)'
    case '22007':
    case '22008':
      return 'Formato de fecha o valor inválido para la base de datos'
    case 'PGRST116':
      return 'No se encontró el registro solicitado'
    default:
      break
  }

  if (/row-level security/i.test(message)) {
    return 'Permisos insuficientes: tu rol no puede modificar estos datos'
  }
  if (/Searched for the function/i.test(message) || /Could not find the function/i.test(message)) {
    const fn = /function (public\.[\w.]+)/i.exec(message)?.[1]
    return fn
      ? `Falta la función "${fn}" en la base de datos: aplicá las migraciones pendientes`
      : 'Falta una función en la base de datos: aplicá las migraciones pendientes'
  }
  if (/Could not find the table/i.test(message) || /not found in the schema cache/i.test(message) || code === '42P01') {
    const table = /table '([^']+)'/i.exec(message)?.[1]
    return table
      ? `Falta la tabla "${table}" en la base de datos: aplicá las migraciones pendientes`
      : 'Falta una tabla en la base de datos: aplicá las migraciones pendientes'
  }
  if (/Could not find the column/i.test(message) || /column .* does not exist/i.test(message) || code === '42703') {
    const column = /column '([^']+)'/i.exec(message)?.[1] ?? /column ([\w.]+)/i.exec(message)?.[1]
    return column
      ? `Falta la columna "${column}" en la base de datos: aplicá las migraciones pendientes`
      : 'Falta una columna en la base de datos: aplicá las migraciones pendientes'
  }

  return details || message || 'Ocurrió un error inesperado'
}
