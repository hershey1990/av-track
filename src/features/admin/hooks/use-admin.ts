'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api'
import type { Profile } from '@/types'

export function useAllProfiles() {
  return useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: api.getAllProfiles,
  })
}

export function useUpdateProfileByAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Profile> }) =>
      api.updateProfile(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profiles'] })
    },
  })
}
