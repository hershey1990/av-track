'use client'

import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { usePolicyConfig, useUpdatePolicyConfig } from '@/features/admin/hooks/use-policy-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function AdminPolicyPage() {
  const { user } = useUser()
  const { data: profile, isLoading } = useProfile(user?.id)
  const { data: policy, isLoading: policyLoading } = usePolicyConfig()
  const updatePolicy = useUpdatePolicyConfig()

  if (isLoading || policyLoading) {
    return <p className="text-center text-muted-foreground py-8">Cargando...</p>
  }
  if (profile?.role !== 'admin') {
    return <p className="text-center text-muted-foreground py-8">Acceso restringido</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración de política</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entradas múltiples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Permite a los usuarios registrar múltiples entradas de tiempo en un mismo día
            (ej. entrada, salida a almorzar, entrada, salida).
          </p>

          {policy ? (
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="multi-entry-toggle" className="text-sm font-medium cursor-pointer">
                Multi-entry habilitado
              </Label>
              <Switch
                id="multi-entry-toggle"
                checked={policy.multi_entry_enabled ?? false}
                onCheckedChange={(checked) =>
                  updatePolicy.mutate({
                    id: policy.id,
                    values: { multi_entry_enabled: checked },
                  })
                }
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay configuración de política. Crea una desde la base de datos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
