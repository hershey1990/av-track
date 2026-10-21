import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/holidays'
import { useCountry } from '@/features/countries/hooks/use-country'

/**
 * Feriados del país activo.
 *
 * Resuelve primero el país (para conocer su `country_id`) y después trae
 * los feriados. La espera es en cascada, así que la segunda consulta queda
 * deshabilitada hasta que el país está resuelto.
 */
export function useHolidays() {
  const { data: country } = useCountry()
  const countryId = country?.id

  return useQuery({
    queryKey: ['holidays', countryId ?? 'none'],
    queryFn: () => api.getHolidays(countryId as string),
    enabled: !!countryId,
    staleTime: 5 * 60 * 1000,
  })
}

/** Crea un feriado. Invalida la lista para que se vea al instante. */
export function useCreateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: { country_id: string; date: string; name: string }) =>
      api.createHoliday(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
  })
}

/** Actualiza un feriado. */
export function useUpdateHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: { date?: string; name?: string } }) =>
      api.updateHoliday(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
  })
}

/** Elimina un feriado. */
export function useDeleteHoliday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
  })
}
