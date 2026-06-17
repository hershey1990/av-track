'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { useEntries } from '@/features/time-entries/hooks/use-entries'
import { DayRow } from '@/features/time-entries/components/day-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function HistoryPage() {
  const { user } = useUser()
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().substring(0, 10)

  const [from, setFrom] = useState(firstDay)
  const [to, setTo] = useState(lastDay)

  const { data: entries, isLoading } = useEntries(user?.id, from, to)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Desde</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Hasta</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-muted-foreground">Cargando...</p>
          ) : entries && entries.length > 0 ? (
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Viático</TableHead>
                  <TableHead />
                </tr>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <DayRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-4 text-muted-foreground">Sin registros en este período</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
