'use client'

import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Field, FieldLabel, FieldContent, FieldError } from './field'

interface Option {
  value: string
  label: string
}

interface FormFieldSelectProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
  placeholder?: string
  options: Option[]
  disabled?: boolean
}

export function FormFieldSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
}: FormFieldSelectProps<TFieldValues>) {
  const { field, fieldState } = useController({ control, name })

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <Select
          value={field.value}
          onValueChange={field.onChange}
        >
          <SelectTrigger
            id={name}
            aria-invalid={fieldState.invalid}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError errors={fieldState.error ? [fieldState.error] : []} />
      </FieldContent>
    </Field>
  )
}
