"use client";

import { useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { ManualEntryProvider } from "@/features/time-entries/hooks/manual-entry-context";
import { NotificationRealtimeSync } from "@/features/notifications/components/notification-realtime-sync";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ManualEntryProvider>
      <NotificationRealtimeSync />
      <div className="min-h-full">
        {/* Sidebar fijo (escritorio) */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 lg:block">
          <AppSidebar />
        </aside>

        {/* Drawer (móvil) */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent
            side="left"
            className="w-56 border-r-0 p-0"
            showCloseButton={false}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navegación</SheetTitle>
              <SheetDescription>Menú principal</SheetDescription>
            </SheetHeader>
            <AppSidebar onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Contenido */}
        <div className="lg:pl-56">
          <AppTopbar onOpenMenu={() => setMenuOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </ManualEntryProvider>
  );
}
