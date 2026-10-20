"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  DollarSign,
  Folder,
  Menu,
  Pause,
  Play,
  Plus,
  Tag,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TrackerModeSwitch,
  type TrackerMode,
} from "@/components/tracker-mode-switch";
import { ManualEntryForm } from "@/features/time-entries/components/manual-entry-form";
import { useManualEntry } from "@/features/time-entries/hooks/manual-entry-context";
import { useRunningTimerContext } from "@/features/time-entries/hooks/running-timer-context";
import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import { formatDurationHMS } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const MODE_STORAGE_KEY = "bb-tracker-mode";

export function AppTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);

  const { isRunning, elapsed, concept, setConcept, start, stop, isSaving } =
    useRunningTimerContext();

  const manual = useManualEntry();

  // ── Modo del tracker ("en curso" / "hecho") ──────────────────────────
  const [mode, setMode] = useState<TrackerMode>("tracking");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === "done" || saved === "tracking") setMode(saved);
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  const changeMode = (next: TrackerMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      /* localStorage no disponible */
    }
  };

  const isDone = mode === "done";

  const handleToggle = async () => {
    // Modo "hecho": el botón redondo abre el panel para registrar una
    // entrada que ya ocurrió.
    if (!isRunning && isDone) {
      manual.open();
      return;
    }

    if (isRunning) {
      try {
        const segments = await stop();
        if (!segments) {
          toast.info("El registro debe durar al menos 30 segundos");
        } else {
          toast.success("Registro guardado");
        }
      } catch {
        // El toast lo muestra el MutationCache global (ver main.tsx).
      }
      return;
    }

    start();
  };

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-full items-center gap-2 px-4 sm:px-6">
        {/* Menú móvil */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Concepto del registro en curso */}
        <input
          type="text"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder={isDone ? "¿Qué hiciste?" : "¿Qué estás haciendo?"}
          aria-label="Concepto del registro"
          className="h-10 min-w-0 flex-1 rounded-md bg-transparent px-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:bg-muted/60 focus:placeholder:text-muted-foreground/70 sm:px-3"
        />

        {/* Cluster derecho */}
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-primary sm:inline-flex"
            title="Proyectos — próximamente"
            aria-label="Proyectos (próximamente)"
            disabled
          >
            <Folder className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden text-muted-foreground sm:inline-flex"
            title="Etiquetas — próximamente"
            aria-label="Etiquetas (próximamente)"
            disabled
          >
            <Tag className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link to="/report" />}
          >
            <DollarSign className="h-4 w-4" />
          </Button>

          {/* Switch de modo */}
          <TrackerModeSwitch mode={mode} onModeChange={changeMode} />

          {/* Cronómetro — abre el panel manual */}
          <Popover
            open={manual.isOpen}
            onOpenChange={(open) => {
              if (!open) manual.close();
            }}
          >
            <PopoverTrigger
              className={cn(
                "mx-1 rounded-md px-2 font-mono text-lg font-bold tabular-nums transition-colors",
                "hidden sm:inline-block",
                isDone
                  ? "border border-border hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  : "text-foreground",
                isRunning && !isDone && "text-primary",
              )}
              title="Registrar una entrada de horario"
            >
              {formatDurationHMS(elapsed)}
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={8} className="w-[380px] p-4">
              {user && profile && (
                <ManualEntryForm
                  userId={user.id}
                  profileType={profile.type}
                  concept={concept}
                  entry={manual.target}
                  onSaved={() => manual.close()}
                />
              )}
            </PopoverContent>
          </Popover>

          {/* Botón redondo: play / pausa / + */}
          <Button
            size="icon"
            onClick={handleToggle}
            disabled={isSaving}
            aria-label={
              isRunning
                ? "Detener registro"
                : isDone
                  ? "Registrar entrada"
                  : "Iniciar registro"
            }
            title={
              isRunning
                ? "Detener"
                : isDone
                  ? "Registrar una entrada que ya ocurrió"
                  : "Iniciar"
            }
            className={cn(
              "size-9 rounded-full",
              isDone && !isRunning
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {isRunning ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : isDone ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link to="/history" />}
          >
            <Timer className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
