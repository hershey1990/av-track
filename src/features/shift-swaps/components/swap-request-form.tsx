"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useColleagues, useCreateSwapRequest } from "../hooks/use-shift-swaps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Repeat } from "lucide-react";

interface Props {
  onSuccess?: () => void;
}

export function SwapRequestForm({ onSuccess }: Props) {
  const { user } = useUser();
  const createSwap = useCreateSwapRequest();
  const {
    data: colleagues = [],
    isLoading: loadingColleagues,
    isError: errorColleagues,
  } = useColleagues();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !targetId || !date) return;
    createSwap.mutate(
      {
        requester_id: user.id,
        target_id: targetId,
        date,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          setTargetId(null);
          setDate("");
          setReason("");
          onSuccess?.();
        },
      },
    );
  };

  const items = colleagues.map((c) => ({ value: c.id, label: c.full_name }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          Solicitar cambio de turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="swap-target">Compañero</Label>
            <Select items={items} value={targetId} onValueChange={setTargetId}>
              <SelectTrigger id="swap-target" className="w-full">
                <SelectValue placeholder="Elegí un compañero..." />
              </SelectTrigger>
              <SelectContent>
                {colleagues.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loadingColleagues && (
              <p className="text-xs text-muted-foreground">
                Cargando compañeros...
              </p>
            )}
            {errorColleagues && (
              <p className="text-xs text-muted-foreground">
                No se pudo cargar la lista de compañeros.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="swap-date">Fecha del cambio</Label>
            <DatePicker
              id="swap-date"
              value={date || undefined}
              onValueChange={(value) => setDate(value ?? "")}
              placeholder="Elegí la fecha"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="swap-reason">Motivo (opcional)</Label>
            <textarea
              id="swap-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="¿Por qué necesitas el cambio?"
              rows={2}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button
            type="submit"
            disabled={createSwap.isPending || !targetId || !date}
          >
            {createSwap.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enviar solicitud
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
