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
import { useCreateEntry, useUpdateEntry, useDeleteEntry, useTodayEntries } from '../hooks/use-entries'
import { timeEntrySchema, type TimeEntryFormData } from '../schemas'
import { calcExtraHours, calcHours, getStandardHours } from '@/lib/calculations'
import type { EmploymentType, TimeEntry } from '@/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Props {
  userId: string
  profileType: EmploymentType
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

export function TimeEntryCard({ userId, profileType }: Props) {
  const today = getTodayNicaragua()
  const { data: entries = [] } = useTodayEntries(userId)
  const createEntry = useCreateEntry()
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()
  const [editingSlot, setEditingSlot] = useState<TimeEntry | null>(null)
  const [showAddForm, setShowAddForm] = useState(entries.length === 0)

  const totalHours = entries.reduce((sum, e) => sum + calcHours(e.start_time, e.end_time), 0)
  const totalExtra = Math.max(0, totalHours - getStandardHours(profileType))

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: { date: today, start_time: '', end_time: '', concept: '', notes: '' },
  })

  const onSubmit = async (data: TimeEntryFormData) => {
    const hours = calcHours(data.start_time, data.end_time)
    const extra = calcExtraHours(hours, getStandardHours(profileType))
    if (extra > 0 && !data.concept?.trim()) {
      form.setError('concept', { message: 'El concepto es requerido cuando hay horas extra' })
      return
    }

    if (editingSlot) {
      await updateEntry.mutateAsync({ id: editingSlot.id, values: data })
      setEditingSlot(null)
    } else {
      await createEntry.mutateAsync({ userId, values: data })
      setShowAddForm(false)
    }
    form.reset({ date: today, start_time: '', end_time: '', concept: '', notes: '' })
  }

  const handleEdit = (entry: TimeEntry) => {
    setEditingSlot(entry)
    form.reset({
      date: entry.date,
      start_time: entry.start_time.substring(0, 5),
      end_time: entry.end_time.substring(0, 5),
      concept: entry.concept,
      notes: entry.notes,
    })
  }

  const handleDelete = async (entry: TimeEntry) => {
    if (confirm('¿Eliminar esta entrada?')) {
      await deleteEntry.mutateAsync(entry.id)
      if (editingSlot?.id === entry.id) setEditingSlot(null)
    }
  }

  const handleCancel = () => {
    setEditingSlot(null)
    setShowAddForm(false)
    form.reset({ date: today, start_time: '', end_time: '', concept: '', notes: '' })
  }

  // Show form if editing a slot, adding new slot, or no entries yet
  if (editingSlot || showAddForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingSlot ? 'Editar entrada' : entries.length === 0 ? 'Registrar entrada' : 'Agregar otro slot'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormFieldInput control={form.control} name="date" label="Fecha" type="date" />
            <div className="grid grid-cols-2 gap-4">
              <TimeField form={form} name="start_time" label="Entrada" />
              <TimeField form={form} name="end_time" label="Salida" />
            </div>
            <FormFieldInput control={form.control} name="concept" label="Concepto" placeholder="Ej: Soporte técnico" />
            <FormFieldInput control={form.control} name="notes" label="Notas" />
            <div className="flex gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
              {(editingSlot || showAddForm) && entries.length > 0 && (
                <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // View mode: show all today's entries
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Entrada de hoy</CardTitle>
        {entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-3">Sin registros para hoy</p>
            <Button onClick={() => setShowAddForm(true)}>Registrar entrada</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const hours = calcHours(entry.start_time, entry.end_time)
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground font-mono">#{idx + 1}</span>
                    <span className="font-mono">{entry.start_time.substring(0, 5)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">{entry.end_time.substring(0, 5)}</span>
                    <span className="font-medium">{hours.toFixed(2)}h</span>
                    {entry.concept && (
                      <span className="text-muted-foreground truncate max-w-[120px]">{entry.concept}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(entry)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
            {entries.length > 1 && (
              <div className="flex justify-end text-sm pt-1 border-t">
                <span className="text-muted-foreground mr-2">Total hoy:</span>
                <span className="font-bold">{totalHours.toFixed(2)}h</span>
                {totalExtra > 0 && (
                  <span className="text-amber-600 ml-2">(+{totalExtra.toFixed(2)}h extra)</span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
