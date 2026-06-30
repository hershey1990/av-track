'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { FormFieldSelect } from '@/components/ui/form-field-select'
import { FieldError } from '@/components/ui/field'
import { signUp } from '../api'
import { registerSchema, type RegisterFormData } from '../schemas'

export function RegisterForm() {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { type: 'fulltime' },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data)
      window.location.href = '/'
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : 'Error al registrarse',
      })
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Registrarse</CardTitle>
        <CardDescription>Creá tu cuenta para empezar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFieldInput
            control={form.control}
            name="full_name"
            label="Nombre completo"
          />
          <FormFieldInput
            control={form.control}
            name="email"
            label="Email"
            type="email"
          />
          <FormFieldInput
            control={form.control}
            name="password"
            label="Contraseña"
            type="password"
          />
          <FormFieldSelect
            control={form.control}
            name="type"
            label="Tipo de jornada"
            options={[
              { value: 'fulltime', label: 'Full-time (8h)' },
              { value: 'parttime', label: 'Part-time (5h)' },
            ]}
          />
          {form.formState.errors.root && (
            <FieldError errors={[form.formState.errors.root]} />
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Registrando...' : 'Registrarse'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
