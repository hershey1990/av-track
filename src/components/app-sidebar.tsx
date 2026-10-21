"use client";

import { Link } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarNav } from "@/components/sidebar-nav";
import { SmoothScrollArea } from "@/components/smooth-scroll-area";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { signOut } from "@/features/auth/api";
import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const initials = profile?.full_name?.substring(0, 2).toUpperCase() ?? "U";
  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca + notificaciones */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-5">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-baseline gap-1 leading-none"
        >
          <BrandLogo variant="light" />
        </Link>
        <div className="ml-auto">
          <NotificationBell variant="dark" />
        </div>
      </div>

      {/* Menú */}
      <SmoothScrollArea className="min-h-0 flex-1">
        <div className="pb-4">
          <SidebarNav isAdmin={isAdmin} onNavigate={onNavigate} />
        </div>
      </SmoothScrollArea>

      {/* Usuario */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/60">
            <Avatar className="size-8">
              <AvatarFallback className="bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {profile?.full_name ?? "Usuario"}
              </span>
              <span className="truncate text-xs capitalize text-sidebar-foreground/55">
                {profile?.role ?? "usuario"}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="min-w-52">
            <DropdownMenuItem>
              <Link to="/settings" className="flex w-full items-center gap-2">
                <Settings className="h-4 w-4" />
                Ajustes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} variant="destructive">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
