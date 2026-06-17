'use client'

import { useUser } from '@/hooks/use-user'
import { ProfileForm } from '@/features/profile/components/profile-form'

export default function SettingsPage() {
  const { user } = useUser()

  if (!user) return null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <ProfileForm userId={user.id} />
    </div>
  )
}
