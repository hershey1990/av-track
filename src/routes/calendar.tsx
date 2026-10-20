"use client";

import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { CalendarView } from "@/features/time-entries/components/calendar/calendar-view";
import { ViewSwitch } from "@/features/time-entries/components/calendar/view-switch";

export default function CalendarPage() {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);

  if (!user || !profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="text-sm text-muted-foreground">
            Pulsa un día para registrar o revisar tus horas.
          </p>
        </div>
        <ViewSwitch />
      </div>

      <CalendarView
        userId={user.id}
        profileType={profile.type}
        workingDays={profile.working_days ?? []}
      />
    </div>
  );
}
