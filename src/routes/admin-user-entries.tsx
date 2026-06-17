import { useParams } from 'react-router-dom'
import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { useEntries } from '@/features/time-entries/hooks/use-entries'
import { DayRow } from '@/features/time-entries/components/day-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UserEntriesPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useUser()
  const { data: currentProfile, isLoading } = useProfile(user?.id)
  const { data: targetProfile } = useProfile(id)
  const { data: entries } = useEntries(id)

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Cargando...</p>
  if (currentProfile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Acceso restringido</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Entradas de {targetProfile?.full_name ?? '...'}</h1>
      <Card>
        <CardHeader><CardTitle className="text-lg">Registros</CardTitle></CardHeader>
        <CardContent className="p-0">
          {entries && entries.length > 0 ? (
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
                <tbody>{entries.map((entry) => <DayRow key={entry.id} entry={entry} />)}</tbody>
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
