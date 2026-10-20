"use client";

import { useMemo, useState } from "react";
import { ListFilter, Pencil, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { getMonthRangeNicaragua, formatDateFull } from "@/lib/timezone";
import {
  useEntries,
  useDeleteEntry,
} from "@/features/time-entries/hooks/use-entries";
import { EntryEditDialog } from "@/features/time-entries/components/entry-edit-dialog";
import { PeriodSummarySections } from "@/features/reports/components/period-summary-sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import type { DayCalculation, EmploymentType, TimeEntry } from "@/types";

export default function HistoryPage() {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);
  const { firstDay, lastDay } = getMonthRangeNicaragua();

  const [from, setFrom] = useState(firstDay);
  // `to` puede quedar sin definir mientras el usuario elige el fin del rango
  // en el calendario; mientras tanto se consulta hasta el día inicial.
  const [to, setTo] = useState<string | undefined>(lastDay);
  const [showFilters, setShowFilters] = useState(true);

  const effectiveTo = to ?? from;

  const { data: entries, isLoading } = useEntries(user?.id, from, effectiveTo);

  /** Entradas indexadas por id para resolver las acciones de cada fila. */
  const entriesById = useMemo(() => {
    const map = new Map<string, TimeEntry>();
    for (const entry of entries ?? []) map.set(entry.id, entry);
    return map;
  }, [entries]);

  const renderActions = (day: DayCalculation) => {
    if (!day.entry_id) return null;
    const entry = entriesById.get(day.entry_id);
    if (!entry || !profile) return null;

    return <HistoryRowActions entry={entry} profileType={profile.type} />;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="history-range">Rango de fechas</Label>
                <DateRangePicker
                  id="history-range"
                  from={from}
                  to={to}
                  onRangeChange={(nextFrom, nextTo) => {
                    if (!nextFrom) return;
                    setFrom(nextFrom);
                    setTo(nextTo);
                  }}
                  placeholder="Elegí un rango"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  Mostrando del{" "}
                  <span className="font-medium text-foreground">
                    {formatDateFull(from)}
                  </span>{" "}
                  al{" "}
                  <span className="font-medium text-foreground">
                    {formatDateFull(effectiveTo)}
                  </span>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
          Cargando...
        </p>
      ) : profile && entries ? (
        <PeriodSummarySections
          entries={entries}
          type={profile.type}
          viaticoRate={profile.viatico}
          title="Resumen del período"
          emptyMessage="Sin registros en este período"
          headerAction={
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-md"
              title={showFilters ? "Ocultar filtros" : "Filtrar registros"}
              aria-label={showFilters ? "Ocultar filtros" : "Filtrar registros"}
              aria-expanded={showFilters}
              onClick={() => setShowFilters((v) => !v)}
            >
              <ListFilter className="h-4 w-4 text-muted-foreground" />
            </Button>
          }
          renderActions={renderActions}
        />
      ) : null}
    </div>
  );
}

/** Acciones de cada fila del resumen: editar y eliminar el registro. */
function HistoryRowActions({
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
