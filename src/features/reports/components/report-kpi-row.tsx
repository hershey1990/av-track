"use client";

import { Clock, Zap, Banknote, CalendarDays } from "lucide-react";
import { formatCurrency, formatHours } from "@/lib/calculations";
import type { SummaryKpis } from "@/features/reports/aggregation";

interface Props {
  kpis: SummaryKpis;
  /** ¿Hay datos en el período? (si no, cada celda muestra "—"). */
  hasData: boolean;
}

/**
 * Franja de indicadores del reporte, al estilo de Toggle: una sola tarjeta
 * con cuatro celdas separadas por divisores verticales.
 */
export function ReportKpiRow({ kpis, hasData }: Props) {
  const cells = [
    {
      label: "Horas registradas",
      value: hasData ? `${formatHours(kpis.totalHours)}h` : "—",
      hint: hasData
        ? `${kpis.workingDays} ${kpis.workingDays === 1 ? "día laborado" : "días laborados"}`
        : "Sin registros",
      icon: Clock,
    },
    {
      label: "Horas extra",
      value: hasData ? `+${formatHours(kpis.extraHours)}h` : "—",
      hint: hasData
        ? `${kpis.extraPct.toFixed(1)}% del total`
        : "Sin registros",
      icon: Zap,
    },
    {
      label: "Viático",
      value: hasData ? formatCurrency(kpis.totalViatico) : "—",
      hint: hasData ? "Total del período" : "Sin registros",
      icon: Banknote,
    },
    {
      label: "Promedio diario",
      value: hasData ? `${formatHours(kpis.avgDailyHours)}h` : "—",
      hint: hasData ? "Por día laborado" : "Sin registros",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border ring-1 ring-foreground/8 lg:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="bg-card p-4">
          <div className="flex items-center gap-1.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <cell.icon className="h-3.5 w-3.5" />
            {cell.label}
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {cell.value}
          </div>
          <div className="text-xs leading-tight text-muted-foreground">
            {cell.hint}
          </div>
        </div>
      ))}
    </div>
  );
}
