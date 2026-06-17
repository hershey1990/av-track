import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { PeriodList } from "@/features/admin/components/period-list";
import { UserList } from "@/features/admin/components/user-list";

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
      <PeriodList />
      <UserList />
    </div>
  );
}
