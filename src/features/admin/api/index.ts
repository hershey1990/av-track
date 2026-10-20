'use client'

import { getSupabase } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')
  if (error) throw error
  return data
}
