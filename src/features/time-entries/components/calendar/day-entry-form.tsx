"use client";

import { useState } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useCreateEntry } from "../../hooks/use-entries";
import { timeEntrySchema, type TimeEntryFormData } from "../../schemas";
import {
  calcExtraHours,
  calcHours,
  calcScheduledEndTime,
  getStandardHours,
} from "@/lib/calculations";
import type { EmploymentType } from "@/types";

interface Props {
  userId: string;
  profileType: EmploymentType;
  /** Fecha fija del día sobre el que se está creando el registro. */
  date: string;
  /** Se invoca tras guardar correctamente (el popover se mantiene abierto). */
  onSaved?: () => void;
}

/** Hora de inicio por defecto: 08:00. */
const DEFAULT_START = "08:00";

/**
 * Formulario de alta rápida dentro del popover de un día del calendario.
 *
 * A diferencia de `ManualEntryForm` (que vive en la barra superior y hereda el
 * concepto global), aquí el concepto es un campo editable propio y la fecha
 * viene fijada por el día que se seleccionó en la grilla.
 *
 * Tras guardar, los campos se remontan con el horario siguiente al recién
 * guardado, para poder encadenar varios registros del mismo día sin volver a
 * escribir las horas.
 */
export function DayEntryForm({ userId, profileType, date, onSaved }: Props) {
  const [nextStart, setNextStart] = useState(DEFAULT_START);

  return (
    <DayEntryFields
      key={nextStart}
      userId={userId}
      profileType={profileType}
      date={date}
      defaultStart={nextStart}
      onRegistered={(endTime) => setNextStart(endTime)}
      onSavedComplete={onSaved}
    />
  );
}

function DayEntryFields({
  userId,
  profileType,
  date,
  defaultStart,
  onRegistered,
  onSavedComplete,
}: Omit<Props, "onSaved"> & {
  defaultStart: string;
  /** Se invoca con la hora de fin del registro recién guardado. */
  onRegistered: (endTime: string) => void;
  onSavedComplete?: () => void;
}) {
  const createEntry = useCreateEntry();

  const form = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date,
      start_time: defaultStart,
      end_time: calcScheduledEndTime(defaultStart, profileType),
      concept: "",
      notes: "",
    },
  });

  const startField = useController({
    control: form.control,
    name: "start_time",
  });
  const endField = useController({ control: form.control, name: "end_time" });
  const conceptField = useController({
    control: form.control,
    name: "concept",
  });
  const notesField = useController({ control: form.control, name: "notes" });

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
      await createEntry.mutateAsync({ userId, values });
      toast.success("Registro guardado");
      // El formulario se remonta con el horario siguiente al recién guardado.
      onRegistered(values.end_time);
      onSavedComplete?.();
    } catch {
      // El toast lo muestra el MutationCache global (ver main.tsx).
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={startField.fieldState.invalid}>
            <FieldLabel htmlFor={`day-start-${date}`}>Inicio</FieldLabel>
            <FieldContent>
              <Input
                id={`day-start-${date}`}
                type="time"
                step={60}
                aria-invalid={startField.fieldState.invalid}
                {...startField.field}
                value={startField.field.value ?? ""}
              />
              <FieldError
                errors={
                  startField.fieldState.error
                    ? [startField.fieldState.error]
                    : []
                }
              />
            </FieldContent>
          </Field>

          <Field data-invalid={endField.fieldState.invalid}>
            <FieldLabel htmlFor={`day-end-${date}`}>Fin</FieldLabel>
            <FieldContent>
              <Input
                id={`day-end-${date}`}
                type="time"
                step={60}
                aria-invalid={endField.fieldState.invalid}
                {...endField.field}
                value={endField.field.value ?? ""}
              />
              <FieldError
                errors={
                  endField.fieldState.error ? [endField.fieldState.error] : []
                }
              />
            </FieldContent>
          </Field>
        </div>

        <Field data-invalid={conceptField.fieldState.invalid}>
          <FieldLabel htmlFor={`day-concept-${date}`}>Concepto</FieldLabel>
          <FieldContent>
            <Input
              id={`day-concept-${date}`}
              placeholder="¿Qué hiciste?"
              aria-invalid={conceptField.fieldState.invalid}
              {...conceptField.field}
              value={conceptField.field.value ?? ""}
            />
            <FieldError
              errors={
                conceptField.fieldState.error
                  ? [conceptField.fieldState.error]
                  : []
              }
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor={`day-notes-${date}`}>Notas</FieldLabel>
          <FieldContent>
            <Input
              id={`day-notes-${date}`}
              placeholder="Opcional"
              {...notesField.field}
              value={notesField.field.value ?? ""}
            />
          </FieldContent>
        </Field>
      </FieldGroup>

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
        {form.formState.isSubmitting ? "Guardando..." : "Guardar registro"}
      </button>
    </form>
  );
}
