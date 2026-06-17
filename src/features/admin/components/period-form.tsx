'use client'

import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent } from '@/components/ui/field'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { useCreatePeriod } from '@/features/reports/hooks/use-periods'
import { periodSchema, type PeriodFormData } from '../schemas'

interface Props {
  userId: string
  onSuccess: () => void
}

function DateField({ form, name, label }: {
  form: ReturnType<typeof useForm<PeriodFormData>>
  name: 'start_date' | 'end_date'
  label: string
}) {
  const { field } = useController({ control: form.control, name })

  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <Input id={name} type="date" {...field} value={field.value ?? ''} />
      </FieldContent>
    </Field>
  )
}

export function PeriodForm({ userId, onSuccess }: Props) {
  const createPeriod = useCreatePeriod()
  const form = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
  })

  const onSubmit = async (data: PeriodFormData) => {
    await createPeriod.mutateAsync({ ...data, created_by: userId })
    form.reset()
    onSuccess()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormFieldInput
        control={form.control}
        name="name"
        label="Nombre del período"
        placeholder="Ej: Junio 2026 - Quincena 1"
      />
      <div className="grid grid-cols-2 gap-4">
        <DateField form={form} name="start_date" label="Fecha inicio" />
        <DateField form={form} name="end_date" label="Fecha fin" />
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Creando...' : 'Crear período'}
      </Button>
    </form>
  )
}
