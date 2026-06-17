import { useEffect, useRef } from 'react'
import { useUser } from '@/hooks/use-user'

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const redirecting = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (loading || redirecting.current || !mounted.current) return
    if (user) {
      redirecting.current = true
      window.location.replace('/')
    }
  }, [user, loading])

  useEffect(() => {
    if (!user) redirecting.current = false
  }, [user])

  if (loading) return null
  if (user) return null

  return <>{children}</>
}
