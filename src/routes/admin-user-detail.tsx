import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUser } from '@/hooks/use-user'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { FormFieldSelect } from '@/components/ui/form-field-select'
import { toast } from 'sonner'
import { userEditSchema, type UserEditFormData } from '@/features/admin/schemas'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useUser()
  const { data: currentProfile, isLoading: profileLoading } = useProfile(currentUser?.id)
  const { data: targetProfile, isLoading } = useProfile(id)
  const updateProfile = useUpdateProfile()

  const form = useForm({
    resolver: zodResolver(userEditSchema),
    values: targetProfile ? {
      full_name: targetProfile.full_name,
      employee_code: targetProfile.employee_code || '',
      type: targetProfile.type,
      role: targetProfile.role,
      viatico: targetProfile.viatico,
      extra_rate: targetProfile.extra_rate,
    } : undefined,
  })

  if (profileLoading) return <p className="text-muted-foreground">Cargando...</p>
  if (currentProfile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Acceso restringido</p>
  }

  if (isLoading) return <p className="text-muted-foreground">Cargando...</p>
  if (!targetProfile) return <p className="text-muted-foreground">Usuario no encontrado</p>

  const onSubmit = async (data: UserEditFormData) => {
    await updateProfile.mutateAsync({ userId: id!, ...data })
    toast.success('Usuario actualizado')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{targetProfile.full_name}</h1>
        <Badge>{targetProfile.role}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Editar usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormFieldInput control={form.control} name="full_name" label="Nombre" />
            <FormFieldInput control={form.control} name="employee_code" label="Código Empleado" />
            <FormFieldSelect
              control={form.control} name="type" label="Tipo"
              options={[{ value: 'fulltime', label: 'Full-time' }, { value: 'parttime', label: 'Part-time' }]}
            />
            <FormFieldSelect
              control={form.control} name="role" label="Rol"
              options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]}
            />
            <FormFieldInput control={form.control} name="viatico" label="Viático (C$)" type="number" step="0.01" />
            <FormFieldInput control={form.control} name="extra_rate" label="Tasa hora extra (C$/h)" type="number" step="0.01" />
            <div className="flex gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>Guardar</Button>
              <Link to={`/admin/users/${id}/entries`}>
                <Button type="button" variant="outline">Ver entradas</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
