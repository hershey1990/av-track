'use client'

import { getSupabase } from '@/lib/supabase/client'
import type { Period } from '@/types'
import type { PeriodFormData } from '@/features/admin/schemas'

export async function getPeriods(): Promise<Period[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('periods')
    .select('*')
    .order('start_date', { ascending: false })
  if (error) throw error
  return data
}

export async function getPeriod(id: string): Promise<Period> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('periods')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createPeriod(values: PeriodFormData & { created_by: string }): Promise<Period> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('periods')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePeriod(id: string, values: Partial<PeriodFormData & { is_locked: boolean }>): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('periods').update(values).eq('id', id)
  if (error) throw error
}

export async function approvePeriod(id: string, userId: string, note?: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('periods')
    .update({
      approval_status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      approval_note: note || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function rejectPeriod(id: string, userId: string, note?: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('periods')
    .update({
      approval_status: 'rejected',
      approved_by: userId,
      approved_at: new Date().toISOString(),
      approval_note: note || null,
    })
    .eq('id', id)
  if (error) throw error
}
