'use client'

import { getSupabase } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export async function updateProfile(userId: string, values: Partial<Profile>): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('profiles').update(values).eq('id', userId)
  if (error) throw error
}
