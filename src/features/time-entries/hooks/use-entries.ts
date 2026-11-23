'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TimeEntryFormData } from '../schemas'
import * as api from '../api'
import type { TimerSegment } from './use-running-timer'

export function useEntries(userId: string | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['time-entries', userId, from, to],
    queryFn: () => api.getEntries(userId!, from, to),
    enabled: !!userId,
  })
}

export function useTodayEntries(userId: string | undefined) {
  return useQuery({
    queryKey: ['time-entries', 'today', 'all', userId],
    queryFn: () => api.getTodayEntries(userId!),
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

export function useSaveTimerSegments() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ segments, concept }: { segments: TimerSegment[]; concept: string }) =>
      api.saveTimerSegments(segments, concept),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
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
