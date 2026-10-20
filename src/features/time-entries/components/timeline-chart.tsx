"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colorForConcept } from "./concept-color";
import type { TimeEntry } from "@/types";

/** Duración de cada tramo del eje temporal. */
const SLOT_MINUTES = 15;
const SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES;

const BARS_HEIGHT = 132;
const AXIS_HEIGHT = 26;
const BAND_HEIGHT = 9;
const CHART_HEIGHT = BARS_HEIGHT + AXIS_HEIGHT + BAND_HEIGHT;

/** Etiquetas del eje: 0:00 → 18:00 (como en la referencia de toggl Track) */
const AXIS_TICKS = [0, 3, 6, 9, 12, 15, 18];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

interface Slot {
  index: number;
  /** Minutos del tramo realmente cubiertos por un registro */
  covered: number;
  /** Concepto predominante del tramo */
  concept: string;
}

interface TimelineChartProps {
  entries: TimeEntry[];
  /** Etiqueta de la fecha, a la derecha del encabezado */
  dateLabel: string;
  onPrev: () => void;
  onNext: () => void;
  /** ¿La fecha actual es la de hoy? (deshabilita la flecha adelante) */
  isToday: boolean;
}

export function TimelineChart({
  entries,
  dateLabel,
  onPrev,
  onNext,
  isToday,
}: TimelineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Medimos el ancho real para que el SVG no se deforme.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  const slots = useMemo<Slot[]>(() => {
    const result: Slot[] = Array.from(
      { length: SLOTS_PER_DAY },
      (_, index) => ({
        index,
        covered: 0,
        concept: "",
      }),
    );

    for (const entry of entries) {
      const start = timeToMinutes(entry.start_time);
      const end = timeToMinutes(entry.end_time);
      if (end <= start) continue;

      const firstSlot = Math.floor(start / SLOT_MINUTES);
      const lastSlot = Math.ceil(end / SLOT_MINUTES) - 1;

      for (let i = firstSlot; i <= lastSlot && i < SLOTS_PER_DAY; i++) {
        const slotStart = i * SLOT_MINUTES;
        const slotEnd = slotStart + SLOT_MINUTES;
        const overlap = Math.min(end, slotEnd) - Math.max(start, slotStart);
        if (overlap <= 0) continue;
        result[i].covered = Math.min(SLOT_MINUTES, result[i].covered + overlap);
        if (!result[i].concept) result[i].concept = entry.concept || "Registro";
      }
    }

    return result;
  }, [entries]);

  const slotWidth = width > 0 ? width / SLOTS_PER_DAY : 0;
  const barGap = Math.min(3, slotWidth * 0.28);
  const barWidth = Math.max(1.5, slotWidth - barGap);

  const xFor = (minutes: number) => (minutes / (24 * 60)) * width;

  const hasData = slots.some((s) => s.covered > 0);

  return (
    <section className="rounded-lg bg-card ring-1 ring-foreground/8">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 px-5 pt-4">
        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          TIMELINE
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground">{dateLabel}</span>
          <div className="flex items-center overflow-hidden rounded-md ring-1 ring-border">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-none rounded-r-none"
              onClick={onPrev}
              aria-label="Día anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-none rounded-l-none border-l border-border"
              onClick={onNext}
              disabled={isToday}
              aria-label="Día siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div ref={containerRef} className="relative w-full px-0 pb-2">
        {width > 0 && (
          <svg
            width={width}
            height={CHART_HEIGHT}
            className="block"
            role="img"
            aria-label="Línea de tiempo del día"
          >
            {/* Barras de actividad */}
            <g>
              {slots.map((slot) => {
                if (slot.covered === 0) return null;
                const ratio = slot.covered / SLOT_MINUTES;
                const height = Math.max(4, ratio * (BARS_HEIGHT - 18));
                const x = slot.index * slotWidth;
                return (
                  <rect
                    key={slot.index}
                    x={x + barGap / 2}
                    y={BARS_HEIGHT - height}
                    width={barWidth}
                    height={height}
                    rx={Math.min(barWidth / 2, 4)}
                    fill="var(--chart-1)"
                    opacity={0.55 + ratio * 0.45}
                  />
                );
              })}
            </g>

            {/* Eje */}
            <line
              x1={0}
              y1={BARS_HEIGHT}
              x2={width}
              y2={BARS_HEIGHT}
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* Etiquetas del eje */}
            <g>
              {AXIS_TICKS.map((hour) => {
                const x = xFor(hour * 60);
                // Las etiquetas de los extremos se alinean hacia dentro
                // para que no queden recortadas por el borde del SVG.
                const anchor =
                  hour === 0 ? "start" : x > width - 24 ? "end" : "middle";
                return (
                  <g key={hour}>
                    <line
                      x1={x}
                      y1={BARS_HEIGHT}
                      x2={x}
                      y2={BARS_HEIGHT + 5}
                      stroke="var(--border)"
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={BARS_HEIGHT + 18}
                      textAnchor={anchor}
                      className="fill-muted-foreground text-[10px]"
                    >
                      {hour}:00
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Banda de conceptos */}
            <g transform={`translate(0 ${BARS_HEIGHT + AXIS_HEIGHT - 2})`}>
              {slots.map((slot) => {
                if (slot.covered === 0) return null;
                const x = slot.index * slotWidth;
                return (
                  <rect
                    key={slot.index}
                    x={x}
                    y={0}
                    width={slotWidth}
                    height={BAND_HEIGHT}
                    fill={colorForConcept(slot.concept)}
                    opacity={0.85}
                  />
                );
              })}
            </g>
          </svg>
        )}

        {!hasData && width > 0 && (
          <p
            className="pointer-events-none absolute inset-x-0 text-center text-sm text-muted-foreground"
            style={{ top: BARS_HEIGHT / 2 - 12 }}
          >
            Sin registros para este día
          </p>
        )}
      </div>
    </section>
  );
}
