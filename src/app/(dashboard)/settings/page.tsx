'use client'

import { useUser } from '@/hooks/use-user'
import { ProfileForm } from '@/features/profile/components/profile-form'

export default function SettingsPage() {
  const { user } = useUser()

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-heading font-semibold tracking-tight">Ajustes</h1>
      <ProfileForm userId={user.id} />
    </div>
  )
}
