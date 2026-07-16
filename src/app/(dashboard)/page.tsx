'use client'

import { useMemo } from 'react'
import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { usePeriods } from '@/features/reports/hooks/use-periods'
import { usePeriodEntries } from '@/features/time-entries/hooks/use-entries'
import { TimeEntryCard } from '@/features/time-entries/components/time-entry-card'
import { DashboardKpiCards } from '@/features/time-entries/components/dashboard-kpi'
import { PeriodSummaryTable } from '@/features/reports/components/period-summary'
import { AbsenceRequestCard } from '@/features/absences/components/absence-request-card'
import { AbsenceList } from '@/features/absences/components/absence-list'
import { IncomingSwaps } from '@/features/shift-swaps/components/incoming-swaps'
import { SwapRequestForm } from '@/features/shift-swaps/components/swap-request-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcPeriodSummary } from '@/lib/calculations'

export default function DashboardPage() {
  const { user } = useUser()
  const { data: profile } = useProfile(user?.id)
  const { data: periods } = usePeriods()
  const activePeriod = periods?.[0]
  const { data: entries } = usePeriodEntries(user?.id, activePeriod?.id)

  const summary = useMemo(
    () => entries && profile ? calcPeriodSummary(entries, profile.type, profile.viatico) : null,
    [entries, profile],
  )

  if (!user) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {profile?.full_name ? `Hola, ${profile.full_name}` : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {activePeriod ? `Período activo: ${activePeriod.name}` : 'Sin período activo'}
        </p>
      </div>

      {profile && (
        <>
          <DashboardKpiCards
            userId={user.id}
            profileType={profile.type}
            viaticoRate={profile.viatico}
            periodTotalHours={summary?.total_hours}
            periodTotalExtraHours={summary?.total_extra_hours}
          />
          <TimeEntryCard userId={user.id} profileType={profile.type} />
          <AbsenceRequestCard userId={user.id} />
          <AbsenceList userId={user.id} />
          <IncomingSwaps />
          <SwapRequestForm />
        </>
      )}

      {activePeriod && entries && profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen del período</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PeriodSummaryTable
              entries={entries}
              type={profile.type}
              viaticoRate={profile.viatico}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
