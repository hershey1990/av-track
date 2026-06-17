'use client'

import { useController, type Control, type FieldValues, type Path } from 'react-hook-form'
import { Input } from './input'
import { Field, FieldLabel, FieldContent, FieldError } from './field'

interface FormFieldInputProps<TFieldValues extends FieldValues>
  extends Omit<React.ComponentProps<typeof Input>, 'id' | 'aria-invalid'> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
}

export function FormFieldInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormFieldInputProps<TFieldValues>) {
  const { field, fieldState } = useController({ control, name })

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <Input
          id={name}
          aria-invalid={fieldState.invalid}
          {...field}
          value={field.value ?? ''}
          {...inputProps}
        />
        <FieldError errors={fieldState.error ? [fieldState.error] : []} />
      </FieldContent>
    </Field>
  )
}
