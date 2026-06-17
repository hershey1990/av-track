import { Link } from "react-router-dom";
import { useAllProfiles } from "@/features/admin/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UserList() {
  const { data: profiles, isLoading, isError } = useAllProfiles();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Usuarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-muted-foreground text-sm">Cargando...</p>}
        {isError && <p className="text-destructive text-sm">Error al cargar usuarios</p>}
        {!isLoading && !isError && profiles?.length === 0 && (
          <p className="text-muted-foreground text-sm">No hay usuarios</p>
        )}
        {profiles?.map((p) => (
          <Link key={p.id} to={`/admin/users/${p.id}`}>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.full_name}</span>
                <Badge
                  variant={p.type === "fulltime" ? "default" : "secondary"}
                >
                  {p.type === "fulltime" ? "FT" : "PT"}
                </Badge>
              </div>
              <Badge variant={p.role === "admin" ? "outline" : "ghost"}>
                {p.role}
              </Badge>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
