"use client";

import { useUser } from "@/hooks/use-user";
import { SwapRequestForm } from "@/features/shift-swaps/components/swap-request-form";
import { IncomingSwaps } from "@/features/shift-swaps/components/incoming-swaps";
import { MySwapRequests } from "@/features/shift-swaps/components/my-swap-requests";

export default function ShiftSwapsPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cambios de turno
        </h1>
        <p className="text-sm text-muted-foreground">
          Pedile a un compañero que cubra tu turno, respondé los cambios que te
          llegan y seguí el estado de tus solicitudes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <SwapRequestForm />
        </div>
        <div className="space-y-6">
          <IncomingSwaps />
          <MySwapRequests />
        </div>
      </div>
    </div>
  );
}
