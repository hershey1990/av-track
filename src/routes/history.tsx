"use client";

import { useMemo, useState } from "react";
import { ListFilter, Pencil, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { getMonthRangeNicaragua } from "@/lib/timezone";
import {
  useEntries,
  useDeleteEntry,
} from "@/features/time-entries/hooks/use-entries";
import { EntryEditDialog } from "@/features/time-entries/components/entry-edit-dialog";
import { PeriodSummarySections } from "@/features/reports/components/period-summary-sections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DayCalculation, EmploymentType, TimeEntry } from "@/types";

export default function HistoryPage() {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);
  const { firstDay, lastDay } = getMonthRangeNicaragua();

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [showFilters, setShowFilters] = useState(true);

  const { data: entries, isLoading } = useEntries(user?.id, from, to);

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="history-from">Desde</Label>
                <Input
                  id="history-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="history-to">Hasta</Label>
                <Input
                  id="history-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
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
