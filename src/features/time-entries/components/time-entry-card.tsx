'use client'

import { useState } from 'react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { getTodayNicaragua } from '@/lib/timezone'
import { useCreateEntry, useUpdateEntry, useTodayEntry } from '../hooks/use-entries'
import { timeEntrySchema, type TimeEntryFormData } from '../schemas'

interface Props {
  userId: string
}

function TimeField({ form, name, label }: {
  form: ReturnType<typeof useForm<TimeEntryFormData>>
  name: 'start_time' | 'end_time'
  label: string
}) {
  const { field, fieldState } = useController({ control: form.control, name })

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <Input
          id={name}
          type="time"
          aria-invalid={fieldState.invalid}
          {...field}
          value={field.value ?? ''}
        />
        <FieldError errors={fieldState.error ? [fieldState.error] : []} />
      </FieldContent>
    </Field>
  )
}

export function TimeEntryCard({ userId }: Props) {
  const today = getTodayNicaragua()
  const { data: existingEntry } = useTodayEntry(userId)
  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  const [editMode, setEditMode] = useState(!existingEntry)

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: existingEntry ?? {
      date: today,
      start_time: '',
      end_time: '',
      concept: '',
      notes: '',
    },
    values: existingEntry ?? undefined,
  })

  const onSubmit = async (data: TimeEntryFormData) => {
    if (existingEntry) {
      await updateEntry.mutateAsync({ id: existingEntry.id, values: data })
    } else {
      await createEntry.mutateAsync({ userId, values: data })
    }
    setEditMode(false)
  }

  if (existingEntry && !editMode) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Entrada de hoy</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Editar</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Entrada:</span>
            <span className="font-medium">{existingEntry.start_time.substring(0, 5)}</span>
            <span className="text-muted-foreground">Salida:</span>
            <span className="font-medium">{existingEntry.end_time.substring(0, 5)}</span>
            <span className="text-muted-foreground">Concepto:</span>
            <span className="font-medium">{existingEntry.concept}</span>
            {existingEntry.notes && (
              <>
                <span className="text-muted-foreground">Notas:</span>
                <span className="font-medium">{existingEntry.notes}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {existingEntry ? 'Editar entrada' : 'Registrar entrada'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFieldInput
            control={form.control}
            name="date"
            label="Fecha"
            type="date"
          />
          <div className="grid grid-cols-2 gap-4">
            <TimeField form={form} name="start_time" label="Entrada" />
            <TimeField form={form} name="end_time" label="Salida" />
          </div>
          <FormFieldInput
            control={form.control}
            name="concept"
            label="Concepto"
            placeholder="Ej: Soporte técnico"
          />
          <FormFieldInput
            control={form.control}
            name="notes"
            label="Notas (opcional)"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
            {existingEntry && (
              <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
