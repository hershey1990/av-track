'use client'

import { useUser } from '@/hooks/use-user'
import { usePendingSwapsForMe, useRespondToSwap } from '../hooks/use-shift-swaps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Repeat, Loader2 } from 'lucide-react'

export function IncomingSwaps() {
  const { user } = useUser()
  const { data: swaps, isLoading } = usePendingSwapsForMe(user?.id)
  const respond = useRespondToSwap()

  if (isLoading) return null
  if (!swaps?.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Solicitudes de Cambio Recibidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {swaps.map((swap) => (
          <div
            key={swap.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Cambio para {new Date(swap.date + 'T12:00:00').toLocaleDateString('es-ES')}
              </p>
              {swap.reason && (
                <p className="text-xs text-muted-foreground">{swap.reason}</p>
              )}
              <Badge variant="secondary">Pendiente</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600"
                onClick={() => respond.mutate({ id: swap.id, status: 'accepted' })}
                disabled={respond.isPending}
              >
                {respond.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => respond.mutate({ id: swap.id, status: 'rejected' })}
                disabled={respond.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
