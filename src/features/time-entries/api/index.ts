'use client'

import { getSupabase } from '@/lib/supabase/client'
import { getTodayNicaragua } from '@/lib/timezone'
import type { TimeEntry } from '@/types'
import type { TimeEntryFormData } from '../schemas'

export async function getEntries(userId: string, from?: string, to?: string): Promise<TimeEntry[]> {
  const supabase = getSupabase()
  let query = supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTodayEntry(userId: string): Promise<TimeEntry | null> {
  const supabase = getSupabase()
  const today = getTodayNicaragua()
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createEntry(userId: string, values: TimeEntryFormData): Promise<TimeEntry> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('time_entries')
    .insert({ user_id: userId, ...values })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEntry(id: string, values: Partial<TimeEntryFormData>): Promise<TimeEntry> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('time_entries')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('time_entries').delete().eq('id', id)
  if (error) throw error
}

export async function getPeriodEntries(userId: string, periodId: string): Promise<TimeEntry[]> {
  const supabase = getSupabase()
  const { data: period } = await supabase
    .from('periods')
    .select('start_date, end_date')
    .eq('id', periodId)
    .single()

  if (!period) throw new Error('Periodo no encontrado')
  return getEntries(userId, period.start_date, period.end_date)
}
