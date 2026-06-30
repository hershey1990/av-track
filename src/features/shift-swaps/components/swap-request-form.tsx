'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { useCreateSwapRequest } from '../hooks/use-shift-swaps'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Repeat } from 'lucide-react'

interface Props {
  onSuccess?: () => void
}

export function SwapRequestForm({ onSuccess }: Props) {
  const { user } = useUser()
  const createSwap = useCreateSwapRequest()
  const [targetId, setTargetId] = useState('')
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !targetId || !date) return
    createSwap.mutate(
      {
        requester_id: user.id,
        target_id: targetId,
        date,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          setTargetId('')
          setDate('')
          setReason('')
          onSuccess?.()
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Solicitar Cambio de Turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">ID del compañero</label>
            <input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="UUID del usuario"
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Fecha del cambio</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Motivo (opcional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="¿Por qué necesitas el cambio?"
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" disabled={createSwap.isPending}>
            {createSwap.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Solicitud
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
