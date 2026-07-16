'use client'

import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { useAllAbsences, useUpdateAbsenceStatus, useDeleteAbsence } from '@/features/absences/hooks/use-absences'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/timezone'
import { Check, X, Trash2 } from 'lucide-react'
import type { Absence } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacaciones',
  sick: 'Enfermedad',
  compensatory: 'Compensatorio',
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-rose-100 text-rose-800',
}

export function AdminAbsenceList() {
  const { user } = useUser()
  const { data: profile } = useProfile(user?.id)
  const { data: absences } = useAllAbsences()
  const updateStatus = useUpdateAbsenceStatus()
  const deleteAbsence = useDeleteAbsence()

  // Admin check — we rely on the parent page to guard, but double-check
  if (profile?.role !== 'admin') return null

  if (!absences || absences.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg font-heading">Solicitudes de ausencia</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sin solicitudes pendientes</p>
        </CardContent>
      </Card>
    )
  }

  const handleApprove = (id: string) => {
    updateStatus.mutate({ id, status: 'approved', reviewedBy: user!.id })
  }

  const handleReject = (id: string) => {
    updateStatus.mutate({ id, status: 'rejected', reviewedBy: user!.id })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Solicitudes de ausencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {absences.map((a) => (
          <div key={a.id} className="p-3 rounded-lg border border-border bg-muted/20 text-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{a.profile?.full_name ?? a.user_id.substring(0, 8)}</span>
                  <span className="text-muted-foreground">{TYPE_LABELS[a.type] ?? a.type}</span>
                  <Badge className={STATUS_STYLES[a.status] ?? ''}>
                    {a.status === 'approved' ? 'Aprobado' : a.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {formatDateShort(a.start_date)} — {formatDateShort(a.end_date)}
                  {a.reason && ` · ${a.reason}`}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {a.status === 'pending' && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-700 hover:bg-emerald-50" onClick={() => handleApprove(a.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleReject(a.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => deleteAbsence.mutateAsync(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
