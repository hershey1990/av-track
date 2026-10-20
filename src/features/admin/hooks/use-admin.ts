'use client'

import { useQuery } from '@tanstack/react-query'
import * as api from '../api'

export function useAllProfiles() {
  return useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: api.getAllProfiles,
  })
}
