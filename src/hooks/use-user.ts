import { useAuth } from '@/components/auth-provider'

export function useUser() {
  return useAuth()
}
