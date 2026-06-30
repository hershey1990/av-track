'use client'

import { getSupabase } from '@/lib/supabase/client'
import type { ShiftSwap } from '@/types'

export async function getMySwapRequests(userId: string): Promise<ShiftSwap[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('shift_swaps')
    .select('*')
    .eq('requester_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPendingSwapsForMe(userId: string): Promise<ShiftSwap[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('shift_swaps')
    .select('*')
    .eq('target_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createSwapRequest(values: {
  requester_id: string
  target_id: string
  date: string
  requester_shift?: string
  target_shift?: string
  reason?: string
}): Promise<ShiftSwap> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('shift_swaps')
    .insert(values)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function respondToSwap(id: string, status: 'accepted' | 'rejected'): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('shift_swaps')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function cancelSwapRequest(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('shift_swaps')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) throw error
}
