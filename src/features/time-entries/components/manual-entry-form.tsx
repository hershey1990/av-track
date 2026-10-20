"use client";

import { useEffect } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { useCreateEntry, useUpdateEntry } from "../hooks/use-entries";
import { timeEntrySchema, type TimeEntryFormData } from "../schemas";
import {
  calcExtraHours,
  calcHours,
  getStandardHours,
} from "@/lib/calculations";
import { getNicaraguaDateTime, getTodayNicaragua } from "@/lib/timezone";
import type { EmploymentType, TimeEntry } from "@/types";

interface Props {
  userId: string;
  profileType: EmploymentType;
  /** Concepto escrito en la barra superior */
  concept: string;
  /** Si viene una entrada, el panel edita esa entrada; si no, crea una nueva */
  entry?: TimeEntry | null;
  /** Se invoca tras guardar correctamente */
  onSaved?: () => void;
}

/**
 * Panel para registrar (o editar) una entrada de horario.
 *
 * Es el contenido del popover de la barra superior: sustituye al antiguo
 * formulario que vivía en el dashboard.
 */
export function ManualEntryForm({
  userId,
  profileType,
  concept,
  entry,
  onSaved,
}: Props) {
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const isEditing = !!entry;

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: entry?.date ?? getTodayNicaragua(),
      start_time: entry?.start_time?.substring(0, 5) ?? "",
      end_time: entry?.end_time?.substring(0, 5) ?? "",
      concept: entry?.concept ?? concept,
      notes: entry?.notes ?? "",
    },
  });

  const startField = useController({
    control: form.control,
    name: "start_time",
  });
  const endField = useController({ control: form.control, name: "end_time" });
  const dateField = useController({ control: form.control, name: "date" });
  const conceptField = useController({
    control: form.control,
    name: "concept",
  });

  // El concepto se escribe en la barra superior; en modo creación lo tomamos
  // de ahí. En edición manda el valor de la entrada.
  useEffect(() => {
    if (!isEditing) conceptField.field.onChange(concept);
  }, [concept, conceptField.field, isEditing]);

  const onSubmit = async (values: TimeEntryFormData) => {
    const hours = calcHours(values.start_time, values.end_time);

    if (hours <= 0) {
      form.setError("end_time", {
        message: "La hora de fin debe ser posterior a la de inicio",
      });
      return;
    }

    const extra = calcExtraHours(hours, getStandardHours(profileType));
    if (extra > 0 && !values.concept?.trim()) {
      form.setError("concept", {
        message: "El concepto es requerido cuando hay horas extra",
      });
      return;
    }

    try {
      if (entry) {
        await updateEntry.mutateAsync({ id: entry.id, values });
      } else {
        await createEntry.mutateAsync({ userId, values });
      }
      onSaved?.();
    } catch {
      // El toast lo muestra el MutationCache global (ver main.tsx).
    }
  };

  const now = getNicaraguaDateTime();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="manual-start"
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            Inicio
          </Label>
          <TimePicker
            id="manual-start"
            value={startField.field.value || undefined}
            onValueChange={(value) => startField.field.onChange(value ?? "")}
            placeholder="--:--"
            aria-invalid={startField.fieldState.invalid}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="manual-end"
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            Fin
          </Label>
          <TimePicker
            id="manual-end"
            value={endField.field.value || undefined}
            onValueChange={(value) => endField.field.onChange(value ?? "")}
            placeholder="--:--"
            aria-invalid={endField.fieldState.invalid}
          />
        </div>
      </div>

      {(startField.fieldState.error || endField.fieldState.error) && (
        <p className="text-xs text-destructive">
          {startField.fieldState.error?.message ??
            endField.fieldState.error?.message}
        </p>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="manual-date"
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          Fecha
        </Label>
        <DatePicker
          id="manual-date"
          value={dateField.field.value || undefined}
          onValueChange={(value) => dateField.field.onChange(value ?? "")}
          placeholder="Elegí la fecha"
          aria-invalid={dateField.fieldState.invalid}
        />
      </div>

      {/* El concepto viene de la barra superior (o de la entrada en edición). */}
      <p className="truncate text-xs text-muted-foreground">
        Concepto:{" "}
        <span className="font-medium text-foreground">
          {conceptField.field.value?.trim() || "sin especificar"}
        </span>
      </p>

      {conceptField.fieldState.error && (
        <p className="text-xs text-destructive">
          {conceptField.fieldState.error.message}
        </p>
      )}

      {/*
        Base UI fuerza type="button" en sus botones, así que el submit del
        form no se dispara con <Button type="submit">. Usamos un <button>
        nativo para que funcione.
      */}
      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {form.formState.isSubmitting
          ? "Guardando..."
          : isEditing
            ? "Guardar cambios"
            : "Guardar registro"}
      </button>

      {!isEditing && (
        <p className="text-center text-[11px] text-muted-foreground">
          Sugerencia: ahora son las {now.time}
        </p>
      )}
    </form>
  );
}
