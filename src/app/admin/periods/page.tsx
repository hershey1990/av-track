'use client'

import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { usePeriods, useUpdatePeriod } from '@/features/reports/hooks/use-periods'
import { PeriodForm } from '@/features/admin/components/period-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock } from 'lucide-react'
import { formatDateFull } from '@/lib/timezone'

export default function AdminPeriodsPage() {
  const { user } = useUser()
  const { data: profile, isLoading } = useProfile(user?.id)
  const { data: periods } = usePeriods()
  const updatePeriod = useUpdatePeriod()

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Cargando...</p>
  if (profile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Acceso restringido</p>
  }

  const toggleLock = async (id: string, current: boolean) => {
    await updatePeriod.mutateAsync({ id, values: { is_locked: !current } })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Períodos</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nuevo período</CardTitle>
        </CardHeader>
        <CardContent>
          <PeriodForm userId={user!.id} onSuccess={() => {}} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Períodos creados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {periods?.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDateFull(p.start_date)} — {formatDateFull(p.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={p.is_locked ? 'destructive' : 'secondary'}>
                  {p.is_locked ? 'Bloqueado' : 'Activo'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLock(p.id, p.is_locked)}
                >
                  {p.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
          {(!periods || periods.length === 0) && (
            <p className="text-muted-foreground text-sm">No hay períodos creados</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
