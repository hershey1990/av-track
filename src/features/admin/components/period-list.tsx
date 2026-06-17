import { Link } from "react-router-dom";
import {
  usePeriods,
  useUpdatePeriod,
} from "@/features/reports/hooks/use-periods";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";

export function PeriodList() {
  const { data: periods } = usePeriods();
  const updatePeriod = useUpdatePeriod();

  const toggleLock = async (id: string, current: boolean) => {
    await updatePeriod.mutateAsync({ id, values: { is_locked: !current } });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Períodos</CardTitle>
        <Link to="/admin/periods">
          <Button variant="outline" size="sm">
            Gestionar
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {periods?.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground ml-2">
                {new Date(p.start_date).toLocaleDateString("es-ES")} -{" "}
                {new Date(p.end_date).toLocaleDateString("es-ES")}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleLock(p.id, p.is_locked)}
            >
              {p.is_locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
