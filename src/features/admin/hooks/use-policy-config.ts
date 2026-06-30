'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PolicyConfig } from '@/types'
import * as api from '../api/policy-config'

export function usePolicyConfig() {
  return useQuery({
    queryKey: ['policy-config'],
    queryFn: () => api.getPolicyConfig(),
  })
}

export function useUpdatePolicyConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PolicyConfig> }) =>
      api.updatePolicyConfig(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-config'] })
    },
  })
}
