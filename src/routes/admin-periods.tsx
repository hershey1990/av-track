import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import {
  usePeriods,
  useUpdatePeriod,
} from "@/features/reports/hooks/use-periods";
import { PeriodForm } from "@/features/admin/components/period-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Unlock, Pencil, Plus } from "lucide-react";
import { formatDateFull } from "@/lib/timezone";
import type { Period } from "@/types";

export default function AdminPeriodsPage() {
  const { user } = useUser();
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: periods } = usePeriods();
  const updatePeriod = useUpdatePeriod();
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isLoading)
    return (
      <p className="text-center text-muted-foreground py-8">Cargando...</p>
    );
  if (profile?.role !== "admin") {
    return (
      <p className="text-center text-muted-foreground py-8">
        Acceso restringido
      </p>
    );
  }

  const toggleLock = async (id: string, current: boolean) => {
    await updatePeriod.mutateAsync({ id, values: { is_locked: !current } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Períodos</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" />
          Nuevo período
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Períodos creados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {periods?.length ? (
            periods.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDateFull(p.start_date)} —{" "}
                    {formatDateFull(p.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={p.is_locked ? "destructive" : "secondary"}>
                    {p.is_locked ? "Bloqueado" : "Activo"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Editar ${p.name}`}
                    onClick={() => setEditingPeriod(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={
                      p.is_locked
                        ? `Desbloquear ${p.name}`
                        : `Bloquear ${p.name}`
                    }
                    onClick={() => toggleLock(p.id, p.is_locked)}
                  >
                    {p.is_locked ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay períodos. Creá el primero con el botón "Nuevo
              período".
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create period dialog */}
      <Dialog
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) setIsCreating(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo período</DialogTitle>
            <DialogDescription>
              Si dejás el nombre vacío se genera con las fechas. El período
              tiene que empezar después del último período cerrado y no puede
              solaparse con otro.
            </DialogDescription>
          </DialogHeader>
          {isCreating && (
            <PeriodForm
              userId={user!.id}
              onCancel={() => setIsCreating(false)}
              onSuccess={() => setIsCreating(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit period dialog */}
      <Dialog
        open={!!editingPeriod}
        onOpenChange={(open) => {
          if (!open) setEditingPeriod(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar período</DialogTitle>
            <DialogDescription>
              Si borrás el nombre se vuelve a generar con las fechas.
            </DialogDescription>
          </DialogHeader>
          {editingPeriod && (
            <PeriodForm
              userId={user!.id}
              period={editingPeriod}
              onCancel={() => setEditingPeriod(null)}
              onSuccess={() => setEditingPeriod(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
