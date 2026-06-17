'use client'

import { getSupabase } from '@/lib/supabase/client'
import type { LoginFormData, RegisterFormData } from '../schemas'

export async function signIn(values: LoginFormData) {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithPassword(values)
  if (error) throw error
}

export async function signUp(values: RegisterFormData) {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.full_name,
        type: values.type,
      },
    },
  })
  if (error) throw error
}

export async function signOut() {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
