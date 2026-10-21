'use client'

import { useEffect, useState } from 'react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { DatePicker } from '@/components/ui/date-picker'
import { useCreateHoliday, useUpdateHoliday } from '../hooks/use-holidays'
import { holidaySchema, type HolidayFormData } from '../schemas'
import { describeDbError } from '@/lib/db-errors'
import type { Holiday } from '@/types'

interface Props {
  /** Cuando viene, el formulario edita un feriado existente. */
  holiday?: Holiday
  /** País al que pertenece el feriado (clave foránea de `holidays.country_id`). */
  countryId: string
  onSuccess: () => void
  onCancel?: () => void
}

/**
 * Formulario de alta / edición de feriados (sólo admins).
 *
 * Los feriados móviles (Jueves Santo, Viernes Santo) dependen del calendario
 * lunar, así que el admin tiene que cargarlos manualmente cada año.
 */
export function HolidayForm({ holiday, countryId, onSuccess, onCancel }: Props) {
  const isEditing = !!holiday
  const createHoliday = useCreateHoliday()
  const updateHoliday = useUpdateHoliday()
  const [mutationError, setMutationError] = useState<string | null>(null)

  const form = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: holiday
      ? { name: holiday.name, date: holiday.date }
      : { name: '', date: '' },
  })

  // Al cambiar de feriado editado, se recargan los valores del formulario.
  useEffect(() => {
    setMutationError(null)
    form.reset(
      holiday
        ? { name: holiday.name, date: holiday.date }
        : { name: '', date: '' },
    )
  }, [holiday, form])

  const dateField = useController({ control: form.control, name: 'date' })

  const onSubmit = async (data: HolidayFormData) => {
    setMutationError(null)

    try {
      if (isEditing && holiday) {
        await updateHoliday.mutateAsync({
          id: holiday.id,
          values: { date: data.date, name: data.name.trim() },
        })
      } else {
        await createHoliday.mutateAsync({
          country_id: countryId,
          date: data.date,
          name: data.name.trim(),
        })
      }
      form.reset()
      onSuccess()
    } catch (error) {
      setMutationError(describeDbError(error))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Field data-invalid={dateField.fieldState.invalid}>
        <FieldLabel htmlFor="date">Fecha del feriado</FieldLabel>
        <FieldContent>
          <DatePicker
            id="date"
            value={dateField.field.value || undefined}
            onValueChange={(value) => {
              form.clearErrors('date')
              dateField.field.onChange(value ?? '')
            }}
            placeholder="Elegí la fecha"
            aria-invalid={dateField.fieldState.invalid}
          />
          <FieldError
            errors={dateField.fieldState.error ? [dateField.fieldState.error] : []}
          />
        </FieldContent>
      </Field>

      <FormFieldInput
        control={form.control}
        name="name"
        label="Nombre del feriado"
        placeholder="Ej: Jueves Santo"
      />

      {mutationError && (
        <p role="alert" className="text-sm text-destructive">
          {mutationError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? isEditing
              ? 'Guardando...'
              : 'Creando...'
            : isEditing
              ? 'Guardar cambios'
              : 'Crear feriado'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
