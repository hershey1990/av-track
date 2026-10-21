'use client'

import { useMemo, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateFull } from '@/lib/timezone'
import { weekdayLabel } from '@/features/reports/aggregation'
import {
  MONTH_LABELS,
  buildTimelineMarkers,
  yearPositionPct,
} from '../timeline'
import type { Holiday } from '@/types'

interface Props {
  /** Feriados del año que se está mostrando. */
  holidays: Holiday[]
  /** Año mostrado (sólo se usa para atenuar los meses ya transcurridos). */
  year: number
  /** Fecha de hoy en Nicaragua ("yyyy-MM-dd"), para marcar la posición actual. */
  today: string
}

/**
 * Línea de tiempo anual de feriados.
 *
 * La pista representa el año completo de enero a diciembre: cada feriado es
 * un marcador colocado en el porcentaje que le corresponde según el día real
 * dentro de su mes (no todos al principio del mes). Los marcadores que están
 * muy cerca se apilan en distintos niveles para que no se tapen.
 */
export function HolidayTimeline({ holidays, year, today }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const markers = useMemo(() => buildTimelineMarkers(holidays), [holidays])

  const todayPct = useMemo(() => {
    if (!today.startsWith(`${year}-`)) return null
    return yearPositionPct(today)
  }, [today, year])

  const currentMonth = Number(today.slice(5, 7)) || 0
  const isCurrentYear = today.startsWith(`${year}-`)

  const active =
    markers.find((m) => m.holiday.id === activeId) ?? markers[0] ?? null

  return (
    <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/8">
      <div className="overflow-x-auto">
        <div className="min-w-[680px] px-10">
          {/* Meses */}
          <div className="grid grid-cols-12 border-b border-border">
            {MONTH_LABELS.map((label, index) => {
              const month = index + 1
              const past = isCurrentYear && month < currentMonth
              return (
                <div
                  key={label}
                  className={cn(
                    'py-2 text-center text-[11px] font-medium uppercase tracking-wider',
                    past ? 'text-muted-foreground/35' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </div>
              )
            })}
          </div>

          {/* Pista */}
          <div className="relative h-14">
            {/* Eje del año */}
            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />

            {/* Divisorías de mes */}
            <div className="absolute inset-0 grid grid-cols-12">
              {MONTH_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-l border-border/50 first:border-l-0"
                />
              ))}
            </div>

            {/* Posición de hoy */}
            {todayPct !== null && (
              <div
                className="absolute inset-y-0 w-px bg-chart-2/70"
                style={{ left: `${todayPct}%` }}
                aria-hidden
              />
            )}

            {/* Marcadores */}
            {markers.map((marker) => {
              const isActive = active?.holiday.id === marker.holiday.id
              return (
                <button
                  key={marker.holiday.id}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{
                    left: `${marker.leftPct}%`,
                    top: `${50 - marker.level * 16}%`,
                  }}
                  title={`${marker.holiday.name} — ${formatDateFull(marker.holiday.date)}`}
                  onMouseEnter={() => setActiveId(marker.holiday.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(marker.holiday.id)}
                  onBlur={() => setActiveId(null)}
                  aria-label={`${marker.holiday.name}, ${formatDateFull(marker.holiday.date)}`}
                >
                  <span
                    className={cn(
                      'block h-2.5 w-2.5 rounded-full transition-all',
                      isActive
                        ? 'scale-125 bg-primary ring-4 ring-primary/20'
                        : 'bg-primary/70 ring-4 ring-primary/10',
                    )}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detalle del feriado activo */}
      <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-5 py-2.5 text-[13px]">
        <PartyPopper className="h-3.5 w-3.5 shrink-0 text-primary" />
        {active ? (
          <>
            <span className="font-medium text-foreground">
              {active.holiday.name}
            </span>
            <span className="text-muted-foreground">
              {weekdayLabel(active.holiday.date)} {formatDateFull(active.holiday.date)}
            </span>
            <span className="ml-auto text-muted-foreground">
              {active.holiday.date}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            No hay feriados registrados en {year}.
          </span>
        )}
      </div>
    </div>
  )
}
