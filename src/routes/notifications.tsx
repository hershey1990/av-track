"use client";

import { useUser } from "@/hooks/use-user";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/features/notifications/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { typeIcon } from "@/features/notifications/utils";

export default function NotificationsPage() {
  const { user } = useUser();
  const { data: notifications, isLoading } = useNotifications(user?.id);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead(user?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Notificaciones
        </h1>
        {notifications && notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Leer todas
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/8">
        {isLoading && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Cargando...
          </p>
        )}

        {!isLoading && notifications?.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No hay notificaciones
          </p>
        )}

        {notifications?.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => !n.is_read && markAsRead.mutate(n.id)}
            className="flex w-full items-start gap-3 border-b border-border px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/50"
          >
            <span className="mt-0.5 text-lg">{typeIcon(n.type)}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-foreground">
                {n.title}
              </span>
              <span className="text-sm text-muted-foreground">{n.message}</span>
              <span className="mt-1 text-xs text-muted-foreground/80">
                {formatDistanceToNow(new Date(n.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </span>
            {!n.is_read && (
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
