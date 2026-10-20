"use client"

import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { DatePicker } from './date-picker'
import { Label } from './label'

interface FormFieldDatePickerProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
  placeholder?: string
  min?: string
  max?: string
}

/**
 * Campo de fecha para React Hook Form.
 *
 * Sustituye a `FormFieldInput type="date"`: el valor sigue siendo un string
 * "yyyy-MM-dd", pero la interacción es con el calendario en un popover.
 */
export function FormFieldDatePicker<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  min,
  max,
}: FormFieldDatePickerProps<TFieldValues>) {
  const { field, fieldState } = useController({ control, name })

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <DatePicker
        id={name}
        value={field.value || undefined}
        onValueChange={(value) => field.onChange(value ?? '')}
        placeholder={placeholder}
        min={min}
        max={max}
        aria-invalid={fieldState.invalid}
      />
      {fieldState.error && (
        <p className="text-xs text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  )
}
