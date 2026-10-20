"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

function TabsRoot({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "flex items-center gap-1 border-b border-border text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsTab({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-2 text-sm font-medium transition-colors outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[selected]:text-foreground",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors data-[selected]:after:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

function TabsIndicator({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Indicator>) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn("z-10 h-0.5 w-full bg-primary", className)}
      {...props}
    />
  );
}

export { TabsRoot, TabsList, TabsTab, TabsPanel, TabsIndicator };
