'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateFull } from '@/lib/timezone'
import { weekdayLabel } from '@/features/reports/aggregation'
import { MONTH_NAMES } from '../timeline'
import type { Holiday } from '@/types'

interface Props {
  holidays: Holiday[]
  /** ¿El usuario actual es admin? (habilita editar y eliminar) */
  isAdmin: boolean
  /** Recargo de feriado configurado en la política (%). */
  holidaySurchargePct: number
  onEdit: (holiday: Holiday) => void
  onDelete: (holiday: Holiday) => void
}

/**
 * Listado de feriados del año.
 *
 * Todos los usuarios pueden verlo; las acciones de editar y eliminar sólo
 * se muestran a los admins (la base de datos también lo valida con RLS).
 */
export function HolidayTable({
  holidays,
  isAdmin,
  holidaySurchargePct,
  onEdit,
  onDelete,
}: Props) {
  if (holidays.length === 0) {
    return (
      <p className="rounded-lg bg-card px-5 py-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/8">
        No hay feriados registrados para este año.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[140px]">Fecha</TableHead>
          <TableHead>Festivo</TableHead>
          <TableHead className="w-[140px]">Mes</TableHead>
          <TableHead className="w-[120px]">Pago</TableHead>
          {isAdmin && <TableHead className="w-[92px] text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {holidays.map((holiday) => (
          <TableRow key={holiday.id}>
            <TableCell className="font-mono text-[13px] tabular-nums text-muted-foreground">
              {formatDateFull(holiday.date)}
            </TableCell>
            <TableCell>
              <span className="font-medium text-foreground">
                {holiday.name}
              </span>
              <span className="ml-2 text-[13px] text-muted-foreground">
                {weekdayLabel(holiday.date)}
              </span>
            </TableCell>
            <TableCell className="text-[13px] text-muted-foreground">
              {MONTH_NAMES[Number(holiday.date.slice(5, 7)) - 1]}
            </TableCell>
            <TableCell>
              {holidaySurchargePct > 0 ? (
                <Badge variant="secondary">
                  ×{(100 + holidaySurchargePct) / 100}
                </Badge>
              ) : (
                <span className="text-[13px] text-muted-foreground">—</span>
              )}
            </TableCell>
            {isAdmin && (
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(holiday)}
                    title="Editar feriado"
                    aria-label={`Editar ${holiday.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(holiday)}
                    title="Eliminar feriado"
                    aria-label={`Eliminar ${holiday.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
