"use client";

import { useUser } from "@/hooks/use-user";
import { AbsenceRequestCard } from "@/features/absences/components/absence-request-card";
import { AbsenceList } from "@/features/absences/components/absence-list";

export default function AbsencesPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ausencias</h1>
        <p className="text-sm text-muted-foreground">
          Solicita vacaciones, días por enfermedad o compensatorios, y seguí el
          estado de cada solicitud.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <AbsenceRequestCard userId={user.id} />
        </div>
        <div className="space-y-6">
          <AbsenceList userId={user.id} />
        </div>
      </div>
    </div>
  );
}
