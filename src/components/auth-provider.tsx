import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    const supabase = getSupabase()

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setState({ user: session?.user ?? null, loading: false })
      })
      .catch((err) => {
        console.error('Failed to get session:', err)
        setState({ user: null, loading: false })
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}
