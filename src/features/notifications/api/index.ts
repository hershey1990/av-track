'use client'

import { getSupabase } from '@/lib/supabase/client'
import type { Notification } from '@/types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabase()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
  return count ?? 0
}

export async function markAsRead(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw error
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

export function subscribeToNotifications(
  userId: string,
  onInsert: (notification: Notification) => void,
) {
  const supabase = getSupabase()
  const channel = supabase
    .channel('notifications_realtime')
    .on<Notification>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        onInsert(payload.new as Notification)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
