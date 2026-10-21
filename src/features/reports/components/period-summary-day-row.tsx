"use client";

import type { ReactNode } from "react";
import {
  PartyPopper,
} from "lucide-react";
import {
  formatCurrency,
  formatDurationHMS,
  formatHours,
  formatTime,
} from "@/lib/calculations";
import { formatDateShort } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { DayCalculation } from "@/types";

interface Props {
  day: DayCalculation;
  /** Nº de registros del mismo día */
  slotCount?: number;
  /** Ordinal (1-based) del registro dentro del día */
  slotIndex?: number;
  /** Acciones a la derecha de la fila (editar / borrar) */
  actions?: ReactNode;
}

/**
 * Fila del "Resumen del período". Mismo lenguaje visual que las secciones
 * "Hoy / Ayer" de `EntriesList`.
 */
export function PeriodSummaryDayRow({
  day,
  slotCount,
  slotIndex,
  actions,
}: Props) {
  const hasExtra = day.extra_hours > 0;
  const title = day.concept?.trim() || "Registro";
  const showSlot = (slotCount ?? 0) > 1;
  const slot =
    slotIndex ?? (day.slot_index != null ? day.slot_index + 1 : slotCount);

  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-muted/40">
      {/* Fecha */}
      <span className="w-[52px] shrink-0 font-mono text-[13px] tabular-nums text-muted-foreground">
        {formatDateShort(day.date)}
      </span>

      {/* Concepto */}
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
        {title}
        {showSlot && (
          <span className="ml-2 font-mono text-[11px] tabular-nums text-muted-foreground">
            #{slot}
          </span>
        )}
        {/* El festivo se muestra aparte: explica por qué ese día se paga doble. */}
        {day.is_holiday && (
          <Badge variant="secondary" className="ml-2 align-middle">
            <PartyPopper data-icon="inline-start" />
            {day.holiday_name ?? "Feriado"}
            {holidayMultiplier(day) && (
              <span className="ml-1 font-mono tabular-nums">
                ×{holidayMultiplier(day)}
              </span>
            )}
          </Badge>
        )}
      </span>

      {/* Etiqueta de estado */}
      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            hasExtra ? "bg-chart-1" : "bg-chart-2",
          )}
        />
        <span
          className={cn(
            "text-[13px]",
            hasExtra ? "text-chart-1" : "text-chart-2",
          )}
        >
          {hasExtra ? "Horas extra" : "Regular"}
        </span>
      </span>

      {/* Horas extra */}
      <span className="w-[62px] shrink-0 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
        {hasExtra ? `+${formatHours(day.extra_hours)}h` : "—"}
      </span>

      {/* Viático */}
      <span className="w-[86px] shrink-0 text-right text-[13px] font-semibold tabular-nums text-chart-1">
        {day.viatico ? formatCurrency(day.viatico_amount) : "—"}
      </span>

      {/* Rango horario */}
      <span className="hidden shrink-0 font-mono text-[13px] tabular-nums text-foreground sm:inline">
        {formatTime(day.start_time)} - {formatTime(day.end_time)}
      </span>

      {/* Duración */}
      <span className="w-[68px] shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-foreground">
        {formatDurationHMS(day.hours * 3600)}
      </span>

      {/* Acciones */}
      {actions && (
        <span className="flex shrink-0 items-center gap-1">{actions}</span>
      )}
    </div>
  );
}

/**
 * Multiplicador de pago del festivo (×2 con un recargo del 100%), deducido
 * de los propios datos del día.
 */
function holidayMultiplier(day: DayCalculation): string | null {
  if (day.holiday_hours <= 0 || day.holiday_surcharge <= 0) return null;
  const pct = (day.holiday_surcharge / day.holiday_hours) * 100;
  const multiplier = (100 + pct) / 100;
  return Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(2);
}
