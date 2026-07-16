'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AbsenceStatus } from '@/types'
import type { AbsenceFormData } from '../schemas'
import * as api from '../api'

export function useAbsences(userId: string | undefined) {
  return useQuery({
    queryKey: ['absences', userId],
    queryFn: () => api.getAbsences(userId!),
    enabled: !!userId,
  })
}

export function useAllAbsences() {
  return useQuery({
    queryKey: ['absences', 'all'],
    queryFn: api.getAllAbsences,
  })
}

export function useCreateAbsence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, values }: { userId: string; values: AbsenceFormData }) =>
      api.createAbsence(userId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] })
    },
  })
}

export function useUpdateAbsenceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reviewedBy }: { id: string; status: AbsenceStatus; reviewedBy: string }) =>
      api.updateAbsenceStatus(id, status, reviewedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] })
    },
  })
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAbsence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] })
    },
  })
}
