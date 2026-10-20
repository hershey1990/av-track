"use client";

import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { EmploymentType, TimeEntry } from "@/types";

export interface CalendarDayContextValue {
  /** Id del usuario propietario de las entradas. */
  userId: string;
  /** Tipo de employment, necesario para calcular las horas extra. */
  profileType: EmploymentType;
  /** Fecha abierta en el popover ("yyyy-MM-dd") o null. */
  openDate: string | null;
  /** Abre el detalle de una fecha concreta. */
  setOpenDate: Dispatch<SetStateAction<string | null>>;
  /** Entradas agrupadas por fecha, ordenadas por slot_index. */
  entriesByDate: Map<string, TimeEntry[]>;
  /** Días laborables del usuario (0 = domingo … 6 = sábado). */
  workingDays: number[];
  /**
   * `true` en pantallas de escritorio: el detalle se abre en un popover
   * anclado a la celda. En móvil se usa una hoja inferior.
   */
  isDesktop: boolean;
}

const CalendarDayContext = createContext<CalendarDayContextValue | null>(null);

export const CalendarDayProvider = CalendarDayContext.Provider;

/**
 * Contexto compartido por las celdas del calendario.
 *
 * Permite que el `DayButton` que inyecta `react-day-picker` sea un componente
 * estable (definido a nivel de módulo) y aun así reciba el estado del día
 * seleccionado y las entradas cargadas.
 */
export function useCalendarDay(): CalendarDayContextValue {
  const ctx = useContext(CalendarDayContext);
  if (!ctx) {
    throw new Error(
      "useCalendarDay debe usarse dentro de <CalendarDayProvider>",
    );
  }
  return ctx;
}
