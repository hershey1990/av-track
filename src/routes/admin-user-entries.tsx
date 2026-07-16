import { useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { usePeriodEntries } from '@/features/time-entries/hooks/use-entries'
import { DayRow } from '@/features/time-entries/components/day-row'
import { usePeriods } from '@/features/reports/hooks/use-periods'
import { ExcelExport } from '@/features/reports/components/excel-export'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateFull } from '@/lib/timezone'
import { calcPeriodSummary, generatePeriodDays } from '@/lib/calculations'

export default function UserEntriesPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const { data: currentProfile, isLoading } = useProfile(user?.id)
  const { data: targetProfile } = useProfile(id)
  const { data: periods } = usePeriods()
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const { data: entries } = usePeriodEntries(id, selectedPeriodId ?? undefined)
  const selectedPeriod = periods?.find((p) => p.id === selectedPeriodId)

  const summary = useMemo(
    () => entries && targetProfile
      ? calcPeriodSummary(entries, targetProfile.type, targetProfile.viatico)
      : null,
    [entries, targetProfile]
  )

  const allPeriodDays = useMemo(
    () => entries && selectedPeriod && targetProfile
      ? generatePeriodDays(
          entries,
          selectedPeriod.start_date,
          selectedPeriod.end_date,
          targetProfile.type,
          targetProfile.viatico
        )
      : null,
    [entries, selectedPeriod, targetProfile]
  )

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Cargando...</p>
  if (currentProfile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Acceso restringido</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-semibold tracking-tight">
        Entradas de {targetProfile?.full_name ?? '...'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Seleccionar período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedPeriodId ?? undefined} onValueChange={setSelectedPeriodId}>
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

          {selectedPeriod && (
            <p className="text-sm text-muted-foreground">
              {formatDateFull(selectedPeriod.start_date)} — {formatDateFull(selectedPeriod.end_date)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading">Registros</CardTitle>
          {allPeriodDays && targetProfile && selectedPeriod && summary && (
            <ExcelExport
              days={allPeriodDays}
              period={selectedPeriod}
              profile={targetProfile}
              fileName={`${targetProfile.full_name.trim().replace(/\s+/g, '_')}_${selectedPeriod.name.trim().replace(/\s+/g, '_')}.xlsx`}
            />
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!selectedPeriodId ? (
            <p className="p-4 text-muted-foreground">Seleccioná un período para ver y exportar registros</p>
          ) : entries && entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Fecha</th>
                    <th className="text-left p-2 font-medium">Entrada</th>
                    <th className="text-left p-2 font-medium">Salida</th>
                    <th className="text-left p-2 font-medium">Horas</th>
                    <th className="text-left p-2 font-medium">Concepto</th>
                    <th className="text-left p-2 font-medium">Viático</th>
                    <th className="text-left p-2 font-medium" />
                  </tr>
                </thead>
                <tbody>{entries.map((entry) => <DayRow key={entry.id} entry={entry} profileType={targetProfile?.type} />)}</tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-muted-foreground">Sin registros</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
