"use client";

import { ChevronLeft, ChevronRight, Filter, CalendarRange } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateFull } from "@/lib/timezone";
import type { Period } from "@/types";

interface Props {
  periods: Period[];
  /** Período actualmente seleccionado. */
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string) => void;
  /** Período anterior / siguiente en orden cronológico. */
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  /** ¿Hay un período anterior? */
  hasPrev: boolean;
  /** ¿Hay un período siguiente? */
  hasNext: boolean;
  /** Contenido a la derecha (botones de exportación). */
  actions?: React.ReactNode;
  /** Contenido del panel de filtros (opcional). */
  filters?: React.ReactNode;
  /** ¿El panel de filtros está abierto? */
  filtersOpen?: boolean;
  onToggleFilters?: () => void;
}

/**
 * Barra de herramientas del reporte, al estilo de Toggle:
 * selector de período con flechas de navegación a los lados, etiqueta con el
 * rango de fechas y, a la derecha, las acciones (exportaciones).
 */
export function ReportToolbar({
  periods,
  selectedPeriodId,
  onSelectPeriod,
  onPrevPeriod,
  onNextPeriod,
  hasPrev,
  hasNext,
  actions,
  filters,
  filtersOpen = false,
  onToggleFilters,
}: Props) {
  const selected = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={onPrevPeriod}
            disabled={!hasPrev}
            title="Período anterior"
            aria-label="Ver el período anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            items={periods.map((p) => ({ value: p.id, label: p.name }))}
            value={selectedPeriodId}
            onValueChange={(value) => value && onSelectPeriod(value)}
          >
            <SelectTrigger className="h-8 w-auto min-w-[10rem] gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Elegí un período..." />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} {p.is_locked ? "(🔒)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={onNextPeriod}
            disabled={!hasNext}
            title="Período siguiente"
            aria-label="Ver el período siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {selected && (
          <span className="text-sm text-muted-foreground">
            {formatDateFull(selected.start_date)} —{" "}
            {formatDateFull(selected.end_date)}
          </span>
        )}

        {selected?.is_locked && (
          <Badge variant="secondary" className="shrink-0">
            Bloqueado
          </Badge>
        )}

        {onToggleFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {actions}
        </div>
      </div>

      {filtersOpen && filters && (
        <div className="rounded-lg bg-muted/40 p-4 ring-1 ring-foreground/8">
          {filters}
        </div>
      )}
    </div>
  );
}
