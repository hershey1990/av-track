/**
 * Agregaciones puras para los reportes.
 *
 * Todo lo que necesita el resumen, los gráficos y la tabla de desglose se
 * calcula aquí, sin React, a partir de la lista de `DayCalculation` que
 * produce `generatePeriodDays` (src/lib/calculations.ts).
 *
 * La lista de días ya incluye los días sin registros ("Off"), de modo que el
 * eje temporal del gráfico es continuo a lo largo de todo el período.
 */

import { calcExtraHours, getStandardHours } from "@/lib/calculations";
import { formatDayMonthShort, formatMonthYear } from "@/lib/timezone";
import type { DayCalculation, EmploymentType } from "@/types";

/** Una barra del gráfico "horas por día". */
export interface DailySeriesPoint {
  /** "yyyy-MM-dd" */
  date: string;
  /** Nombre corto del día: "Lun" */
  weekday: string;
  /** "19/10" */
  dateLabel: string;
  /** "Lun 19/10" */
  fullLabel: string;
  /** Horas que no son extra. */
  standardHours: number;
  /** Horas extra del día (bloques de 30 min, igual que la app). */
  extraHours: number;
  /** standardHours + extraHours */
  totalHours: number;
  /** Monto de viático del día. */
  viatico: number;
  /** Número de registros que componen el día. */
  entryCount: number;
}

/** Una fila del desglose (por concepto, por día o por mes). */
export interface BreakdownRow {
  /** Clave estable para React y para ordenar. */
  key: string;
  /** Etiqueta legible. */
  label: string;
  /** Etiqueta secundaria (fecha completa, mes, etc.). */
  hint?: string;
  hours: number;
  extraHours: number;
  viatico: number;
  entryCount: number;
  /** Porcentaje del total de horas (0-100). */
  sharePct: number;
}

/** Indicadores de la franja superior del reporte. */
export interface SummaryKpis {
  totalHours: number;
  extraHours: number;
  /** % de horas extra sobre el total (0-100). */
  extraPct: number;
  totalViatico: number;
  /** Días con al menos un registro. */
  workingDays: number;
  /** Total de días del período (incluye los días Off). */
  totalDays: number;
  /** Promedio de horas por día laborado. */
  avgDailyHours: number;
}

/** Dimensiones soportadas por el desglose. */
export type BreakdownGrouping = "concept" | "day" | "month";

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Día de la semana en corto: "Lun". */
export function weekdayLabel(dateStr: string): string {
  const { year, month, day } = splitDate(dateStr);
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return WEEKDAY_LABELS[index];
}

/** Etiqueta numérica de día: "19/10". */
export function dayNumericLabel(dateStr: string): string {
  const { month, day } = splitDate(dateStr);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

function splitDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

/**
 * Agrupa los días del período por fecha.
 *
 * Las horas extra se calculan a nivel de día (no sumando las extras de cada
 * registro) para que un día con varios tramos se compare contra la jornada
 * estándar una sola vez.
 */
export function buildDailySeries(
  days: DayCalculation[],
  type: EmploymentType,
): DailySeriesPoint[] {
  const standard = getStandardHours(type);

  const byDate = new Map<string, DayCalculation[]>();
  for (const day of days) {
    const bucket = byDate.get(day.date);
    if (bucket) bucket.push(day);
    else byDate.set(day.date, [day]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayList]) => {
      const totalHours = round2(
        dayList.reduce((sum, day) => sum + day.hours, 0),
      );
      const extraHours = calcExtraHours(totalHours, standard);

      return {
        date,
        weekday: weekdayLabel(date),
        dateLabel: dayNumericLabel(date),
        fullLabel: `${weekdayLabel(date)} ${dayNumericLabel(date)}`,
        standardHours: round2(totalHours - extraHours),
        extraHours,
        totalHours,
        viatico: dayList.reduce((sum, day) => sum + day.viatico_amount, 0),
        // Los días sin registro se generan como "Off" y no son entradas reales.
        entryCount: dayList.filter((day) => day.entry_id).length,
      };
    });
}

/**
 * Construye las filas del desglose agrupando por concepto, día o mes.
 *
 * Las horas extra se reasignan por grupo: cada día aporta su extra al grupo
 * al que pertenece, de forma que la suma de las filas coincide con el total.
 */
