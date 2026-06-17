'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import type { Profile } from '@/types'

async function getProfile(userId: string): Promise<Profile> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, ...values }: Partial<Profile> & { userId: string }) => {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] })
    },
  })
}
