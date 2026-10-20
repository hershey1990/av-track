"use client";

import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { useUpdateEntry } from "../hooks/use-entries";
import {
  calcHours,
  calcExtraHours,
  getStandardHours,
} from "@/lib/calculations";
import { dayRowSchema, type DayRowFormData } from "../schemas";
import type { EmploymentType, TimeEntry } from "@/types";

interface Props {
  entry: TimeEntry;
  profileType?: EmploymentType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Diálogo de edición de una entrada de tiempo. No incluye disparador para poder
 * montarse dentro de filas de cualquier layout (tabla o lista).
 */
export function EntryEditDialog({
  entry,
  profileType = "fulltime",
  open,
  onOpenChange,
}: Props) {
  const updateEntry = useUpdateEntry();

  const form = useForm<DayRowFormData>({
    resolver: zodResolver(dayRowSchema),
    values: {
      start_time: entry.start_time.substring(0, 5),
      end_time: entry.end_time.substring(0, 5),
      concept: entry.concept,
      notes: entry.notes,
    },
  });

  const onSubmit = async (data: DayRowFormData) => {
    // Validar concepto si hay horas extra
    const hours = calcHours(data.start_time, data.end_time);
    const extra = calcExtraHours(hours, getStandardHours(profileType));
    if (extra > 0 && !data.concept?.trim()) {
      form.setError("concept", {
        message: "El concepto es requerido cuando hay horas extra",
      });
      return;
    }

    await updateEntry.mutateAsync({ id: entry.id, values: data });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Guardar
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TimeField({
  form,
  name,
  label,
}: {
  form: ReturnType<typeof useForm<DayRowFormData>>;
  name: "start_time" | "end_time";
  label: string;
}) {
  const { field, fieldState } = useController({ control: form.control, name });

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <TimePicker
          id={name}
          value={field.value || undefined}
          onValueChange={(value) => field.onChange(value ?? "")}
          placeholder="--:--"
          aria-invalid={fieldState.invalid}
        />
        <FieldError errors={fieldState.error ? [fieldState.error] : []} />
      </FieldContent>
    </Field>
  );
}

function ConceptField({
  form,
}: {
  form: ReturnType<typeof useForm<DayRowFormData>>;
}) {
  const { field, fieldState } = useController({
    control: form.control,
    name: "concept",
  });

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="concept">Concepto</FieldLabel>
      <FieldContent>
        <Input
          id="concept"
          aria-invalid={fieldState.invalid}
          {...field}
          value={field.value ?? ""}
        />
        <FieldError errors={fieldState.error ? [fieldState.error] : []} />
      </FieldContent>
    </Field>
  );
}

function NotesField({
  form,
}: {
  form: ReturnType<typeof useForm<DayRowFormData>>;
}) {
  const { field } = useController({ control: form.control, name: "notes" });

  return (
    <Field>
      <FieldLabel htmlFor="notes">Notas</FieldLabel>
      <FieldContent>
        <Input id="notes" {...field} value={field.value ?? ""} />
      </FieldContent>
    </Field>
  );
}
