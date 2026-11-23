import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/use-user";
import { useProfile } from "@/hooks/use-profile";
import { useAbsences, useDeleteAbsence, useSaveVacation } from "@/features/absences/hooks/use-absences";
import { vacationSchema, type VacationFormData } from "@/features/absences/vacation-schema";
import { getTodayNicaragua, formatDateFull } from "@/lib/timezone";
import { FormFieldDatePicker } from "@/components/ui/form-field-date-picker";
import { FormFieldSelect } from "@/components/ui/form-field-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, CheckCircle2, Clock3, Plus, Pencil, Trash2 } from "lucide-react";
import { getStandardHours } from "@/lib/calculations";
import type { Absence } from "@/types";

const defaults: VacationFormData = { start_date: "", end_date: "", status: "pending" };

export default function VacationsPage() {
  const { user } = useUser();
  const { data: profile } = useProfile(user?.id);
  const { data, isLoading, isError } = useAbsences(user?.id);
  const save = useSaveVacation();
  const remove = useDeleteAbsence();
  const [editing, setEditing] = useState<Absence | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const form = useForm<VacationFormData>({ resolver: zodResolver(vacationSchema), defaultValues: defaults });
  const today = getTodayNicaragua();

  const vacations = useMemo(
    () => (data ?? []).filter((absence) => absence.type === "vacation"),
    [data],
  );
  const filteredVacations = useMemo(
    () => vacations.filter((absence) => filter === "all" || absence.status === filter),
    [vacations, filter],
  );
  const counts = useMemo(() => ({
    all: vacations.length,
    pending: vacations.filter((absence) => absence.status === "pending").length,
    approved: vacations.filter((absence) => absence.status === "approved").length,
    rejected: vacations.filter((absence) => absence.status === "rejected").length,
  }), [vacations]);
  const approvedHours = useMemo(() => {
    if (!profile) return 0;
    const standard = getStandardHours(profile.type);
    return vacations
      .filter((absence) => absence.status === "approved")
      .reduce((sum, absence) => sum + countCalendarDays(absence.start_date, absence.end_date) * standard, 0);
  }, [profile, vacations]);

  const reset = () => { setEditing(null); setShowForm(false); form.reset(defaults); };
  const openCreate = () => { setEditing(null); form.reset(defaults); setShowForm(true); };
  const openEdit = (absence: Absence) => {
    setEditing(absence);
    form.reset({
      start_date: absence.start_date,
      end_date: absence.end_date,
      status: absence.status === "approved" ? "approved" : "pending",
    });
    setShowForm(true);
  };
  const onSubmit = async (values: VacationFormData) => {
    if (!user) return;
    try {
      await save.mutateAsync({ userId: user.id, values, id: editing?.id });
      reset();
    } catch {
      // MutationCache displays the database error.
    }
  };
  const cancel = async (id: string) => {
    if (!confirm("¿Cancelar este período de vacaciones?")) return;
    try {
      await remove.mutateAsync(id);
      if (editing?.id === id) reset();
    } catch {
      // MutationCache displays the database error.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Vacaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná períodos futuros y consultá su aprobación.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" />
          Nuevo período
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border ring-1 ring-foreground/8 lg:grid-cols-4">
        <SummaryCard
          icon={CalendarDays}
          label="Total"
          value={String(counts.all)}
          hint="Períodos registrados"
        />
        <SummaryCard
          icon={Clock3}
          label="Pendientes"
          value={String(counts.pending)}
          hint="A la espera de aprobación"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Aprobadas"
          value={String(counts.approved)}
          hint="Períodos confirmados"
        />
        <SummaryCard
          icon={CalendarDays}
          label="Horas pagadas"
          value={`${approvedHours.toFixed(2)}h`}
          hint="Según los días aprobados"
        />
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) reset();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar período" : "Registrar período"}
            </DialogTitle>
            <DialogDescription>
              Las fechas son inclusivas. Las vacaciones aprobadas acreditan jornada completa por cada día calendario.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormFieldDatePicker control={form.control} name="start_date" label="Fecha de inicio" min={today} />
              <FormFieldDatePicker control={form.control} name="end_date" label="Fecha de fin" min={today} />
            </div>
            <FormFieldSelect
              control={form.control}
              name="status"
              label="Estado"
              options={[
                { value: "pending", label: "Pendiente de aprobación" },
                { value: "approved", label: "Aprobado" },
              ]}
              modal={false}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={reset}>
                Cancelar
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-foreground">Mis solicitudes</h2>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
            {([
              ["all", "Todos"],
              ["pending", "Pendientes"],
              ["approved", "Aprobadas"],
              ["rejected", "Rechazadas"],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(value)}
              >
                {label}
                {counts[value] > 0 && (
                  <span className="ml-1 tabular-nums text-muted-foreground">{counts[value]}</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Solicitado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Cargando vacaciones…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-destructive">
                  No se pudieron cargar las vacaciones.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && filteredVacations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay solicitudes en este estado.
                </TableCell>
              </TableRow>
            )}
            {filteredVacations.map((absence) => {
              const canChange = absence.start_date >= today;
              const days = countCalendarDays(absence.start_date, absence.end_date);
              return (
                <TableRow key={absence.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatDateFull(absence.start_date)} — {formatDateFull(absence.end_date)}
                      </span>
                      <span className="text-xs text-muted-foreground">Vacaciones pagadas</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono tabular-nums">{days}</span>
                    <span className="ml-1 text-xs text-muted-foreground">días</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={absence.status === "approved" ? "default" : absence.status === "rejected" ? "destructive" : "secondary"}>
                      {absence.status === "approved" ? "Aprobado" : absence.status === "rejected" ? "Rechazado" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateFull(absence.created_at.slice(0, 10))}
                  </TableCell>
                  <TableCell>
                    {canChange ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(absence)}
                          title="Editar período"
                          aria-label="Editar período"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={remove.isPending}
                          onClick={() => void cancel(absence.id)}
                          title="Cancelar período"
                          aria-label="Cancelar período"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ) : (
                      <span className="block text-right text-xs text-muted-foreground">Período iniciado</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center gap-1.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs leading-tight text-muted-foreground">{hint}</div>
    </div>
  );
}

function countCalendarDays(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.floor((end - start) / 86_400_000) + 1;
}
