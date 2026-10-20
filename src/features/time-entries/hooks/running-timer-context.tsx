"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRunningTimer, type TimerSegment } from "./use-running-timer";
import { useUser } from "@/hooks/use-user";

export interface RunningTimerValue {
  /** El cronómetro está en marcha */
  isRunning: boolean;
  /** Segundos transcurridos */
  elapsed: number;
  /** Concepto que se está escribiendo en la barra superior */
  concept: string;
  setConcept: (concept: string) => void;
  start: () => void;
  /** Detiene el cronómetro y guarda la entrada. Null si el turno fue muy corto. */
  stop: () => Promise<TimerSegment[] | null>;
  isSaving: boolean;
}

const RunningTimerContext = createContext<RunningTimerValue | null>(null);

/**
 * Comparte una única instancia del cronómetro entre la barra superior y
 * el resto de la aplicación (la lista de entradas se actualiza en vivo).
 */
export function RunningTimerProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const timer = useRunningTimer(user?.id);

  return (
    <RunningTimerContext.Provider value={timer}>
      {children}
    </RunningTimerContext.Provider>
  );
}

export function useRunningTimerContext(): RunningTimerValue {
  const ctx = useContext(RunningTimerContext);
  if (!ctx) {
    throw new Error(
      "useRunningTimerContext debe usarse dentro de <RunningTimerProvider>",
    );
  }
  return ctx;
}
