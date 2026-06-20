'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { FormFieldSelect } from '@/components/ui/form-field-select'
import { toast } from 'sonner'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { profileSchema, type ProfileFormData } from '../schemas'
import { WorkingDaysSelector } from './working-days-selector'

interface Props {
  userId: string
}

export function ProfileForm({ userId }: Props) {
  const { data: profile, isLoading } = useProfile(userId)
  const updateProfile = useUpdateProfile()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile ? { full_name: profile.full_name, type: profile.type, working_days: profile.working_days ?? [1, 2, 3, 4, 5] } : undefined,
  })

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync({ userId, ...data })
    toast.success('Perfil actualizado')
  }

  if (isLoading) return <p className="text-muted-foreground">Cargando...</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFieldInput
            control={form.control}
            name="full_name"
            label="Nombre completo"
          />
          <FormFieldSelect
            control={form.control}
            name="type"
            label="Tipo de jornada"
            options={[
              { value: 'fulltime', label: 'Full-time (8h)' },
              { value: 'partime', label: 'Part-time (5h)' },
            ]}
          />
          <WorkingDaysSelector control={form.control} />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
