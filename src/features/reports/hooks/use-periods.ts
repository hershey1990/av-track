'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import type { PeriodFormData } from '@/features/admin/schemas'

export function usePeriods() {
  return useQuery({
    queryKey: ['periods'],
    queryFn: api.getPeriods,
  })
}

export function usePeriod(id: string | undefined) {
  return useQuery({
    queryKey: ['periods', id],
    queryFn: () => api.getPeriod(id!),
    enabled: !!id,
  })
}

export function useCreatePeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: PeriodFormData & { created_by: string }) => api.createPeriod(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
  })
}

export function useUpdatePeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PeriodFormData & { is_locked: boolean }> }) =>
      api.updatePeriod(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
  })
}

export function useApprovePeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId, note }: { id: string; userId: string; note?: string }) =>
      api.approvePeriod(id, userId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
  })
}

export function useRejectPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userId, note }: { id: string; userId: string; note?: string }) =>
      api.rejectPeriod(id, userId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] })
    },
  })
}
