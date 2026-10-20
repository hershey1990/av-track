"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { NAV_SECTIONS, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  /** Sólo para el usuario actual */
  isAdmin: boolean;
  /** Se invoca al navegar (para cerrar el drawer móvil) */
  onNavigate?: () => void;
}

function isItemActive(pathname: string, item: NavItem): boolean {
  if (!item.to) return false;
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function SidebarNav({ isAdmin, onNavigate }: SidebarNavProps) {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);

  const visibleItems = (items: NavItem[]) =>
    items.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="flex flex-col gap-5 px-3">
      {NAV_SECTIONS.map((section) => {
        const items = visibleItems(section.items);
        if (items.length === 0) return null;

        return (
          <div key={section.title} className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-primary">
              {section.title}
            </span>

            {items.map((item) => {
              const hasChildren = !!item.children?.length;

              if (hasChildren) {
                const childItems = visibleItems(item.children!);
                const open =
                  expanded || childItems.some((c) => isItemActive(pathname, c));

                return (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                          open && "rotate-180",
                        )}
                      />
                    </button>

                    {open && (
                      <div className="ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                        {childItems.map((child) => (
                          <SidebarLink
                            key={child.label}
                            item={child}
                            active={isItemActive(pathname, child)}
                            onNavigate={onNavigate}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <SidebarLink
                  key={item.label}
                  item={item}
                  active={isItemActive(pathname, item)}
                  onNavigate={onNavigate}
                />
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const base =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";

  // Item sin ruta: placeholder atenuado, sin hover y sin navegación.
  if (!item.to) {
    return (
      <span
        aria-disabled="true"
        title="Disponible próximamente"
        className={cn(base, "cursor-not-allowed text-sidebar-foreground/35")}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}
