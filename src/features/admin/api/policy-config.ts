import { getSupabase } from '@/lib/supabase/client'
import type { PolicyConfig } from '@/types'

export async function getPolicyConfig(): Promise<PolicyConfig | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('policy_config')
    .select('*')
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
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
