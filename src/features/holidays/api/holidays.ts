import { getSupabase } from '@/lib/supabase/client'
import type { Holiday } from '@/types'

/**
 * Acceso a la tabla `holidays`.
 *
 * La tabla ya existe con sus políticas RLS: `holidays_select_all` permite
 * leer a cualquier usuario autenticado y `holidays_admin_all` habilita las
 * escrituras sólo para el rol admin. Es decir, el control de permisos vive
 * en la base de datos; la UI sólo oculta los botones.
 */

const SELECT_COLUMNS = 'id, country_id, date, name'

/** Lista los feriados de un país, ordenados por fecha. */
export async function getHolidays(countryId: string): Promise<Holiday[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('holidays')
    .select(SELECT_COLUMNS)
    .eq('country_id', countryId)
    .order('date', { ascending: true })

  if (error) throw error
  return (data ?? []) as Holiday[]
}

/** Crea un feriado nuevo. */
export async function createHoliday(
  values: { country_id: string; date: string; name: string },
): Promise<Holiday> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('holidays')
    .insert({ country_id: values.country_id, date: values.date, name: values.name })
    .select(SELECT_COLUMNS)
    .single()

  if (error) throw error
  return data as Holiday
}

/** Actualiza la fecha o el nombre de un feriado. */
export async function updateHoliday(
  id: string,
  values: { date?: string; name?: string },
): Promise<Holiday> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('holidays')
    .update(values)
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single()

  if (error) throw error
  return data as Holiday
}

/** Elimina un feriado. */
export async function deleteHoliday(id: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) throw error
}
