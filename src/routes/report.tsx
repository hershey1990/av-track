"use client";

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, CalendarX2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { usePeriods } from "@/features/reports/hooks/use-periods";
import {
  usePeriodEntries,
  useDeleteEntry,
} from "@/features/time-entries/hooks/use-entries";
import { EntryEditDialog } from "@/features/time-entries/components/entry-edit-dialog";
import { PeriodSummarySections } from "@/features/reports/components/period-summary-sections";
import { ExcelExport } from "@/features/reports/components/excel-export";
import { PdfExport } from "@/features/reports/components/pdf-export";
import { ApprovalPanel } from "@/features/reports/components/approval-panel";
import { ReportToolbar } from "@/features/reports/components/report-toolbar";
import { ReportKpiRow } from "@/features/reports/components/report-kpi-row";
import { HoursByDayChart } from "@/features/reports/components/hours-by-day-chart";
import { ConceptBreakdownChart } from "@/features/reports/components/concept-breakdown-chart";
import { ReportBreakdownTable } from "@/features/reports/components/report-breakdown-table";
import { BreakdownExcelExport } from "@/features/reports/components/breakdown-excel-export";
import {
  buildBreakdown,
  buildDailySeries,
  computeSummaryKpis,
  type BreakdownGrouping,
} from "@/features/reports/aggregation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TabsList, TabsPanel, TabsRoot, TabsTab } from "@/components/ui/tabs";
import { generatePeriodDays } from "@/lib/calculations";
import type { DayCalculation, EmploymentType, TimeEntry } from "@/types";

/** Identificadores de las pestañas del reporte. */
const TABS = {
  summary: "summary",
  breakdown: "breakdown",
  entries: "entries",
} as const;

