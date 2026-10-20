"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { es } from "date-fns/locale";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fromDateOnly, toDateOnly } from "@/lib/timezone";
import type { DateRange, Matcher } from "react-day-picker";

/**
 * Selectores de fecha basados en el `DatePicker` de shadcn (composición de
 * `Popover` + `Calendar`), en lugar de los `<input type="date">` nativos.
 *
 * Patrón taken de https://ui.shadcn.com/docs/components/base/date-picker
 *
 * Motivo: el input nativo delega en el widget del sistema operativo, cuyo
 * aspecto cambia entre navegadores y sistemas, no se puede estilar y en
 * Windows ocupa un espacio desproporcionado. El popover mantiene el mismo
 * look en toda la app.
 *
 * El valor sigue siendo un string "yyyy-MM-dd" (mismo formato que la BD), de
 * modo que los formularios y las queries no cambian.
 */

interface DatePickerProps {
  /** Fecha seleccionada en formato "yyyy-MM-dd". */
  value?: string;
  /** Se dispara con el nuevo valor "yyyy-MM-dd" (o `undefined` al limpiar). */
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Fecha mínima seleccionable ("yyyy-MM-dd"). */
  min?: string;
  /** Fecha máxima seleccionable ("yyyy-MM-dd"). */
  max?: string;
  /** Se marca el campo como inválido (validación de formularios). */
  "aria-invalid"?: boolean;
}

/** Selector de una sola fecha. */
export function DatePicker({
  value,
  onValueChange,
  placeholder = "Elegí una fecha",
  id,
  disabled,
  className,
  min,
  max,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? fromDateOnly(value) : undefined,
  );

  // Días que quedan fuera del rango permitido.
  const disabledDays = React.useMemo<Matcher[]>(() => {
    const matchers: Matcher[] = [];
    if (min) matchers.push({ before: fromDateOnly(min) });
    if (max) matchers.push({ after: fromDateOnly(max) });
    return matchers;
  }, [min, max]);

  // Sincroniza el estado interno cuando el valor cambia desde fuera
  // (p. ej. al editar otra entrada).
  React.useEffect(() => {
    setDate(value ? fromDateOnly(value) : undefined);
  }, [value]);

  const handleSelect = (next: Date | undefined) => {
    setDate(next);
    onValueChange?.(next ? toDateOnly(next) : undefined);
  };

  return (
    <div
      aria-invalid={ariaInvalid || undefined}
      data-invalid={ariaInvalid || undefined}
      className="group/picker"
    >
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              disabled={disabled}
              data-empty={!date}
              className={`w-full justify-start gap-2 font-normal data-[empty=true]:text-muted-foreground group-data-[invalid=true]/picker:border-destructive group-data-[invalid=true]/picker:ring-3 group-data-[invalid=true]/picker:ring-destructive/20 ${className ?? ""}`}
            />
          }
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {date ? (
            format(date, "d 'de' MMM, yyyy", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <Calendar
            mode="single"
            locale={es}
            selected={date}
            onSelect={handleSelect}
            disabled={disabledDays.length > 0 ? disabledDays : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface DateRangePickerProps {
  /** Inicio del rango ("yyyy-MM-dd"). */
  from?: string;
  /** Fin del rango ("yyyy-MM-dd"). */
  to?: string;
  /** Se dispara con el inicio y el fin del rango seleccionado. */
  onRangeChange?: (from: string | undefined, to: string | undefined) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
}

/**
 * Selector de rango de fechas: un único popover con el calendario en modo
 * rango. Al primer clic se fija el inicio y, al segundo, el fin.
 */
export function DateRangePicker({
  from,
  to,
  onRangeChange,
  placeholder = "Elegí un rango de fechas",
  id,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: DateRangePickerProps) {
  const [range, setRange] = React.useState<DateRange | undefined>(() =>
    from || to
      ? {
          from: from ? fromDateOnly(from) : undefined,
          to: to ? fromDateOnly(to) : undefined,
        }
      : undefined,
  );

  React.useEffect(() => {
    setRange(
      from || to
        ? {
            from: from ? fromDateOnly(from) : undefined,
            to: to ? fromDateOnly(to) : undefined,
          }
        : undefined,
    );
  }, [from, to]);

  const handleSelect = (next: DateRange | undefined) => {
    setRange(next);
    onRangeChange?.(
      next?.from ? toDateOnly(next.from) : undefined,
      next?.to ? toDateOnly(next.to) : undefined,
    );
  };

  const label = from
    ? to
      ? `${format(fromDateOnly(from), "d MMM yyyy", { locale: es })} — ${format(fromDateOnly(to), "d MMM yyyy", { locale: es })}`
      : `${format(fromDateOnly(from), "d MMM yyyy", { locale: es })} — …`
    : placeholder;

  return (
    <div
      aria-invalid={ariaInvalid || undefined}
      data-invalid={ariaInvalid || undefined}
      className="group/picker"
    >
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              disabled={disabled}
              data-empty={!from}
              className={`w-full justify-start gap-2 font-normal data-[empty=true]:text-muted-foreground group-data-[invalid=true]/picker:border-destructive group-data-[invalid=true]/picker:ring-3 group-data-[invalid=true]/picker:ring-destructive/20 ${className ?? ""}`}
            />
          }
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <Calendar
            mode="range"
            locale={es}
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
