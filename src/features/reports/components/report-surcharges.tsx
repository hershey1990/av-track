"use client";

import { Moon, PartyPopper, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHours } from "@/lib/calculations";
import type { DayCalculation, PolicyConfig } from "@/types";

interface Props {
  /** Días del período (con los recargos ya calculados). */
  days: DayCalculation[];
  /** Política de recargos del país. */
  policy: PolicyConfig | null;
}

/**
 * Recargos legales del período.
 *
 * Muestra lo que la política del país suma por encima del salario: horas
 * nocturnas, dominicales y —la más importante— el recargo de feriado, que
 * hace que las horas trabajadas en un festivo se paguen al doble.
 */
export function ReportSurcharges({ days, policy }: Props) {
  const totals = days.reduce(
    (acc, day) => {
      acc.nightHours += day.night_hours;
      acc.nightSurcharge += day.night_surcharge;
      acc.sundayHours += day.sunday_hours;
      acc.sundaySurcharge += day.sunday_surcharge;
      acc.holidayHours += day.holiday_hours;
      acc.holidaySurcharge += day.holiday_surcharge;
      if (day.is_holiday) acc.holidayDays += 1;
      return acc;
    },
    {
      nightHours: 0,
      nightSurcharge: 0,
      sundayHours: 0,
      sundaySurcharge: 0,
      holidayHours: 0,
      holidaySurcharge: 0,
      holidayDays: 0,
    },
  );

  const hasSurcharges =
    totals.nightSurcharge > 0 ||
    totals.sundaySurcharge > 0 ||
    totals.holidaySurcharge > 0;

  if (!policy || !hasSurcharges) return null;

  const cells = [
    {
      icon: PartyPopper,
      label: "Recargo de feriado",
      hours: totals.holidayHours,
      surcharge: totals.holidaySurcharge,
      pct: policy.holiday_surcharge_pct,
      hint:
        totals.holidayDays === 1
          ? "1 día festivo trabajado"
          : `${totals.holidayDays} días festivos trabajados`,
    },
    {
      icon: Sun,
      label: "Recargo dominical",
      hours: totals.sundayHours,
      surcharge: totals.sundaySurcharge,
      pct: policy.sunday_surcharge_pct,
      hint: "Horas trabajadas en domingo",
    },
    {
      icon: Moon,
      label: "Recargo nocturno",
      hours: totals.nightHours,
      surcharge: totals.nightSurcharge,
      pct: policy.night_surcharge_pct,
      hint: `De ${policy.night_start.slice(0, 5)} a ${policy.night_end.slice(0, 5)}`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recargos legales</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="pb-4 text-sm text-muted-foreground">
          Horas que la política del país paga por encima de la jornada
          normal. En los feriados las horas se pagan al doble.
        </p>

        <div className="grid gap-px overflow-hidden rounded-lg bg-border ring-1 ring-foreground/8 sm:grid-cols-3">
          {cells.map((cell) => (
            <div key={cell.label} className="bg-card p-4">
              <div className="flex items-center gap-1.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <cell.icon className="h-3.5 w-3.5" />
                {cell.label}
              </div>
              <div className="text-2xl font-semibold tracking-tight tabular-nums">
                +{formatHours(cell.surcharge)}h
              </div>
              <div className="text-xs leading-tight text-muted-foreground">
                {formatHours(cell.hours)}h con +{cell.pct}% · {cell.hint}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
