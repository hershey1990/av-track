'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormFieldInput } from '@/components/ui/form-field-input'
import { FormFieldSelect } from '@/components/ui/form-field-select'
import { useCreateAbsence } from '../hooks/use-absences'
import { absenceSchema, type AbsenceFormData } from '../schemas'
import { useState } from 'react'

interface Props {
  userId: string
  onSuccess?: () => void
}

const ABSENCE_TYPES = [
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'sick', label: 'Enfermedad' },
  { value: 'compensatory', label: 'Compensatorio' },
]

export function AbsenceRequestCard({ userId, onSuccess }: Props) {
  const [showForm, setShowForm] = useState(false)
  const createAbsence = useCreateAbsence()

  const form = useForm<AbsenceFormData>({
    resolver: zodResolver(absenceSchema),
    defaultValues: { type: 'vacation', start_date: '', end_date: '', reason: '' },
  })

  const onSubmit = async (data: AbsenceFormData) => {
    await createAbsence.mutateAsync({ userId, values: data })
    form.reset()
    setShowForm(false)
    onSuccess?.()
  }

  if (!showForm) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Ausencias</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            Solicitar
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Solicita vacaciones, días por enfermedad o compensatorios.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Solicitar ausencia</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFieldSelect
            control={form.control}
            name="type"
            label="Tipo"
            options={ABSENCE_TYPES}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormFieldInput control={form.control} name="start_date" label="Fecha inicio" type="date" />
            <FormFieldInput control={form.control} name="end_date" label="Fecha fin" type="date" />
          </div>

          <FormFieldInput
            control={form.control}
            name="reason"
            label="Motivo (opcional)"
            placeholder="Ej: Cita médica"
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); form.reset() }}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
