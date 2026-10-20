"use client";

import { useEffect, useMemo, useState } from "react";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEntries } from "../../hooks/use-entries";
import { formatMonthYear, getTodayNicaragua } from "@/lib/timezone";
import { CalendarDayProvider } from "./calendar-day-context";
import { CalendarDayButton } from "./calendar-day-button";
import { DayPopoverContent } from "./day-popover";
import {
  formatHoursHM,
  getMonthKey,
  getMonthRange,
  groupByDate,
  shiftDateOnly,
  shiftMonth,
  summarizeDay,
  toDateOnly,
} from "./calendar-utils";
import type { EmploymentType } from "@/types";

/** Clave de localStorage donde se recuerda el mes visible. */
const MONTH_STORAGE_KEY = "bb-calendar-month";

interface Props {
  userId: string;
  profileType: EmploymentType;
  /** Días laborables (0 = domingo … 6 = sábado). */
  workingDays: number[];
}

export function CalendarView({ userId, profileType, workingDays }: Props) {
  const today = getTodayNicaragua();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [month, setMonth] = useState(() => {
    try {
      const saved = window.localStorage.getItem(MONTH_STORAGE_KEY);
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    } catch {
      /* localStorage no disponible */
    }
    return getMonthKey(today);
  });
  const [openDate, setOpenDate] = useState<string | null>(null);

  // Persiste el mes para que el cambio de vista (Timer ↔ Calendario) no lo pierda.
  useEffect(() => {
    try {
      window.localStorage.setItem(MONTH_STORAGE_KEY, month);
    } catch {
      /* localStorage no disponible */
    }
  }, [month]);

  const { firstDay, lastDay } = getMonthRange(month);

  // Rango ampliado para cubrir también los días externos de la grilla.
  const rangeFrom = useMemo(() => shiftDateOnly(firstDay, -7), [firstDay]);
  const rangeTo = useMemo(() => shiftDateOnly(lastDay, 7), [lastDay]);

  const { data: entries = [], isLoading } = useEntries(
    userId,
    rangeFrom,
    rangeTo,
  );

  const entriesByDate = useMemo(() => groupByDate(entries), [entries]);

  const monthSummary = useMemo(() => {
    let totalHours = 0;
    let extraHours = 0;
    let daysWithEntries = 0;

    for (const [date, dayEntries] of entriesByDate) {
      if (!date.startsWith(month)) continue;
      const summary = summarizeDay(dayEntries, profileType);
      totalHours += summary.totalHours;
      extraHours += summary.extraHours;
      if (dayEntries.length > 0) daysWithEntries += 1;
    }

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      extraHours: Math.round(extraHours * 100) / 100,
      daysWithEntries,
    };
  }, [entriesByDate, month, profileType]);

  const goToToday = () => {
    setMonth(getMonthKey(today));
    setOpenDate(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado con navegación de mes */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold capitalize tracking-tight">
            {formatMonthYear(`${month}-01`)}
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {monthSummary.daysWithEntries}{" "}
            {monthSummary.daysWithEntries === 1 ? "día" : "días"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MonthKpi
          icon={Clock}
          label="Horas del mes"
          value={`${formatHoursHM(monthSummary.totalHours)}h`}
        />
        <MonthKpi
          icon={Zap}
          label="Horas extra"
          value={`${formatHoursHM(monthSummary.extraHours)}h`}
        />
        <MonthKpi
          icon={CalendarDays}
          label="Días registrados"
          value={String(monthSummary.daysWithEntries)}
        />
      </div>

      {/* Grilla */}
      <CalendarDayProvider
        value={{
          userId,
          profileType,
          openDate,
          setOpenDate,
          entriesByDate,
          workingDays,
          isDesktop,
        }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-2 sm:p-3">
            <Calendar
              month={
                new Date(
                  Number(month.slice(0, 4)),
                  Number(month.slice(5, 7)) - 1,
                  1,
                )
              }
              onMonthChange={(date) => setMonth(getMonthKey(toDateOnly(date)))}
              onDayClick={(date) => setOpenDate(toDateOnly(date))}
              weekStartsOn={1}
              fixedWeeks
              showOutsideDays
              locale={es}
              timeZone="America/Managua"
              classNames={{
                root: "w-full",
                month: "flex w-full flex-col gap-4",
                month_grid: "w-full table-fixed border-collapse",
                weekdays: "w-full",
                weekday:
                  "px-1.5 text-left text-[11px] font-normal uppercase tracking-wide text-muted-foreground",
                week: "w-full",
                day: "h-full w-full rounded-(--cell-radius) p-0 align-top",
                today: "rounded-(--cell-radius)",
                outside: "text-muted-foreground/60",
              }}
              components={{
                DayButton: CalendarDayButton,
              }}
            />
          </CardContent>
        </Card>
      </CalendarDayProvider>

      {isLoading && (
        <p className="text-center text-xs text-muted-foreground">
          Cargando registros del mes…
        </p>
      )}

      {/*
        En móvil el detalle del día se abre en una hoja inferior a pantalla
        completa. Se renderiza aquí (una sola vez) y no dentro de cada celda.
      */}
      {!isDesktop && openDate && (
        <Sheet
          open={!!openDate}
          onOpenChange={(open) => {
            if (!open) setOpenDate(null);
          }}
        >
          <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
            <SheetHeader className="sr-only">
              <SheetTitle>Registro del día</SheetTitle>
            </SheetHeader>
            <DayPopoverContent
              userId={userId}
              profileType={profileType}
              date={openDate}
              entries={entriesByDate.get(openDate) ?? []}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

function MonthKpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
