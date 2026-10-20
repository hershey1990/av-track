"use client";

import * as React from "react";
import { ClockIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Selector de hora en formato "HH:MM", en lugar del `<input type="time">`
 * nativo.
 *
 * Motivo: igual que el input de fecha, el de hora delega en el widget del
 * sistema operativo, no se puede estilar y su aspecto varía por navegador.
 * Aquí se sustituye por un popover con dos columnas (hora y minuto) que
 * mantiene el look de la app y es más rápido de usar con ratón.
 *
 * El valor sigue siendo el string "HH:MM" que espera la BD.
 */

interface TimePickerProps {
  /** Hora seleccionada en formato "HH:MM" (24 h, sin segundos). */
  value?: string;
  /** Se dispara con el nuevo valor "HH:MM" (o `undefined` al limpiar). */
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Se marca el input como inválido (validación de formularios). */
  "aria-invalid"?: boolean;
  /** Separación entre los minutos seleccionables (15 por defecto). */
  minuteStep?: number;
}

export function TimePicker({
  value,
  onValueChange,
  placeholder = "Elegí una hora",
  id,
  disabled,
  className,
  "aria-invalid": ariaInvalid,
  minuteStep = 15,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [hour, setHour] = React.useState<string>(
    () => value?.slice(0, 2) ?? "",
  );
  const [minute, setMinute] = React.useState<string>(
    () => value?.slice(3, 5) ?? "",
  );

  // Si el valor cambia desde fuera (p. ej. al editar otra entrada), se
  // sincroniza la selección interna.
  React.useEffect(() => {
    setHour(value?.slice(0, 2) ?? "");
    setMinute(value?.slice(3, 5) ?? "");
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) =>
    String(i * minuteStep).padStart(2, "0"),
  );

  const commit = (nextHour: string, nextMinute: string) => {
    onValueChange?.(`${nextHour}:${nextMinute}`);
  };

  const handlePickHour = (nextHour: string) => {
    setHour(nextHour);
    // Si ya había un minuto, se completa la hora y se cierra.
    if (minute) {
      commit(nextHour, minute);
      setOpen(false);
    }
  };

  const handlePickMinute = (nextMinute: string) => {
    setMinute(nextMinute);
    if (hour) {
      commit(hour, nextMinute);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* El trigger usa `className` directo (y no `render={<Button/>}`): el
          `Button` de shadcn ya es un primitive de Base UI y, anidado dentro
          de otro primitive, no recibe el `onClick` del trigger. */}
      <PopoverTrigger
        type="button"
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-full justify-start gap-2 px-3 font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <ClockIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-mono tabular-nums">
          {value ?? placeholder}
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-3" sideOffset={4}>
        <div className="flex gap-3">
          <div className="space-y-1">
            <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Hora
            </p>
            <div className="h-56 w-16 overflow-y-auto rounded-md border border-border">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handlePickHour(h)}
                  className={cn(
                    "block w-full px-2 py-1.5 text-left font-mono text-sm tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground",
                    hour === h &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Minuto
            </p>
            <div className="h-56 w-16 overflow-y-auto rounded-md border border-border">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handlePickMinute(m)}
                  className={cn(
                    "block w-full px-2 py-1.5 text-left font-mono text-sm tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground",
                    minute === m &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
