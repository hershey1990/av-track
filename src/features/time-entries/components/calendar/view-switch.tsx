"use client";

import { CalendarRange, Timer } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Control segmentado para alternar entre la vista de timer (dashboard) y la de
 * calendario.
 *
 * El estado vive en la URL (`/` vs `/calendar`), de modo que recargar o usar
 * el botón "atrás" del navegador mantiene la vista activa.
 */
export function ViewSwitch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isCalendar = pathname === "/calendar";

  return (
    <div
      role="tablist"
      aria-label="Cambiar vista"
      className="inline-flex items-center gap-1 rounded-lg bg-muted p-1"
    >
      <Button
        role="tab"
        aria-selected={!isCalendar}
        variant={isCalendar ? "ghost" : "default"}
        size="sm"
        className={cn("gap-1.5", !isCalendar && "shadow-sm")}
        onClick={() => navigate("/")}
      >
        <Timer className="h-3.5 w-3.5" />
        Timer
      </Button>
      <Button
        role="tab"
        aria-selected={isCalendar}
        variant={isCalendar ? "default" : "ghost"}
        size="sm"
        className={cn("gap-1.5", isCalendar && "shadow-sm")}
        onClick={() => navigate("/calendar")}
      >
        <CalendarRange className="h-3.5 w-3.5" />
        Calendario
      </Button>
    </div>
  );
}
