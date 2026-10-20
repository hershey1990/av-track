"use client";

import { useMemo } from "react";
import { ListFilter, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteEntry } from "../hooks/use-entries";
import { useManualEntry } from "../hooks/manual-entry-context";
import { useRunningTimerContext } from "../hooks/running-timer-context";
import {
  calcHours,
  calcExtraHours,
  formatDurationHMS,
  getStandardHours,
} from "@/lib/calculations";
import { THRESHOLD_VIATICO_HORAS } from "@/config/constants";
import { formatDayMonth, shiftDate } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import type { EmploymentType, TimeEntry } from "@/types";

interface EntriesListProps {
  entries: TimeEntry[];
  /** Fecha seleccionada en el timeline ("yyyy-MM-dd") */
  selectedDate: string;
  /** Fecha de hoy en Nicaragua ("yyyy-MM-dd") */
  today: string;
  profileType: EmploymentType;
}

interface Group {
  key: string;
  title: string;
  entries: TimeEntry[];
}

export function EntriesList({
  entries,
  selectedDate,
  today,
  profileType,
}: EntriesListProps) {
  const { isRunning, elapsed, concept } = useRunningTimerContext();
  const manual = useManualEntry();
  const deleteEntry = useDeleteEntry();

  const groups = useMemo<Group[]>(() => {
    const yesterday = shiftDate(today, -1);

    if (selectedDate === today) {
      return [
        {
          key: "today",
          title: "Hoy",
          entries: entries.filter((e) => e.date === today),
        },
        {
          key: "yesterday",
          title: "Ayer",
          entries: entries.filter((e) => e.date === yesterday),
        },
      ];
    }

    return [
      {
        key: selectedDate,
        title: formatDayMonth(selectedDate),
        entries: entries.filter((e) => e.date === selectedDate),
      },
    ];
  }, [entries, selectedDate, today]);

  const handleDelete = async (entry: TimeEntry) => {
    if (!confirm("¿Eliminar esta entrada?")) return;
    await deleteEntry.mutateAsync(entry.id);
  };

  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const totalSeconds = group.entries.reduce(
          (sum, entry) =>
            sum + calcHours(entry.start_time, entry.end_time) * 3600,
          0,
        );
        const showRunning = group.key === "today" && isRunning;

        return (
          <section key={group.key} className="mt-6 first:mt-0">
            {/* Encabezado del grupo */}
            <div className="flex items-center justify-between gap-4 pb-3">
              <h2 className="text-[15px] font-semibold text-foreground">
                {group.title}
              </h2>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
                  {formatDurationHMS(totalSeconds)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-md"
                  title="Filtrar registros"
                  aria-label={`Filtrar registros de ${group.title}`}
                >
                  <ListFilter className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Filas */}
            <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/8">
              {showRunning && (
                <RunningRow elapsed={elapsed} concept={concept} />
              )}

              {group.entries.length === 0 && !showRunning && (
                <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                  Sin registros
                </p>
              )}

              {group.entries.map((entry, index) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  index={index}
                  profileType={profileType}
                  entriesBefore={group.entries.slice(0, index)}
                  onEdit={() => manual.openEdit(entry)}
                  onDelete={() => handleDelete(entry)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Fila del registro que se está capturando en vivo. */
function RunningRow({
  elapsed,
  concept,
}: {
  elapsed: number;
  concept: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-muted/40">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-1 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-1" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
        {concept?.trim() || "Registro en curso"}
      </span>
      <span className="font-mono text-[13px] font-semibold tabular-nums text-chart-1">
        {formatDurationHMS(elapsed)}
      </span>
    </div>
  );
}

/** Ordinal abreviado en español: 1er, 2do, 3er, 4to… */
function ordinal(n: number): string {
  const suffixes = ["er", "do", "er", "to", "to", "to", "to", "to", "to"];
  return `${n}${suffixes[n - 1] ?? "to"}`;
}

function EntryRow({
  entry,
  index,
  profileType,
  entriesBefore,
  onEdit,
  onDelete,
}: {
  entry: TimeEntry;
  index: number;
  profileType: EmploymentType;
  entriesBefore: TimeEntry[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hours = calcHours(entry.start_time, entry.end_time);
  const standard = getStandardHours(profileType);
  const extra = calcExtraHours(hours, standard);

  // El viático se alcanza cuando el acumulado del día supera el umbral.
  const accumulated =
    hours +
    entriesBefore.reduce(
      (sum, e) => sum + calcHours(e.start_time, e.end_time),
      0,
    );
  const hasViatico = accumulated >= THRESHOLD_VIATICO_HORAS;

  const title = entry.concept?.trim() || "Registro";
  const slotLabel = `${ordinal(index + 1)} turno`;

  return (
    <div className="group flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-muted/40">
      {/* Concepto */}
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
        {title}
      </span>

      {/* Etiqueta de estado */}
      <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            extra > 0 ? "bg-chart-1" : "bg-chart-2",
          )}
        />
        <span
          className={cn(
            "text-[13px]",
            extra > 0 ? "text-chart-1" : "text-chart-2",
          )}
        >
          {extra > 0 ? "Horas extra" : "Regular"}
        </span>
      </span>

      {/* Notas */}
      {entry.notes?.trim() && (
        <span className="hidden min-w-0 max-w-[160px] shrink items-center gap-1.5 md:flex">
          <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
          <span className="truncate text-[13px] text-muted-foreground">
            {entry.notes.trim()}
          </span>
        </span>
      )}

      {/* Turno */}
      <span className="hidden w-[86px] shrink-0 text-right text-[13px] capitalize text-muted-foreground lg:block">
        {slotLabel}
      </span>

      {/* Viático */}
      {hasViatico && (
        <span className="shrink-0 text-[15px] font-semibold text-chart-1">
          $
        </span>
      )}

      {/* Rango horario */}
      <span className="shrink-0 font-mono text-[13px] tabular-nums text-foreground">
        {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}
      </span>

      {/* Duración */}
      <span className="w-[68px] shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-foreground">
        {formatDurationHMS(hours * 3600)}
      </span>

      {/* Acciones */}
      <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-7"
          onClick={onEdit}
          aria-label="Editar entrada"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-7"
          onClick={onDelete}
          aria-label="Eliminar entrada"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </span>
    </div>
  );
}
