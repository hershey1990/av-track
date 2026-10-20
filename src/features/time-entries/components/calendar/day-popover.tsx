"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EntryEditDialog } from "../entry-edit-dialog";
import { useDeleteEntry } from "../../hooks/use-entries";
import { calcHours, formatDurationHMS } from "@/lib/calculations";
import { colorForConcept } from "../concept-color";
import { DayEntryForm } from "./day-entry-form";
import { formatDayLabel, isSundayDate } from "./calendar-utils";
import type { EmploymentType, TimeEntry } from "@/types";

interface Props {
  userId: string;
  profileType: EmploymentType;
  /** Fecha del día en formato "yyyy-MM-dd". */
  date: string;
  /** Entradas registradas en ese día. */
  entries: TimeEntry[];
}

/**
 * Contenido del popover de un día del calendario.
 *
 * Muestra las entradas ya registradas (con acciones de editar y borrar) y,
 * debajo, el formulario de alta rápida para sumar otro registro a ese día.
 */
export function DayPopoverContent({
  userId,
  profileType,
  date,
  entries,
}: Props) {
  const deleteEntry = useDeleteEntry();
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const dateLabel = formatDayLabel(date);

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm("¿Eliminar esta entrada?")) return;
    await deleteEntry.mutateAsync(entry.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-foreground">{dateLabel}</p>
        {isSundayDate(date) && (
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Domingo
          </p>
        )}
      </div>

      {entries.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => {
            const hours = calcHours(entry.start_time, entry.end_time);
            const color = colorForConcept(entry.concept);

            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5"
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {entry.concept?.trim() || "Sin concepto"}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                    {" · "}
                    {formatDurationHMS(hours * 3600)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  title="Editar entrada"
                  aria-label={`Editar entrada del ${dateLabel}`}
                  onClick={() => setEditing(entry)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  title="Eliminar entrada"
                  aria-label={`Eliminar entrada del ${dateLabel}`}
                  onClick={() => handleDelete(entry)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {entries.length > 0 && <Separator />}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {entries.length > 0 ? "Agregar otro registro" : "Nuevo registro"}
        </p>
        <DayEntryForm userId={userId} profileType={profileType} date={date} />
      </div>

      {editing && (
        <EntryEditDialog
          entry={editing}
          profileType={profileType}
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
