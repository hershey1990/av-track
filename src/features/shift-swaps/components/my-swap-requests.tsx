"use client";

import { useUser } from "@/hooks/use-user";
import {
  useMySwapRequests,
  useCancelSwapRequest,
} from "../hooks/use-shift-swaps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Repeat, X, Loader2 } from "lucide-react";
import { formatDateFull } from "@/lib/timezone";
import type { SwapStatus } from "@/types";

const STATUS_LABELS: Record<SwapStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

const STATUS_VARIANTS: Record<
  SwapStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  accepted: "default",
  pending: "secondary",
  rejected: "destructive",
  cancelled: "outline",
};

export function MySwapRequests() {
  const { user } = useUser();
  const { data: swaps, isLoading, isError } = useMySwapRequests(user?.id);
  const cancelSwap = useCancelSwapRequest();

  const handleCancel = async (id: string) => {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    await cancelSwap.mutateAsync(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          Mis solicitudes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        )}

        {isError && (
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar tus solicitudes.
          </p>
        )}

        {!isLoading && !isError && !swaps?.length && (
          <p className="text-sm text-muted-foreground">
            Todavía no enviaste ninguna solicitud de cambio.
          </p>
        )}

        {swaps?.map((swap) => (
          <div
            key={swap.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatDateFull(swap.date)}</span>
                <Badge variant={STATUS_VARIANTS[swap.status] ?? "outline"}>
                  {STATUS_LABELS[swap.status] ?? swap.status}
                </Badge>
              </div>
              {swap.reason && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {swap.reason}
                </p>
              )}
            </div>

            {swap.status === "pending" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive"
                onClick={() => handleCancel(swap.id)}
                aria-label="Cancelar solicitud"
                disabled={cancelSwap.isPending}
              >
                {cancelSwap.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
