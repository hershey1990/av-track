import { getSupabase } from '@/lib/supabase/client'
import type { Absence, AbsenceStatus } from '@/types'
import type { AbsenceFormData } from '../schemas'

export async function getAbsences(userId: string): Promise<Absence[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getAllAbsences(): Promise<(Absence & { profile?: { full_name: string } })[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('absences')
    .select('*, profile:profiles(full_name)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function createAbsence(userId: string, values: AbsenceFormData): Promise<Absence> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('absences')
    .insert({ user_id: userId, ...values })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAbsenceStatus(
  id: string,
  status: AbsenceStatus,
  reviewedBy: string,
): Promise<Absence> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('absences')
    .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAbsence(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('absences').delete().eq('id', id).select('id').single()
  if (error) throw error
}

export async function saveVacation(
  userId: string,
  values: { start_date: string; end_date: string; status: 'pending' | 'approved' },
  id?: string,
): Promise<Absence> {
  const supabase = getSupabase()
  const query = id
    ? supabase.from('absences').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId).eq('type', 'vacation')
    : supabase.from('absences').insert({ ...values, user_id: userId, type: 'vacation' })
  const { data, error } = await query.select().single()
  if (error) throw error
  return data
}
