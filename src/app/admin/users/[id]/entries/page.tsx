'use client'

import { use } from 'react'
import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { useEntries } from '@/features/time-entries/hooks/use-entries'
import { DayRow } from '@/features/time-entries/components/day-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableHead,
} from '@/components/ui/table'

export default function UserEntriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useUser()
  const { data: currentProfile } = useProfile(user?.id)
  const { data: targetProfile } = useProfile(id)
  const { data: entries } = useEntries(id)

  if (currentProfile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Acceso restringido</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Entradas de {targetProfile?.full_name ?? '...'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries && entries.length > 0 ? (
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
            <p className="p-4 text-muted-foreground">Sin registros</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