export function buildBreakdown(
  days: DayCalculation[],
  grouping: BreakdownGrouping,
  type: EmploymentType,
): BreakdownRow[] {
  const standard = getStandardHours(type);

  interface Bucket {
    key: string;
    label: string;
    hint?: string;
    hours: number;
    extraHours: number;
    viatico: number;
    entryCount: number;
  }

  const buckets = new Map<string, Bucket>();

  // Días agrupados por fecha (para repartir las horas extra del día).
  const daysByDate = new Map<string, DayCalculation[]>();
  for (const day of days) {
    const bucket = daysByDate.get(day.date);
    if (bucket) bucket.push(day);
    else daysByDate.set(day.date, [day]);
  }

  const dayExtra = new Map<string, number>();
  for (const [date, dayList] of daysByDate) {
    const total = round2(dayList.reduce((sum, day) => sum + day.hours, 0));
    dayExtra.set(date, calcExtraHours(total, standard));
  }

  for (const day of days) {
    if (day.hours <= 0) continue;

    const key =
      grouping === "concept"
        ? day.concept || "Sin concepto"
        : grouping === "day"
          ? day.date
          : day.date.slice(0, 7);

    let label: string;
    let hint: string | undefined;

    if (grouping === "concept") {
      label = day.concept || "Sin concepto";
    } else if (grouping === "day") {
      label = dayNumericLabel(day.date);
      hint = formatDayMonthShort(day.date);
    } else {
      label = formatMonthYear(day.date);
    }

    const existing = buckets.get(key);
    if (existing) {
      existing.hours = round2(existing.hours + day.hours);
      existing.viatico += day.viatico_amount;
      existing.entryCount += 1;
    } else {
      buckets.set(key, {
        key,
        label,
        hint,
        hours: round2(day.hours),
        extraHours: 0,
        viatico: day.viatico_amount,
        entryCount: 1,
      });
    }
  }

  // Reparto de las horas extra del día: se asignan al primer grupo del día
  // (así la suma de las filas cuadra con el total de horas extra del día).
  if (grouping === "day") {
    for (const [date, extra] of dayExtra) {
      const bucket = buckets.get(date);
      if (bucket && extra > 0) {
        bucket.extraHours = extra;
      }
    }
  } else {
    for (const day of days) {
      if (day.hours <= 0) continue;
      const key =
        grouping === "concept"
          ? day.concept || "Sin concepto"
          : day.date.slice(0, 7);
      const bucket = buckets.get(key);
      if (!bucket) continue;

      const extra = dayExtra.get(day.date) ?? 0;
      const share = extra * (day.hours / totalDayHours(daysByDate, day.date));
      bucket.extraHours = round2(bucket.extraHours + share);
    }
  }

  const totalHours = [...buckets.values()].reduce((s, b) => s + b.hours, 0);

  return [...buckets.values()]
    .map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      hint: bucket.hint,
      hours: round2(bucket.hours),
      extraHours: round2(bucket.extraHours),
      viatico: round2(bucket.viatico),
      entryCount: bucket.entryCount,
      sharePct: totalHours > 0 ? (bucket.hours / totalHours) * 100 : 0,
    }))
    .sort((a, b) => b.hours - a.hours || a.label.localeCompare(b.label));
}

function totalDayHours(
  daysByDate: Map<string, DayCalculation[]>,
  date: string,
): number {
  const list = daysByDate.get(date) ?? [];
  return round2(list.reduce((sum, day) => sum + day.hours, 0));
}

/** Calcula los indicadores de la franja superior del reporte. */
export function computeSummaryKpis(
  days: DayCalculation[],
  type: EmploymentType,
): SummaryKpis {
  const standard = getStandardHours(type);

  const daysByDate = new Map<string, DayCalculation[]>();
  for (const day of days) {
    const bucket = daysByDate.get(day.date);
    if (bucket) bucket.push(day);
    else daysByDate.set(day.date, [day]);
  }

  let totalHours = 0;
  let extraHours = 0;
  let totalViatico = 0;
  let workingDays = 0;

  for (const [, dayList] of daysByDate) {
    const hours = round2(dayList.reduce((sum, day) => sum + day.hours, 0));
    if (hours <= 0) continue;

    workingDays += 1;
    totalHours += hours;
    extraHours += calcExtraHours(hours, standard);
    totalViatico += dayList.reduce((sum, day) => sum + day.viatico_amount, 0);
  }

  totalHours = round2(totalHours);
  extraHours = round2(extraHours);

  return {
    totalHours,
    extraHours,
    extraPct: totalHours > 0 ? (extraHours / totalHours) * 100 : 0,
    totalViatico: round2(totalViatico),
    workingDays,
    totalDays: daysByDate.size,
    avgDailyHours: workingDays > 0 ? round2(totalHours / workingDays) : 0,
  };
}

/** Redondeo a dos decimales, evitando el ruido de coma flotante. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
