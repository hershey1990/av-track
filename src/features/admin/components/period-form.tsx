'use client'

import { useEffect } from 'react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent } from '@/components/ui/field'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { useCreatePeriod, useUpdatePeriod } from '@/features/reports/hooks/use-periods'
import { periodSchema, type PeriodFormData } from '../schemas'
import type { Period } from '@/types'

interface Props {
  userId: string
  onSuccess: () => void
  /** When provided, the form works in edit mode */
  period?: Period
  /** Called when the edit is cancelled */
  onCancel?: () => void
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

export function PeriodForm({ userId, onSuccess, period, onCancel }: Props) {
  const isEditing = !!period
  const createPeriod = useCreatePeriod()
  const updatePeriod = useUpdatePeriod()

  const form = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: period
      ? { name: period.name, start_date: period.start_date, end_date: period.end_date }
      : { name: '', start_date: '', end_date: '' },
  })

  // Reset form when switching which period is being edited
  useEffect(() => {
    if (period) {
      form.reset({ name: period.name, start_date: period.start_date, end_date: period.end_date })
    } else {
      form.reset({ name: '', start_date: '', end_date: '' })
    }
  }, [period, form])

  const onSubmit = async (data: PeriodFormData) => {
    if (isEditing && period) {
      await updatePeriod.mutateAsync({ id: period.id, values: data })
    } else {
      await createPeriod.mutateAsync({ ...data, created_by: userId })
    }
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
      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? (isEditing ? 'Guardando...' : 'Creando...')
            : (isEditing ? 'Guardar cambios' : 'Crear período')}
        </Button>
        {isEditing && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
