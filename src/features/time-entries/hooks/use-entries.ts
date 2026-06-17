'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import type { TimeEntry } from '@/types'
import type { TimeEntryFormData } from '../schemas'
import * as api from '../api'

export function useEntries(userId: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['time-entries', userId, from, to],
    queryFn: () => api.getEntries(userId!, from, to),
    enabled: !!userId,
  })
}

export function useTodayEntry(userId: string | undefined) {
  return useQuery({
    queryKey: ['time-entries', 'today', userId],
    queryFn: () => api.getTodayEntry(userId!),
    enabled: !!userId,
  })
}

export function useCreateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, values }: { userId: string; values: TimeEntryFormData }) =>
      api.createEntry(userId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TimeEntryFormData> }) =>
      api.updateEntry(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}

export function usePeriodEntries(userId: string | undefined, periodId: string | undefined) {
  return useQuery({
    queryKey: ['time-entries', 'period', userId, periodId],
    queryFn: () => api.getPeriodEntries(userId!, periodId!),
    enabled: !!userId && !!periodId,
  })
}

export async function getAllUsersEntries(from?: string, to?: string): Promise<(TimeEntry & { profile: { full_name: string; type: string } })[]> {
  const supabase = getSupabase()
  let query = supabase
    .from('time_entries')
    .select('*, profile:profiles(full_name, type)')
    .order('date', { ascending: false })

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) throw error
  return data
}
