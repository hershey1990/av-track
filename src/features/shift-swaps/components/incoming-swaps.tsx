"use client";

import { useUser } from "@/hooks/use-user";
import {
  usePendingSwapsForMe,
  useRespondToSwap,
} from "../hooks/use-shift-swaps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Repeat, Loader2 } from "lucide-react";
import { formatDateShort } from "@/lib/timezone";

export function IncomingSwaps() {
  const { user } = useUser();
  const { data: swaps, isLoading, isError } = usePendingSwapsForMe(user?.id);
  const respond = useRespondToSwap();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          Cambios recibidos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        )}

        {isError && (
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar los cambios recibidos.
          </p>
        )}

        {!isLoading && !isError && !swaps?.length && (
          <p className="text-sm text-muted-foreground">
            No tenés cambios de turno pendientes por responder.
          </p>
        )}

        {swaps?.map((swap) => (
          <div
            key={swap.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-3"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">
                {formatDateShort(swap.date)}
              </p>
              {swap.reason && (
                <p className="truncate text-xs text-muted-foreground">
                  {swap.reason}
                </p>
              )}
              <Badge variant="secondary">Pendiente</Badge>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={() =>
                  respond.mutate({ id: swap.id, status: "accepted" })
                }
                disabled={respond.isPending}
                aria-label="Aceptar cambio"
              >
                {respond.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() =>
                  respond.mutate({ id: swap.id, status: "rejected" })
                }
                disabled={respond.isPending}
                aria-label="Rechazar cambio"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
