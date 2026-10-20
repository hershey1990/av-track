"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { usePeriods } from "@/features/reports/hooks/use-periods";
import { usePeriodEntries } from "@/features/time-entries/hooks/use-entries";
import { PeriodSummarySections } from "@/features/reports/components/period-summary-sections";
import { ExcelExport } from "@/features/reports/components/excel-export";
import { PdfExport } from "@/features/reports/components/pdf-export";
import { ApprovalPanel } from "@/features/reports/components/approval-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generatePeriodDays } from "@/lib/calculations";
import { formatDateFull } from "@/lib/timezone";

export default function ReportPage() {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);
  const { data: periods } = usePeriods();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const { data: entries } = usePeriodEntries(
    user?.id,
    selectedPeriodId ?? undefined,
  );

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId);

  const allPeriodDays = useMemo(
    () =>
      entries && selectedPeriod && profile
        ? generatePeriodDays(
            entries,
            selectedPeriod.start_date,
            selectedPeriod.end_date,
            profile.type,
            profile.viatico,
          )
        : null,
    [entries, selectedPeriod, profile],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            items={(periods ?? []).map((p) => ({ value: p.id, label: p.name }))}
            value={selectedPeriodId ?? null}
            onValueChange={setSelectedPeriodId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí un período..." />
            </SelectTrigger>
            <SelectContent>
              {periods?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} {p.is_locked ? "(🔒)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPeriod && (
            <p className="text-sm text-muted-foreground">
              {formatDateFull(selectedPeriod.start_date)} —{" "}
              {formatDateFull(selectedPeriod.end_date)}
            </p>
          )}
        </CardContent>
      </Card>

      {entries && profile && selectedPeriod && allPeriodDays && (
        <>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-semibold text-foreground">
              {selectedPeriod.name}
            </h2>
            <div className="flex gap-2">
              <ExcelExport
                days={allPeriodDays!}
                period={selectedPeriod}
                profile={profile}
              />
              <PdfExport
                days={allPeriodDays!}
                period={selectedPeriod}
                profile={profile}
              />
            </div>
          </div>

          <PeriodSummarySections
            entries={entries}
            type={profile.type}
            viaticoRate={profile.viatico}
          />
          <ApprovalPanel period={selectedPeriod} />
        </>
      )}

      {!selectedPeriodId && (
        <p className="text-muted-foreground text-center py-8">
          Seleccioná un período para ver el reporte
        </p>
      )}
    </div>
  );
}
