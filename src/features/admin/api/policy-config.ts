import { getSupabase } from '@/lib/supabase/client'
import type { PolicyConfig } from '@/types'

const SELECT_COLUMNS =
  'id, country_id, night_start, night_end, night_surcharge_pct, sunday_surcharge_pct, holiday_surcharge_pct, extra_threshold_minutes, rounding_block_minutes, currency, multi_entry_enabled'

/**
 * Política de recargos del país.
 *
 * `policy_config` tiene una fila por país (clave foránea `country_id`), así
 * que se filtra por el país resuelto y no con un `limit(1)` a ciegas: de lo
 * contrario la app podría terminar aplicando la política de otro país.
 */
export async function getPolicyConfig(
  countryId: string,
): Promise<PolicyConfig | null> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('policy_config')
    .select(SELECT_COLUMNS)
    .eq('country_id', countryId)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as PolicyConfig) ?? null
}

export async function updatePolicyConfig(id: string, values: Partial<PolicyConfig>): Promise<PolicyConfig> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('policy_config')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