export default function ReportPage() {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);
  const { data: periodsData } = usePeriods();

  const periods = useMemo(() => periodsData ?? [], [periodsData]);

  // Por defecto se abre el período más reciente (el activo). El usuario puede
  // cambiarlo con el selector o con las flechas de la barra de herramientas.
  const [periodOverride, setPeriodOverride] = useState<string | null>(null);
  const [tab, setTab] = useState<string>(TABS.summary);
  const [grouping, setGrouping] = useState<BreakdownGrouping>("concept");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [conceptFilter, setConceptFilter] = useState<string>("all");
  const [hideEmptyDays, setHideEmptyDays] = useState(false);

  const selectedPeriodId = periodOverride ?? periods[0]?.id ?? null;
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  const { data: entries } = usePeriodEntries(
    user?.id,
    selectedPeriodId ?? undefined,
  );

  // Días completos del período (incluye los días "Off" sin registros).
  const periodDays = useMemo(
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

  /** Conceptos presentes en el período (para el filtro de la barra). */
  const concepts = useMemo(() => {
    const set = new Set<string>();
    for (const day of periodDays ?? []) {
      if (day.hours > 0) set.add(day.concept || "Sin concepto");
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [periodDays]);

  /** Días del período tras aplicar los filtros de la barra de herramientas. */
  const filteredDays = useMemo(() => {
    if (!periodDays) return null;
    return periodDays.filter((day) => {
      if (conceptFilter !== "all") {
        const label = day.concept || "Sin concepto";
        if (label !== conceptFilter) return false;
      }
      if (hideEmptyDays && day.hours <= 0) return false;
      return true;
    });
  }, [periodDays, conceptFilter, hideEmptyDays]);

  const daily = useMemo(
    () =>
      filteredDays && profile
        ? buildDailySeries(filteredDays, profile.type)
        : [],
    [filteredDays, profile],
  );

  const breakdown = useMemo(
    () =>
      filteredDays && profile
        ? buildBreakdown(filteredDays, grouping, profile.type)
        : [],
    [filteredDays, grouping, profile],
  );

  const kpis = useMemo(
    () =>
      filteredDays && profile
        ? computeSummaryKpis(filteredDays, profile.type)
        : null,
    [filteredDays, profile],
  );

  // Navegación entre períodos: la lista viene ordenada del más reciente al
  // más antiguo, así que el período anterior es el siguiente índice.
  const currentIndex = periods.findIndex((p) => p.id === selectedPeriodId);
  const hasPrev = currentIndex >= 0 && currentIndex < periods.length - 1;
  const hasNext = currentIndex > 0;

  const goToPrevPeriod = () => {
    if (!hasPrev) return;
    setPeriodOverride(periods[currentIndex + 1].id);
  };

  const goToNextPeriod = () => {
    if (!hasNext) return;
    setPeriodOverride(periods[currentIndex - 1].id);
  };

  const entriesById = useMemo(() => {
    const map = new Map<string, TimeEntry>();
    for (const entry of entries ?? []) map.set(entry.id, entry);
    return map;
  }, [entries]);

  const renderActions = (day: DayCalculation) => {
    if (!day.entry_id || !profile) return null;
    const entry = entriesById.get(day.entry_id);
    if (!entry) return null;

    return <ReportRowActions entry={entry} profileType={profile.type} />;
  };

  // ── Sin períodos configurados ──────────────────────────────
  if (periods.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>

        <Card>
          <CardHeader>
            <CardTitle>Sin períodos de reporte</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CalendarX2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no hay ningún período configurado. Creá uno para poder ver
              tus reportes.
            </p>
            {profile?.role === "admin" && (
              <Button render={<Link to="/admin/periods" />}>
                Crear período
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado + pestañas */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>

        <TabsRoot
          value={tab}
          onValueChange={(value) => value && setTab(value as string)}
        >
          <TabsList>
            <TabsTab value={TABS.summary}>Resumen</TabsTab>
            <TabsTab value={TABS.breakdown}>Desglose</TabsTab>
            <TabsTab value={TABS.entries}>Registros</TabsTab>
          </TabsList>

          {/* ── Barra de herramientas ───────────────────────── */}
          <div className="flex flex-col gap-3">
            <ReportToolbar
              periods={periods}
              selectedPeriodId={selectedPeriodId}
              onSelectPeriod={setPeriodOverride}
              onPrevPeriod={goToPrevPeriod}
              onNextPeriod={goToNextPeriod}
              hasPrev={hasPrev}
              hasNext={hasNext}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((v) => !v)}
              filters={
                <div className="flex flex-wrap items-end gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="report-concept">Concepto</Label>
                    <Select
                      items={[
                        { value: "all", label: "Todos los conceptos" },
                        ...concepts.map((c) => ({ value: c, label: c })),
                      ]}
                      value={conceptFilter}
                      onValueChange={(value) =>
                        value && setConceptFilter(value)
                      }
                    >
                      <SelectTrigger
                        id="report-concept"
                        size="sm"
                        className="w-56"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los conceptos</SelectItem>
                        {concepts.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pb-1.5">
                    <Switch
                      id="report-hide-empty"
                      checked={hideEmptyDays}
                      onCheckedChange={setHideEmptyDays}
                    />
                    <Label htmlFor="report-hide-empty" className="text-sm">
                      Ocultar días sin horas
                    </Label>
                  </div>
                </div>
              }
              actions={
                periodDays && selectedPeriod && profile ? (
                  <>
                    <BreakdownExcelExport
                      rows={breakdown}
                      daily={daily}
                      period={selectedPeriod}
                      profile={profile}
                    />
                    <ExcelExport
                      days={periodDays}
                      period={selectedPeriod}
                      profile={profile}
                    />
                    <PdfExport
                      days={periodDays}
                      period={selectedPeriod}
                      profile={profile}
                    />
                  </>
                ) : null
              }
            />
          </div>

          {/* ── Pestaña: Resumen ──────────────────────────── */}
          <TabsPanel value={TABS.summary} className="space-y-6">
            {kpis && (
              <ReportKpiRow kpis={kpis} hasData={kpis.workingDays > 0} />
            )}

            <div className="grid gap-6 xl:grid-cols-2">
              <HoursByDayChart data={daily} />
              <ConceptBreakdownChart data={breakdown} />
            </div>
          </TabsPanel>

          {/* ── Pestaña: Desglose ─────────────────────────── */}
          <TabsPanel value={TABS.breakdown} className="space-y-4">
            <ReportBreakdownTable
              rows={breakdown}
              grouping={grouping}
              onGroupingChange={setGrouping}
            />
          </TabsPanel>

          {/* ── Pestaña: Registros ────────────────────────── */}
          <TabsPanel value={TABS.entries} className="space-y-6">
            {entries && profile && selectedPeriod ? (
              <>
                <h2 className="text-[15px] font-semibold text-foreground">
                  {selectedPeriod.name}
                </h2>

                <PeriodSummarySections
                  entries={entries}
                  type={profile.type}
                  viaticoRate={profile.viatico}
                  renderActions={renderActions}
                />

                <ApprovalPanel period={selectedPeriod} />
              </>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Cargando...
              </p>
            )}
          </TabsPanel>
        </TabsRoot>
      </div>
    </div>
  );
}

/** Acciones de cada fila del resumen: editar y eliminar el registro. */
function ReportRowActions({
  entry,
  profileType,
}: {
  entry: TimeEntry;
  profileType: EmploymentType;
}) {
  const [open, setOpen] = useState(false);
  const deleteEntry = useDeleteEntry();

  const handleDelete = async () => {
    if (confirm("¿Eliminar esta entrada?")) {
      await deleteEntry.mutateAsync(entry.id);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        title="Editar entrada"
        aria-label="Editar entrada"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={handleDelete}
        title="Eliminar entrada"
        aria-label="Eliminar entrada"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <EntryEditDialog
        entry={entry}
        profileType={profileType}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
