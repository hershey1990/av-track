import { useState } from 'react'
import { useForm, useController } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldLabel, FieldContent, FieldError } from '@/components/ui/field'
import { Pencil, Trash2 } from 'lucide-react'
import { TableRow, TableCell } from '@/components/ui/table'
import { formatDateShort } from '@/lib/timezone'
import { useUpdateEntry, useDeleteEntry } from '../hooks/use-entries'
import { calcHours, calcExtraHours, getStandardHours } from '@/lib/calculations'
import type { TimeEntry, EmploymentType } from '@/types'
import { dayRowSchema, type DayRowFormData } from '../schemas'

interface Props {
  entry: TimeEntry
  profileType?: EmploymentType
  slotCount?: number
}

function TimeField({ form, name, label }: {
  form: ReturnType<typeof useForm<DayRowFormData>>
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

function ConceptField({ form }: { form: ReturnType<typeof useForm<DayRowFormData>> }) {
  const { field, fieldState } = useController({ control: form.control, name: 'concept' })

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="concept">Concepto</FieldLabel>
      <FieldContent>
        <Input
          id="concept"
          aria-invalid={fieldState.invalid}
          {...field}
          value={field.value ?? ''}
        />
        <FieldError errors={fieldState.error ? [fieldState.error] : []} />
      </FieldContent>
    </Field>
  )
}

function NotesField({ form }: { form: ReturnType<typeof useForm<DayRowFormData>> }) {
  const { field } = useController({ control: form.control, name: 'notes' })

  return (
    <Field>
      <FieldLabel htmlFor="notes">Notas</FieldLabel>
      <FieldContent>
        <Input
          id="notes"
          {...field}
          value={field.value ?? ''}
        />
      </FieldContent>
    </Field>
  )
}

export function DayRow({ entry, profileType = 'fulltime', slotCount }: Props) {
  const [open, setOpen] = useState(false)
  const updateEntry = useUpdateEntry()
  const deleteEntry = useDeleteEntry()

  const form = useForm<DayRowFormData>({
    resolver: zodResolver(dayRowSchema),
    defaultValues: {
      start_time: entry.start_time.substring(0, 5),
      end_time: entry.end_time.substring(0, 5),
      concept: entry.concept,
      notes: entry.notes,
    },
  })

  const hours = calcHours(entry.start_time, entry.end_time)

  const onSubmit = async (data: DayRowFormData) => {
    // Validar concepto si hay horas extra
    const hours = calcHours(data.start_time, data.end_time)
    const extra = calcExtraHours(hours, getStandardHours(profileType))
    if (extra > 0 && !data.concept?.trim()) {
      form.setError('concept', { message: 'El concepto es requerido cuando hay horas extra' })
      return
    }

    await updateEntry.mutateAsync({ id: entry.id, values: data })
    setOpen(false)
  }

  const handleDelete = async () => {
    if (confirm('¿Eliminar esta entrada?')) {
      await deleteEntry.mutateAsync(entry.id)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span>{formatDateShort(entry.date)}</span>
          {slotCount && slotCount > 1 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              #{entry.slot_index != null ? entry.slot_index + 1 : slotCount}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{entry.start_time.substring(0, 5)}</TableCell>
      <TableCell>{entry.end_time.substring(0, 5)}</TableCell>
      <TableCell className="font-medium">{hours.toFixed(2)}h</TableCell>
      <TableCell className="max-w-[120px] truncate">{entry.concept}</TableCell>
      <TableCell>
        <Badge variant={hours >= 7 ? 'default' : 'secondary'}>
          {hours >= 7 ? 'C$180' : '—'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent cursor-pointer">
              <Pencil className="h-4 w-4" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar entrada</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TimeField form={form} name="start_time" label="Entrada" />
                  <TimeField form={form} name="end_time" label="Salida" />
                </div>
                <ConceptField form={form} />
                <NotesField form={form} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>Guardar</Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
