'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { useProfile } from '@/hooks/use-profile'
import { usePolicyConfig } from '@/features/admin/hooks/use-policy-config'
import { useCountry } from '@/features/countries/hooks/use-country'
import {
  useDeleteHoliday,
  useHolidays,
} from '@/features/holidays/hooks/use-holidays'
import { availableYears, holidaysOfYear } from '@/features/holidays/timeline'
import { HolidayTimeline } from '@/features/holidays/components/holiday-timeline'
import { HolidayTable } from '@/features/holidays/components/holiday-table'
import { HolidayForm } from '@/features/holidays/components/holiday-form'
import { HolidayPolicyNote } from '@/features/holidays/components/holiday-policy-note'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getTodayNicaragua } from '@/lib/timezone'
import type { Holiday } from '@/types'

export default function HolidaysPage() {
  const { user } = useUser()
  const { data: profile } = useProfile(user?.id)
  const { data: country } = useCountry()
  const { data: holidaysData, isPending: holidaysLoading } = useHolidays()
  const { data: policy } = usePolicyConfig()
  const deleteHoliday = useDeleteHoliday()

  const today = getTodayNicaragua()
  const currentYear = Number(today.slice(0, 4))

  const holidays = useMemo(() => holidaysData ?? [], [holidaysData])
  const years = useMemo(
    () => availableYears(holidays, currentYear),
    [holidays, currentYear],
  )

  const [year, setYear] = useState<number | null>(null)
  const selectedYear = year ?? years[0] ?? currentYear

  const yearHolidays = useMemo(
    () => holidaysOfYear(holidays, selectedYear),
    [holidays, selectedYear],
  )

  const isAdmin = profile?.role === 'admin'
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Holiday | undefined>(undefined)

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const openEdit = (holiday: Holiday) => {
    setEditing(holiday)
    setFormOpen(true)
  }

  const handleDelete = async (holiday: Holiday) => {
    if (
      !confirm(
        `¿Eliminar el feriado "${holiday.name}" (${holiday.date})? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    await deleteHoliday.mutateAsync(holiday.id)
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Feriados</h1>
          <p className="text-sm text-muted-foreground">
            Feriados de {country?.name ?? 'Nicaragua'} y la regla de pago que
            aplican. Visible para todos los usuarios.
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div className="space-y-1.5">
            <label
              htmlFor="holidays-year"
              className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Año
            </label>
            <Select
              items={years.map((y) => ({ value: String(y), label: String(y) }))}
              value={String(selectedYear)}
              onValueChange={(value) => value && setYear(Number(value))}
            >
              <SelectTrigger id="holidays-year" size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar feriado
            </Button>
          )}
        </div>
      </div>

      {/* Línea de tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Línea del año {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {holidaysLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando...
            </p>
          ) : (
            <HolidayTimeline
              holidays={yearHolidays}
              year={selectedYear}
              today={today}
            />
          )}
        </CardContent>
      </Card>

      {/* Listado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Feriados de {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {holidaysLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando...
            </p>
          ) : (
            <HolidayTable
              holidays={yearHolidays}
              isAdmin={isAdmin}
              holidaySurchargePct={policy?.holiday_surcharge_pct ?? 0}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Regla de pago */}
      <HolidayPolicyNote
        policy={policy ?? null}
        holidayCount={yearHolidays.length}
      />

      {/* Alta / edición (admin) */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(undefined)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar feriado' : 'Agregar feriado'}
            </DialogTitle>
            <DialogDescription>
              Los feriados fijos ya vienen cargados. Agregá aquí los móviles
              (Jueves Santo, Viernes Santo) o cualquier fecha especial.
            </DialogDescription>
          </DialogHeader>

          {country && (
            <HolidayForm
              holiday={editing}
              countryId={country.id}
              onSuccess={() => setFormOpen(false)}
              onCancel={() => setFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
