'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { useApprovePeriod, useRejectPeriod } from '@/features/reports/hooks/use-periods'
import { SignaturePad } from '@/components/ui/signature-pad'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import type { Period } from '@/types'

interface Props {
  period: Period
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  approved: { label: 'Aprobado', variant: 'default' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
}

export function ApprovalPanel({ period }: Props) {
  const { user } = useUser()
  const { data: profile } = useProfile(user?.id)
  const approve = useApprovePeriod()
  const reject = useRejectPeriod()
  const [showSignature, setShowSignature] = useState(false)
  const [note, setNote] = useState('')
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'
  const status = STATUS_LABELS[period.approval_status] || STATUS_LABELS.pending

  const handleApprove = () => {
    if (!user?.id) return
    approve.mutate({ id: period.id, userId: user.id, note: note || undefined })
  }

  const handleReject = () => {
    if (!user?.id) return
    reject.mutate({ id: period.id, userId: user.id, note: note || undefined })
  }

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl)
    setShowSignature(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Aprobación</CardTitle>
        <Badge variant={status.variant}>
          {period.approval_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
          {period.approval_status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
          {period.approval_status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {period.approval_note && (
          <div className="text-sm">
            <span className="font-medium">Nota:</span> {period.approval_note}
          </div>
        )}

        {isAdmin && period.approval_status === 'pending' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nota (opcional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Agregar comentario..."
                rows={2}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {showSignature ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Firmar para aprobar:
                </p>
                <SignaturePad onSave={handleSignatureSave} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignature(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : signatureDataUrl ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Firma capturada:</p>
                <img
                  src={signatureDataUrl}
                  alt="Firma"
                  className="border rounded-md h-16"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleApprove} disabled={approve.isPending}>
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={reject.isPending}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowSignature(true)}>
                  Firmar y Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={reject.isPending}
                >
                  Rechazar
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
