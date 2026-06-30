'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { usePeriods } from '@/features/reports/hooks/use-periods'
import { usePeriodEntries } from '@/features/time-entries/hooks/use-entries'
import { PeriodSummaryTable } from '@/features/reports/components/period-summary'
import { ExcelExport } from '@/features/reports/components/excel-export'
import { PdfExport } from '@/features/reports/components/pdf-export'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calcPeriodSummary, generatePeriodDays } from '@/lib/calculations'
import { formatDateFull } from '@/lib/timezone'
import { useMemo } from 'react'

export default function ReportPage() {
  const { user } = useUser()
  const { data: profile } = useProfile(user?.id)
  const { data: periods } = usePeriods()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const { data: entries } = usePeriodEntries(user?.id, selectedPeriodId ?? undefined)

  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId)

  const summary = useMemo(
    () => entries && profile ? calcPeriodSummary(entries, profile.type, profile.viatico) : null,
    [entries, profile]
  )

  const allPeriodDays = useMemo(
    () => entries && selectedPeriod && profile
      ? generatePeriodDays(entries, selectedPeriod.start_date, selectedPeriod.end_date, profile.type, profile.viatico)
      : null,
    [entries, selectedPeriod, profile]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      <div className="space-y-2">
        <Label>Seleccionar período</Label>
        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí un período..." />
          </SelectTrigger>
          <SelectContent>
            {periods?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} {p.is_locked ? '(🔒)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPeriod && (
        <p className="text-sm text-muted-foreground">
          {formatDateFull(selectedPeriod.start_date)} —{' '}
          {formatDateFull(selectedPeriod.end_date)}
        </p>
      )}

      {entries && profile && selectedPeriod && summary && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{selectedPeriod.name}</CardTitle>
              <div className="flex gap-2">
                <ExcelExport
                  days={allPeriodDays!}
                  period={selectedPeriod}
                  profile={profile}
                />
                <PdfExport
                  days={allPeriodDays!}
                  period={selectedPeriod}
                  profile={profile}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <PeriodSummaryTable
                entries={entries}
                type={profile.type}
                viaticoRate={profile.viatico}
              />
            </CardContent>
          </Card>
        </>
      )}

      {!selectedPeriodId && (
        <p className="text-muted-foreground text-center py-8">
          Seleccioná un período para ver el reporte
        </p>
      )}
    </div>
  )
}
