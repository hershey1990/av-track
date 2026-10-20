"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { usePeriods } from "@/features/reports/hooks/use-periods";
import {
  usePeriodEntries,
  useEntries,
} from "@/features/time-entries/hooks/use-entries";
import { DashboardKpiCards } from "@/features/time-entries/components/dashboard-kpi";
import { TimelineChart } from "@/features/time-entries/components/timeline-chart";
import { EntriesList } from "@/features/time-entries/components/entries-list";
import { PeriodSummarySections } from "@/features/reports/components/period-summary-sections";
import { calcPeriodSummary } from "@/lib/calculations";
import {
  formatDayMonthShort,
  getTodayNicaragua,
  shiftDate,
} from "@/lib/timezone";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);
  const { data: periods } = usePeriods();
  const activePeriod = periods?.[0];
  const { data: entries } = usePeriodEntries(user?.id, activePeriod?.id);

  const today = getTodayNicaragua();
  const [selectedDate, setSelectedDate] = useState(today);

  // Rango que cubre el día seleccionado y el anterior (para el grupo "Ayer").
  const rangeFrom = shiftDate(selectedDate, -1);
  const { data: recentEntries } = useEntries(user?.id, rangeFrom, selectedDate);

  const selectedEntries = useMemo(
    () => (recentEntries ?? []).filter((e) => e.date === selectedDate),
    [recentEntries, selectedDate],
  );

  const summary = useMemo(
    () =>
      entries && profile
        ? calcPeriodSummary(entries, profile.type, profile.viatico)
        : null,
    [entries, profile],
  );

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile?.full_name ? `Hola, ${profile.full_name}` : "Hoy"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {activePeriod
            ? `Período activo: ${activePeriod.name}`
            : "Sin período activo"}
        </p>
      </div>

      {profile && (
        <>
          {/* KPIs */}
          <DashboardKpiCards
            userId={user.id}
            profileType={profile.type}
            viaticoRate={profile.viatico}
            periodTotalHours={summary?.total_hours}
            periodTotalExtraHours={summary?.total_extra_hours}
          />

          {/* Línea de tiempo + registros del día */}
          <div className="space-y-6">
            <TimelineChart
              entries={selectedEntries}
              dateLabel={formatDayMonthShort(selectedDate)}
              isToday={selectedDate === today}
              onPrev={() => setSelectedDate((d) => shiftDate(d, -1))}
              onNext={() => setSelectedDate((d) => shiftDate(d, 1))}
            />

            <EntriesList
              entries={recentEntries ?? []}
              selectedDate={selectedDate}
              today={today}
              profileType={profile.type}
            />
          </div>

          <div className="border-t border-border" />

          {/* Resumen del período */}
          {activePeriod && entries && (
            <PeriodSummarySections
              entries={entries}
              type={profile.type}
              viaticoRate={profile.viatico}
            />
          )}
        </>
      )}
    </div>
  );
}
