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

export async function getTodayEntries(userId: string): Promise<TimeEntry[]> {
  const supabase = getSupabase()
  const today = getTodayNicaragua()
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('slot_index', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * Crea una entrada calculando el siguiente `slot_index` del día.
 *
 * El cálculo es un read-then-insert, así que dos insertions simultáneas
 * (doble clic, dos pestañas, tracker + formulario manual) pueden pedir el
 * mismo slot. La restricción `time_entries_user_id_date_slot_index_key` lo
 * rechaza con 23505; en ese caso se reintenta con el siguiente slot.
 */
export async function createEntry(userId: string, values: TimeEntryFormData): Promise<TimeEntry> {
  const supabase = getSupabase()
  const MAX_SLOT_ATTEMPTS = 5

  for (let attempt = 0; attempt < MAX_SLOT_ATTEMPTS; attempt++) {
    const { data: existing } = await supabase
      .from('time_entries')
      .select('slot_index')
      .eq('user_id', userId)
      .eq('date', values.date)
      .order('slot_index', { ascending: false })
      .limit(1)

    const maxSlot = existing && existing.length > 0 ? (existing[0].slot_index ?? -1) : -1
    const slotIndex = maxSlot + 1

    const { data, error } = await supabase
      .from('time_entries')
      .insert({ user_id: userId, slot_index: slotIndex, ...values })
      .select()
      .single()

    if (!error) return data

    // 23505 = slot ya ocupado por otra insertion concurrente: reintentamos.
    if (error.code === '23505') continue
    throw error
  }

  throw new Error('No se pudo reservar un turno libre para esa fecha')
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
  const { data: period, error } = await supabase
    .from('periods')
    .select('start_date, end_date')
    .eq('id', periodId)
    .maybeSingle()

  if (error) throw error
  if (!period) throw new Error('Periodo no encontrado')
  return getEntries(userId, period.start_date, period.end_date)
}
