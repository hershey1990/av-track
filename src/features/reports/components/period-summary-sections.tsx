"use client";

import { useMemo } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calcPeriodSummary,
  formatCurrency,
  formatDurationHMS,
  formatHours,
  formatTime,
} from "@/lib/calculations";
import { formatDateShort, formatMonthYear } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import type { DayCalculation, EmploymentType, TimeEntry } from "@/types";

interface Props {
  entries: TimeEntry[];
  type: EmploymentType;
  viaticoRate: number;
}

/** Un día del período, con su mes para agrupar en secciones. */
interface MonthGroup {
  key: string;
  label: string;
  days: DayCalculation[];
}

/**
 * Resumen del período con el mismo lenguaje visual que las secciones
 * "Hoy / Ayer": encabezado con el total a la derecha y filas separadas
 * por filetes dentro de un contenedor con borde.
 */
export function PeriodSummarySections({ entries, type, viaticoRate }: Props) {
  const summary = useMemo(
    () => calcPeriodSummary(entries, type, viaticoRate),
    [entries, type, viaticoRate],
  );

  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, DayCalculation[]>();

    for (const day of summary.days) {
      const key = day.date.slice(0, 7); // yyyy-mm
      const bucket = map.get(key);
      if (bucket) bucket.push(day);
      else map.set(key, [day]);
    }

    return [...map.entries()].map(([key, days]) => ({
      key,
      label: formatMonthYear(days[0].date),
      days,
    }));
  }, [summary.days]);

  if (summary.days.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-muted-foreground">
        Sin registros en este período
      </p>
    );
  }

  return (
    <section>
      {/* Encabezado — mismo patrón que "Hoy" / "Ayer" */}
      <div className="flex items-center justify-between gap-4 pb-3">
        <h2 className="text-[15px] font-semibold text-foreground">
          Resumen del período
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
            {formatDurationHMS(summary.total_hours * 3600)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-md"
            title="Filtrar registros"
            aria-label="Filtrar el resumen del período"
          >
            <ListFilter className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Totales del período */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pb-3 text-[13px] text-muted-foreground">
        <span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatHours(summary.total_extra_hours)}h
          </span>{" "}
          extra
        </span>
        <span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrency(summary.total_viatico)}
          </span>{" "}
          viático
        </span>
        <span>
          <span className="font-semibold tabular-nums text-foreground">
            {summary.days_with_viatico}
          </span>{" "}
          días con viático
        </span>
      </div>

      {/* Secciones por mes */}
      {groups.map((group) => (
        <div key={group.key} className="mt-4 first:mt-0">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <span className="font-mono text-[13px] tabular-nums text-muted-foreground">
              {formatDurationHMS(
                group.days.reduce((sum, day) => sum + day.hours, 0) * 3600,
              )}
            </span>
          </div>

          <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/8">
            {group.days.map((day) => (
              <DayRow key={day.date} day={day} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function DayRow({ day }: { day: DayCalculation }) {
  const hasExtra = day.extra_hours > 0;
  const title = day.concept?.trim() || "Registro";

  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-muted/40">
      {/* Fecha */}
      <span className="w-[52px] shrink-0 font-mono text-[13px] tabular-nums text-muted-foreground">
        {formatDateShort(day.date)}
      </span>

      {/* Concepto */}
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
        {title}
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
    </div>
  );
}
