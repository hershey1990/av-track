"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailySeriesPoint } from "@/features/reports/aggregation";

const CHART_CONFIG = {
  standard: {
    label: "Horas estándar",
    color: "var(--chart-2)",
  },
  extra: {
    label: "Horas extra",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface Props {
  data: DailySeriesPoint[];
}

/**
 * Gráfico de horas por día del período, apilando horas estándar y horas
 * extra. Cuando el período no tiene registros se muestra el estado vacío
 * en lugar de un gráfico en blanco.
 */
export function HoursByDayChart({ data }: Props) {
  const hasData = data.some((point) => point.totalHours > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas por día</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer
            config={CHART_CONFIG}
            className="h-[280px] w-full aspect-auto"
          >
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              barCategoryGap="18%"
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as
                        | DailySeriesPoint
                        | undefined;
                      return point ? point.fullLabel : "";
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {CHART_CONFIG[name as keyof typeof CHART_CONFIG]
                            ?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toFixed(2)}h
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="standardHours"
                name="standard"
                stackId="hours"
                fill="var(--color-standard)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="extraHours"
                name="extra"
                stackId="hours"
                fill="var(--color-extra)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartEmptyState
            title="Sin horas registradas"
            hint="Registrá tiempo para ver el desglose del período"
          />
        )}
      </CardContent>
    </Card>
  );
}

/** Estado vacío compartido por los gráficos del reporte. */
export function ChartEmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
