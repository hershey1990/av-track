'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import type { ShiftSwap } from '@/types'

export function useMySwapRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['shift-swaps', 'my-requests', userId],
    queryFn: () => api.getMySwapRequests(userId!),
    enabled: !!userId,
  })
}

export function usePendingSwapsForMe(userId: string | undefined) {
  return useQuery({
    queryKey: ['shift-swaps', 'pending-for-me', userId],
    queryFn: () => api.getPendingSwapsForMe(userId!),
    enabled: !!userId,
  })
}

export function useCreateSwapRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: {
      requester_id: string
      target_id: string
      date: string
      requester_shift?: string
      target_shift?: string
      reason?: string
    }) => api.createSwapRequest(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] })
    },
  })
}

export function useRespondToSwap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) =>
      api.respondToSwap(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] })
    },
  })
}

export function useCancelSwapRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cancelSwapRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] })
    },
  })
}
