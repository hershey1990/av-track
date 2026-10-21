import { useQuery } from '@tanstack/react-query'
import { DEFAULT_COUNTRY_CODE } from '@/config/constants'
import * as api from '../api/country'

/**
 * País activo de la app.
 *
 * Se resuelve una sola vez y se cachea: de él dependen tanto los feriados
 * (`holidays.country_id`) como la política de recargos (`policy_config`).
 */
export function useCountry(code: string = DEFAULT_COUNTRY_CODE) {
  return useQuery({
    queryKey: ['country', code],
    queryFn: () => api.getCountry(code),
    staleTime: 60 * 60 * 1000,
  })
}
