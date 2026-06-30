import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { PeriodList } from "@/features/admin/components/period-list";
import { UserList } from "@/features/admin/components/user-list";
import { AdminAbsenceList } from "@/features/absences/components/admin-absence-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function AdminPage() {
  const { user } = useUser();
  const { data: profile, isLoading } = useProfile(user?.id);

  if (isLoading)
    return (
      <p className="text-center text-muted-foreground py-8">Cargando...</p>
    );
  if (profile?.role !== "admin") {
    return (
      <p className="text-center text-muted-foreground py-8">
        Acceso restringido
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel Admin</h1>
      <AdminAbsenceList />
      <PeriodList />
      <UserList />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Configuración</CardTitle>
          <Link to="/admin/policy">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="h-4 w-4" /> Gestionar
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Política de recargos, entradas múltiples y configuración de horas nocturnas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
