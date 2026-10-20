"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptColorVar } from "@/features/reports/concept-color";
import type { BreakdownRow } from "@/features/reports/aggregation";
import { ChartEmptyState } from "./hours-by-day-chart";

interface Props {
  data: BreakdownRow[];
  /** Máximo de barras a mostrar; el resto se agrupa en "Otros". */
  limit?: number;
}

/**
 * Barras horizontales con las horas por concepto.
 *
 * Si hay más conceptos que `limit`, los últimos se agrupan en una fila
 * "Otros" para que el gráfico siga siendo legible.
 */
export function ConceptBreakdownChart({ data, limit = 8 }: Props) {
  const rows = data.filter((row) => row.hours > 0);
  const hasData = rows.length > 0;

  const chartData = hasData
    ? rows.length > limit
      ? [
          ...rows.slice(0, limit).map((row) => ({
            key: row.key,
            label: row.label,
            hours: row.hours,
            color: conceptColorVar(row.label),
          })),
          {
            key: "__other__",
            label: `Otros (${rows.length - limit})`,
            hours: rows.slice(limit).reduce((sum, row) => sum + row.hours, 0),
            color: "var(--muted-foreground)",
          },
        ]
      : rows.map((row) => ({
          key: row.key,
          label: row.label,
          hours: row.hours,
          color: conceptColorVar(row.label),
        }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas por concepto</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={{}} className="h-[280px] w-full aspect-auto">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={110}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">Horas</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toFixed(2)}h
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            title="Sin horas registradas"
            hint="Registrá tiempo para ver el desglose por concepto"
          />
        )}
      </CardContent>
    </Card>
  );
}
