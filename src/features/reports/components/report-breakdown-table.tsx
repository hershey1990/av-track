"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatHours } from "@/lib/calculations";
import { conceptColorVar } from "@/features/reports/concept-color";
import type {
  BreakdownGrouping,
  BreakdownRow,
} from "@/features/reports/aggregation";

const GROUPING_LABELS: Record<BreakdownGrouping, string> = {
  concept: "Concepto",
  day: "Día",
  month: "Mes",
};

interface Props {
  rows: BreakdownRow[];
  grouping: BreakdownGrouping;
  onGroupingChange: (grouping: BreakdownGrouping) => void;
}

/**
 * Tabla de desglose con las horas del período agrupadas por concepto, día o
 * mes. Incluye la participación de cada fila sobre el total.
 */
export function ReportBreakdownTable({
  rows,
  grouping,
  onGroupingChange,
}: Props) {
  const totalHours = rows.reduce((sum, row) => sum + row.hours, 0);
  const totalExtra = rows.reduce((sum, row) => sum + row.extraHours, 0);
  const totalViatico = rows.reduce((sum, row) => sum + row.viatico, 0);
  const totalEntries = rows.reduce((sum, row) => sum + row.entryCount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Desglose</CardTitle>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Desglosar por:</span>
          <Select
            items={(Object.keys(GROUPING_LABELS) as BreakdownGrouping[]).map(
              (key) => ({ value: key, label: GROUPING_LABELS[key] }),
            )}
            value={grouping}
            onValueChange={(value) =>
              value && onGroupingChange(value as BreakdownGrouping)
            }
          >
            <SelectTrigger size="sm" className="w-auto min-w-[7rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concept">Concepto</SelectItem>
              <SelectItem value="day">Día</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin registros en este período
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Horas</TableHead>
                <TableHead className="text-right">Horas extra</TableHead>
                <TableHead className="text-right">Viático</TableHead>
                <TableHead className="text-right">Registros</TableHead>
                <TableHead className="w-[22%]">% del total</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: conceptColorVar(row.label) }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.label}</div>
                        {row.hint && (
                          <div className="text-xs text-muted-foreground">
                            {row.hint}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatHours(row.hours)}h
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {row.extraHours > 0
                      ? `+${formatHours(row.extraHours)}h`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {row.viatico > 0 ? formatCurrency(row.viatico) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {row.entryCount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, row.sharePct)}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {row.sharePct.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums">
                  {formatHours(totalHours)}h
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums">
                  {totalExtra > 0 ? `+${formatHours(totalExtra)}h` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums">
                  {totalViatico > 0 ? formatCurrency(totalViatico) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums">
                  {totalEntries}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
