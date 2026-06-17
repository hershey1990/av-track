import { useEffect, useRef } from 'react'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const redirecting = useRef(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (loading || redirecting.current || !mounted.current) return
    if (!user) {
      redirecting.current = true
      window.location.replace('/login')
    }
  }, [user, loading])

  useEffect(() => {
    if (user) redirecting.current = false
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
