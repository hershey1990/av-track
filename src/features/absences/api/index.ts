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
  const { error } = await supabase.from('absences').delete().eq('id', id)
  if (error) throw error
}
