"use client";

import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Field, FieldLabel, FieldContent, FieldError } from "./field";

interface Option {
  value: string;
  label: string;
}

interface FormFieldSelectProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  /** El Select de Base UI es modal por defecto. */
  modal?: boolean;
}

export function FormFieldSelect<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  modal,
}: FormFieldSelectProps<TFieldValues>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <Select
          // `items` permite que el trigger muestre la etiqueta y no el valor.
          items={options}
          // `null` mantiene el Select controlado aunque el valor aún no exista
          // (Base UI exige controlado o no controlado, nunca ambos).
          value={field.value ?? null}
          onValueChange={field.onChange}
        >
          <SelectTrigger
            id={name}
            className="w-full"
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
  );
}
