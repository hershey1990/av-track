import { getSupabase } from '@/lib/supabase/client'
import { DEFAULT_COUNTRY_CODE } from '@/config/constants'
import type { Country } from '@/types'

/**
 * Resuelve el país (código ISO) a su fila en `countries`.
 *
 * El `country_id` es la clave foránea que usan `holidays` y `policy_config`,
 * así que hace falta resolverlo una vez para poder filtrar y crear registros.
 */
export async function getCountry(
  code: string = DEFAULT_COUNTRY_CODE,
): Promise<Country | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('countries')
    .select('id, name, code')
    .eq('code', code)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}
