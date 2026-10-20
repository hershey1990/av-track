"use client";

import { useEffect, useRef } from "react";
import type { DayButton } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { colorForConcept } from "../concept-color";
import { useCalendarDay } from "./calendar-day-context";
import { DayPopoverContent } from "./day-popover";
import {
  formatHoursHM,
  getWeekdayIndex,
  summarizeDay,
  toDateOnly,
} from "./calendar-utils";
import { cn } from "@/lib/utils";

type DayButtonProps = React.ComponentProps<typeof DayButton>;

/** Máximo de barras de concepto dibujadas dentro de una celda. */
const MAX_BARS = 3;

/**
 * Celda del calendario: el `DayButton` que se inyecta en `react-day-picker`.
 *
 * Muestra el número del día, el total de horas registradas y una barra por
 * entrada (coloreada según el concepto). Al pulsarla se abre el popover con el
 * detalle del día y el formulario de alta rápida.
 *
 * El botón es a la vez el trigger del popover, de modo que el foco, el `Enter`
 * y el `tabIndex` que gestiona la librería siguen funcionando.
 */
export function CalendarDayButton({
  day,
  modifiers,
  className,
  onClick,
  onKeyDown,
  ...buttonProps
}: DayButtonProps) {
  const {
    userId,
    profileType,
    openDate,
    setOpenDate,
    entriesByDate,
    workingDays,
    isDesktop,
  } = useCalendarDay();

  const buttonRef = useRef<HTMLButtonElement>(null);

  const date = toDateOnly(day.date);
  const entries = entriesByDate.get(date) ?? [];
  const summary = summarizeDay(entries, profileType);

  const isToday = Boolean(modifiers.today);
  const isOutside = Boolean(modifiers.outside);
  const weekday = getWeekdayIndex(date);
  const isWorkingDay =
    workingDays.length === 0 || workingDays.includes(weekday);
  const isOpen = openDate === date;

  // La librería mueve el foco al día "focused" mediante un efecto; replicamos
  // ese comportamiento porque sustituimos su DayButton por este.
  //
  // No se roba el foco si el popover está abierto: al hacerlo, Base UI
  // interpretaría la salida del foco como un dismissal y cerraría el popover
  // al instante.
  useEffect(() => {
    if (modifiers.focused && !isOpen) buttonRef.current?.focus();
  }, [modifiers.focused, isOpen]);

  /**
   * Navegación y apertura por teclado.
   *
   * `react-day-picker` sólo gestiona las flechas, `Home`/`End` y
   * `PageUp`/`PageDown`; no abre el día con `Enter` ni con `Espacio`. Además,
   * al abrir y cerrar el popover el foco puede quedar fuera de la grilla, por
   * lo que el movimiento entre celdas se resuelve aquí de forma explícita
   * (WCAG 2.1.1 y 2.4.3).
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    // La librería gestiona las flechas, `Home`/`End` y `PageUp`/`PageDown`;
    // su handler siempre se ejecuta.
    onKeyDown?.(event);

    if (event.key !== "Enter" && event.key !== " ") return;

    // Se evita el click nativo del botón para no abrir y cerrar a la vez; el
    // popover se abre con el click disparado sobre su propio trigger, que es
    // lo que Base UI necesita para asociarlo y posicionarlo.
    event.preventDefault();
    event.stopPropagation();
    buttonRef.current?.click();
  };

  const content = (
    <>
      <span className="flex w-full items-center gap-1.5 px-1.5 pt-1">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-medium tabular-nums",
            isToday && "bg-primary text-primary-foreground",
            !isToday && isOutside && "text-muted-foreground/60",
            !isToday && !isOutside && "text-foreground",
          )}
        >
          {day.date.getDate()}
        </span>
        {summary.totalHours > 0 && (
          <span className="font-mono text-[11px] font-semibold tabular-nums text-muted-foreground">
            {formatHoursHM(summary.totalHours)}
          </span>
        )}
      </span>

      {summary.extraHours > 0 && (
        <span className="px-1.5 text-[10px] font-semibold tabular-nums text-primary">
          +{formatHoursHM(summary.extraHours)} extra
        </span>
      )}

      {entries.length > 0 && (
        <span className="flex w-full flex-col gap-0.5 px-1.5 pb-1.5">
          {entries.slice(0, MAX_BARS).map((entry) => (
            <span
              key={entry.id}
              aria-hidden="true"
              className="h-1 w-full rounded-full"
              style={{ backgroundColor: colorForConcept(entry.concept) }}
            />
          ))}
          {entries.length > MAX_BARS && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              +{entries.length - MAX_BARS}
            </span>
          )}
        </span>
      )}
    </>
  );

  const cellClassName = cn(
    "relative isolate z-10 flex size-auto w-full min-w-(--cell-size) min-h-16 flex-col items-stretch gap-1 border-0 p-0 leading-none font-normal sm:min-h-20",
    "rounded-(--cell-radius) text-left transition-colors",
    "hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    isWorkingDay ? "" : "bg-muted/30",
    isOpen && "bg-muted ring-1 ring-ring",
    className,
  );

  // En escritorio el detalle se abre en un popover anclado a la celda.
  // popover se controla desde el estado (`openDate`), de modo que el teclado
  // y el ratón.doi abrirlo exactamente igual.
  if (isDesktop) {
    return (
      <Popover
        open={isOpen}
        onOpenChange={(open, details) => {
          // Al abrir, el foco pasa al contenido del popover y Base UI lo
          // interpretaría como un dismissal (`focusOut`), que lo cerraría al
          // instante. Se ignora ese motivo.
          if (!open && details.reason === "focus-out") return;

          // Actualización funcional: al cambiar de día, el cierre del popover
          // anterior no debe borrar la fecha recién abierta.
          setOpenDate((current) =>
            open ? date : current === date ? null : current,
          );
        }}
      >
        <PopoverTrigger
          ref={buttonRef}
          className={cellClassName}
          onClick={() => setOpenDate(date)}
          onKeyDown={handleKeyDown}
          {...buttonProps}
        >
          {content}
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="center"
          sideOffset={6}
          className="w-[340px] p-4"
          finalFocus={buttonRef}
        >
          <DayPopoverContent
            userId={userId}
            profileType={profileType}
            date={date}
            entries={entries}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // En móvil el detalle se abre en una hoja inferior que se renderiza una
  // sola vez en `calendar-view` (fuera de la tabla); aquí sólo se marca la
  // fecha abierta.
  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={(event) => {
        onClick?.(event);
        setOpenDate(date);
      }}
      onKeyDown={handleKeyDown}
      className={cellClassName}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
