"use client";

import { useEffect, useState } from "react";
import { useForm, useController, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { FormFieldInput } from "@/components/ui/form-field-input";
import {
  usePeriods,
  useCreatePeriod,
  useUpdatePeriod,
} from "@/features/reports/hooks/use-periods";
import { DatePicker } from "@/components/ui/date-picker";
import { periodSchema, type PeriodFormData } from "../schemas";
import { buildPeriodName } from "../period-name";
import {
  getMaxEndDate,
  getMinStartDate,
  validateNewPeriod,
} from "../period-rules";
import { describeDbError } from "@/lib/db-errors";
import { getTodayNicaragua } from "@/lib/timezone";
import type { Period } from "@/types";

interface Props {
  userId: string;
  onSuccess: () => void;
  /** When provided, the form works in edit mode */
  period?: Period;
  /** Called when the form is cancelled (closes the dialog) */
  onCancel?: () => void;
}

function DateField({
  form,
  name,
  label,
  min,
  max,
}: {
  form: ReturnType<typeof useForm<PeriodFormData>>;
  name: "start_date" | "end_date";
  label: string;
  min?: string;
  max?: string;
}) {
  const { field, fieldState } = useController({ control: form.control, name });

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <FieldContent>
        <DatePicker
          id={name}
          value={field.value || undefined}
          onValueChange={(value) => {
            // El error de las reglas de alta es manual: se recalcula al enviar.
            form.clearErrors(name);
            field.onChange(value ?? "");
          }}
          placeholder="Elegí la fecha"
          aria-invalid={fieldState.invalid}
          min={min}
          max={max}
        />
        {/* El DatePicker no pinta el error de validación, así que va aquí. */}
        <FieldError errors={fieldState.error ? [fieldState.error] : []} />
      </FieldContent>
    </Field>
  );
}

export function PeriodForm({ userId, onSuccess, period, onCancel }: Props) {
  const isEditing = !!period;
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();
  const { data: periods } = usePeriods();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const form = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: period
      ? {
          name: period.name,
          start_date: period.start_date,
          end_date: period.end_date,
        }
      : { name: "", start_date: "", end_date: "" },
  });

  // Reset form when switching which period is being edited
  useEffect(() => {
    setMutationError(null);
    if (period) {
      form.reset({
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
      });
    } else {
      form.reset({ name: "", start_date: "", end_date: "" });
    }
  }, [period, form]);

  const [watchedName, watchedStart, watchedEnd] = useWatch({
    control: form.control,
    name: ["name", "start_date", "end_date"],
  });

  const trimmedName = (watchedName ?? "").trim();
  const autoName = buildPeriodName(watchedStart ?? "", watchedEnd ?? "");

  // Períodos existentes, excluyendo el que se está editando.
  const otherPeriods = (periods ?? []).filter((p) => p.id !== period?.id);
  const today = getTodayNicaragua();

  // Límites cruzados: el inicio no puede pasar del fin y el fin no puede
  // preceder al inicio. En alta, el inicio no puede ser anterior al día
  // siguiente del fin del último período cerrado, y el rango no puede
  // solaparse con ningún período existente.
  const startMin = isEditing ? undefined : getMinStartDate(otherPeriods, today);
  const startMax = watchedEnd || undefined;
  const endMin = watchedStart || undefined;
  const endMax = isEditing
    ? undefined
    : getMaxEndDate(otherPeriods, watchedStart ?? "");

  const onSubmit = async (data: PeriodFormData) => {
    setMutationError(null);

    // Reglas de alta: fecha de inicio y solapamiento.
    if (!isEditing) {
      const errors = validateNewPeriod(otherPeriods, data, today);
      if (errors.start_date) {
        form.setError("start_date", { message: errors.start_date });
      }
      if (errors.end_date) {
        form.setError("end_date", { message: errors.end_date });
      }
      if (errors.start_date || errors.end_date) return;
    }

    // Nombre vacío ⇒ se deriva de las fechas.
    const finalName =
      data.name.trim() || buildPeriodName(data.start_date, data.end_date);

    try {
      if (isEditing && period) {
        await updatePeriod.mutateAsync({
          id: period.id,
          values: { ...data, name: finalName },
        });
      } else {
        await createPeriod.mutateAsync({
          ...data,
          name: finalName,
          created_by: userId,
        });
      }
      form.reset();
      onSuccess();
    } catch (error) {
      // El toast global también avisa; aquí el error queda junto al formulario.
      setMutationError(describeDbError(error));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <FormFieldInput
        control={form.control}
        name="name"
        label="Nombre del período"
        placeholder="Ej: Octubre 2026 a Noviembre 2026"
      />
      <p className="-mt-3 text-xs text-muted-foreground">
        {trimmedName ? (
          <>
            Se guardará como:{" "}
            <span className="text-foreground">{trimmedName}</span>
          </>
        ) : autoName ? (
          <>
            Nombre automático:{" "}
            <span className="text-foreground">{autoName}</span>
          </>
        ) : (
          "Si lo dejás vacío, el nombre se genera con las fechas."
        )}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateField
          form={form}
          name="start_date"
          label="Fecha inicio"
          min={startMin}
          max={startMax}
        />
        <DateField
          form={form}
          name="end_date"
          label="Fecha fin"
          min={endMin}
          max={endMax}
        />
      </div>
      {mutationError && (
        <p role="alert" className="text-sm text-destructive">
          {mutationError}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? isEditing
              ? "Guardando..."
              : "Creando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear período"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
