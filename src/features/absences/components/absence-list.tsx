'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAbsences, useDeleteAbsence } from '../hooks/use-absences'
import { formatDateShort } from '@/lib/timezone'
import { Trash2 } from 'lucide-react'
import type { Absence } from '@/types'

interface Props {
  userId: string
}

const TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacaciones',
  sick: 'Enfermedad',
  compensatory: 'Compensatorio',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
}

export function AbsenceList({ userId }: Props) {
  const { data: absences } = useAbsences(userId)
  const deleteAbsence = useDeleteAbsence()

  if (!absences || absences.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mis ausencias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {absences.slice(0, 5).map((a: Absence) => (
          <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{TYPE_LABELS[a.type] ?? a.type}</span>
                <Badge variant={STATUS_VARIANTS[a.status] ?? 'outline'}>
                  {a.status === 'approved' ? 'Aprobado' : a.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {formatDateShort(a.start_date)} — {formatDateShort(a.end_date)}
                {a.reason && ` · ${a.reason}`}
              </p>
            </div>
            {a.status === 'pending' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive shrink-0"
                onClick={() => deleteAbsence.mutateAsync(a.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
