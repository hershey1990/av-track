"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TimeEntry } from "@/types";

export interface ManualEntryValue {
  /** El panel manual está abierto */
  isOpen: boolean;
  /** Entrada en edición; null ⇒ se crea una nueva */
  target: TimeEntry | null;
  /** Abre el panel para crear una entrada nueva */
  open: () => void;
  /** Abre el panel para editar una entrada existente */
  openEdit: (entry: TimeEntry) => void;
  /** Cierra el panel */
  close: () => void;
}

const ManualEntryContext = createContext<ManualEntryValue | null>(null);

/**
 * Comparte el estado del panel manual entre la barra superior y el contenido.
 * Así, el botón "+" (crear) y el lápiz de una fila (editar) abren exactamente
 * el mismo popover.
 */
export function ManualEntryProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<TimeEntry | null>(null);

  const open = useCallback(() => {
    setTarget(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((entry: TimeEntry) => {
    setTarget(entry);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTarget(null);
  }, []);

  const value = useMemo<ManualEntryValue>(
    () => ({ isOpen, target, open, openEdit, close }),
    [isOpen, target, open, openEdit, close],
  );

  return (
    <ManualEntryContext.Provider value={value}>
      {children}
    </ManualEntryContext.Provider>
  );
}

export function useManualEntry(): ManualEntryValue {
  const ctx = useContext(ManualEntryContext);
  if (!ctx) {
    throw new Error(
      "useManualEntry debe usarse dentro de <ManualEntryProvider>",
    );
  }
  return ctx;
}
