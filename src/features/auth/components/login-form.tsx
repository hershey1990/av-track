'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { FieldError } from '@/components/ui/field'
import { signIn } from '../api'
import { loginSchema, type LoginFormData } from '../schemas'

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data)
      window.location.href = '/'
    } catch {
      form.setError('root', { message: 'Email o contraseña incorrectos' })
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>Ingresá tu email y contraseña</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          {form.formState.errors.root && (
            <FieldError errors={[form.formState.errors.root]} />
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
