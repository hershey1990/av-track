"use client";

import { useMemo, type ReactNode } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeriodSummaryDayRow } from "./period-summary-day-row";
import {
  calcPeriodSummary,
  formatCurrency,
  formatDurationHMS,
  formatHours,
} from "@/lib/calculations";
import { formatMonthYear } from "@/lib/timezone";
import type {
  DayCalculation,
  EmploymentType,
  Holiday,
  PolicyConfig,
  TimeEntry,
} from "@/types";

interface Props {
  entries: TimeEntry[];
  type: EmploymentType;
  viaticoRate: number;
  /** Política de recargos del país (activa nocturnos, dominicales y feriados) */
  policy?: PolicyConfig;
  /** Feriados del país (activa el recargo de feriado) */
  holidays?: Holiday[];
  /** Título de la sección */
  title?: string;
  /** Mensaje mostrado cuando no hay registros */
  emptyMessage?: string;
  /** Acción del encabezado (reemplaza el botón de filtro por defecto) */
  headerAction?: ReactNode;
  /** Acciones por fila (editar / borrar) */
  renderActions?: (day: DayCalculation) => ReactNode;
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
export function PeriodSummarySections({
  entries,
  type,
  viaticoRate,
  policy,
  holidays,
  title = "Resumen del período",
  emptyMessage = "Sin registros en este período",
  headerAction,
  renderActions,
}: Props) {
  const summary = useMemo(
    () => calcPeriodSummary(entries, type, viaticoRate, policy, holidays),
    [entries, type, viaticoRate, policy, holidays],
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

  /** Nº de registros por fecha y ordinal de cada uno dentro de su día. */
  const slots = useMemo(() => {
    const countByDate = new Map<string, number>();
    const ordinalByKey = new Map<string, number>();
    const seen = new Map<string, number>();

    for (const day of summary.days) {
      countByDate.set(day.date, (countByDate.get(day.date) ?? 0) + 1);
      const next = (seen.get(day.date) ?? 0) + 1;
      seen.set(day.date, next);
      ordinalByKey.set(dayKey(day), next);
    }

    return { countByDate, ordinalByKey };
  }, [summary.days]);

  if (summary.days.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <section>
      {/* Encabezado — mismo patrón que "Hoy" / "Ayer" */}
      <div className="flex items-center justify-between gap-4 pb-3">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
            {formatDurationHMS(summary.total_hours * 3600)}
          </span>
          {headerAction ?? (
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-md"
              title="Filtrar registros"
              aria-label="Filtrar el resumen del período"
            >
              <ListFilter className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
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
              <PeriodSummaryDayRow
                key={dayKey(day)}
                day={day}
                slotCount={slots.countByDate.get(day.date) ?? 1}
                slotIndex={slots.ordinalByKey.get(dayKey(day))}
                actions={renderActions?.(day)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/** Clave única por registro (puede haber varios registros en la misma fecha). */
function dayKey(day: DayCalculation): string {
  return day.entry_id ?? `${day.date}-${day.start_time}-${day.end_time}`;
}
