"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { typeIcon } from "../utils";
import type { Notification } from "@/types";

export function NotificationBell({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { user } = useUser();
  const {
    data: notifications,
    unreadCount,
    isLoading,
  } = useNotifications(user?.id);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead(user?.id);
  const [open, setOpen] = useState(false);

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    setOpen(false);
  };

  if (!user) return null;

  const isDark = variant === "dark";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={
          isDark
            ? "relative inline-flex items-center justify-center h-8 w-8 rounded-md text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-white transition-colors cursor-pointer"
            : "relative inline-flex items-center justify-center h-8 w-8 rounded-md text-foreground hover:bg-muted transition-colors cursor-pointer"
        }
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-bold text-white ring-2 ring-sidebar">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3" />
              Leer todas
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Cargando...
            </p>
          )}
          {!isLoading && notifications?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay notificaciones
            </p>
          )}
          {notifications?.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                !n.is_read ? "bg-muted/20" : ""
              }`}
              onClick={() => handleNotificationClick(n)}
            >
              <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {n.message}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              {!n.is_read && (
                <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-2">
          <Link
            to="/notifications"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Ver todas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
