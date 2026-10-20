"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { es } from "date-fns/locale";
import { format } from "date-fns";

import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  NICARAGUA_TIMEZONE,
  fromDateOnly,
  toDateOnly,
} from "@/lib/timezone";

/**
 * Selectores de fecha basados en `react-day-picker` (vía el `Calendar` de
 * shadcn), en lugar de los `<input type="date">` nativos.
 *
 * Motivo: el input nativo delega en el widget del sistema operativo, cuyo
 * aspecto cambia entre navegadores y sistemas, no se puede estilar y en
 * Windows ocupa un espacio desproporcionado. El popover mantiene el mismo
 * look en toda la app.
 *
 * El valor sigue siendo un string "yyyy-MM-dd" (mismo formato que la BD), de
 * modo que los formularios y las queries no cambian.
 *
 * ## Detalle de implementación
 *
 * El calendario **no** usa `onSelect` de `react-day-picker`, sino
 * `onDayClick`. Con `timeZone` fijado, la fecha que entrega `onSelect` no
 * coincide con el día pulsado; y en `mode="single"` dentro de un `<form>` el
 * popover se cierra antes de aplicar la fecha. `onDayClick` entrega siempre
 * el día exacto, igual que en la vista de calendario de la app.
 *
 * Además, el popover se mantiene abierto ante cierres que no son
 * explícitos del usuario: al montarse el calendario bajo el cursor, el
 * `mouseup` cae sobre él y el navegador despacha el `click` al ancestro
 * común, lo que Base UI interpreta como un cierre.
 */

/** Motivos de cierre que sí deben cerrar el popover. */
const EXPLICIT_CLOSE_REASONS = new Set([
  "escape-key",
  "outside-press",
  "close-press",
  "trigger-press",
]);

interface DatePickerProps {
  /** Fecha seleccionada en formato "yyyy-MM-dd". */
  value?: string;
  /** Se dispara con el nuevo valor "yyyy-MM-dd" (o `undefined` al limpiar). */
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  /** Fecha mínima seleccionable ("yyyy-MM-dd"). */
  min?: string;
  /** Fecha máxima seleccionable ("yyyy-MM-dd"). */
  max?: string;
  className?: string;
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
  min,
  max,
  className,
  "aria-invalid": ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => (value ? fromDateOnly(value) : undefined),
    [value],
  );

  const disabledDays = React.useMemo(
    () => [
      ...(min ? [{ before: fromDateOnly(min) }] : []),
      ...(max ? [{ after: fromDateOnly(max) }] : []),
    ],
    [min, max],
  );

  const handleDayClick = (day: Date) => {
    onValueChange?.(toDateOnly(day));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        if (!next && !EXPLICIT_CLOSE_REASONS.has(details?.reason ?? "")) {
          return;
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger
        type="button"
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid ? true : undefined}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-full justify-start gap-2 px-3 font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {value
            ? format(fromDateOnly(value), "d 'de' MMM, yyyy", { locale: es })
            : placeholder}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0" sideOffset={4}>
        <Calendar
          mode="range"
          locale={es}
          timeZone={NICARAGUA_TIMEZONE}
          selected={selected ? { from: selected, to: selected } : undefined}
          defaultMonth={selected}
          onSelect={() => {}}
          onDayClick={handleDayClick}
          disabled={disabledDays}
        />
      </PopoverContent>
    </Popover>
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
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () =>
      from || to
        ? {
            from: from ? fromDateOnly(from) : undefined,
            to: to ? fromDateOnly(to) : undefined,
          }
        : undefined,
    [from, to],
  );

  /**
   * Lógica del rango sobre el día pulsado:
   *
   * - Sin rango en curso → el día pulsado es el inicio.
   * - Con inicio y sin fin → el día pulsado es el fin (se ordena el rango).
   * - Con rango completo → el día pulsado empieza un rango nuevo.
   */
  const handleDayClick = (day: Date) => {
    const key = toDateOnly(day);
    if (!key) return;

    if (from && !to) {
      const start = from <= key ? from : key;
      const end = from <= key ? key : from;
      onRangeChange?.(start, end);
      setOpen(false);
      return;
    }

    onRangeChange?.(key, undefined);
  };

  const label = from
    ? to
      ? `${formatDateLabel(from)} — ${formatDateLabel(to)}`
      : `${formatDateLabel(from)} — …`
    : placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        if (!next && !EXPLICIT_CLOSE_REASONS.has(details?.reason ?? "")) {
          return;
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger
        type="button"
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid ? true : undefined}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-full justify-start gap-2 px-3 font-normal",
          !from && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0" sideOffset={4}>
        <Calendar
          mode="range"
          locale={es}
          timeZone={NICARAGUA_TIMEZONE}
          selected={selected}
          defaultMonth={selected?.from}
          onSelect={() => {}}
          onDayClick={handleDayClick}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}

/** "20 oct 2026" a partir de un "yyyy-MM-dd". */
function formatDateLabel(dateStr: string): string {
  return format(fromDateOnly(dateStr), "d MMM yyyy", { locale: es });
}
