"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type TrackerMode = "tracking" | "done";

interface TrackerModeSwitchProps {
  mode: TrackerMode;
  onModeChange: (mode: TrackerMode) => void;
}

/**
 * Switch de modo del tracker (clon de toggl Track).
 *
 * - "tracking" → estás trabajando: el input pregunta "¿Qué estás haciendo?"
 *   y el botón redondo es el play.
 * - "done" → ya terminaste: el input pregunta "¿Qué hiciste?" y el botón
 *   redondo es el "+" para registrar una entrada que ya pasó.
 */
export function TrackerModeSwitch({
  mode,
  onModeChange,
}: TrackerModeSwitchProps) {
  const isDone = mode === "done";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors",
        isDone
          ? "border-border bg-muted"
          : "border-transparent bg-transparent",
      )}
      title={
        isDone
          ? "Modo «hecho»: registra una entrada que ya ocurrió"
          : "Modo «en curso»: el cronómetro registra el tiempo mientras trabajás"
      }
    >
      <Switch
        id="tracker-mode"
        checked={isDone}
        onCheckedChange={(checked) => onModeChange(checked ? "done" : "tracking")}
      />
      <span
        className={cn(
          "hidden text-xs font-medium sm:inline",
          isDone ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {isDone ? "Hecho" : "En curso"}
      </span>
      <span className="sr-only">
        {isDone ? "Modo hecho" : "Modo en curso"}
      </span>
    </div>
  );
}
