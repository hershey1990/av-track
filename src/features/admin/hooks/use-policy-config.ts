'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PolicyConfig } from '@/types'
import * as api from '../api/policy-config'
import { useCountry } from '@/features/countries/hooks/use-country'

/**
 * Política de recargos del país activo.
 *
 * Espera a que el país esté resuelto (de él sale el `country_id`) para no
 * traer la política de otro país.
 */
export function usePolicyConfig() {
  const { data: country } = useCountry()
  const countryId = country?.id

  return useQuery({
    queryKey: ['policy-config', countryId ?? 'none'],
    queryFn: () => api.getPolicyConfig(countryId as string),
    enabled: !!countryId,
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
