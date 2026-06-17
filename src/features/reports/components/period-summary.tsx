'use client'

import { useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { calcPeriodSummary, formatTime, formatHours, formatCurrency } from '@/lib/calculations'
import type { TimeEntry, EmploymentType } from '@/types'

interface Props {
  entries: TimeEntry[]
  type: EmploymentType
  viaticoRate: number
}

export function PeriodSummaryTable({ entries, type, viaticoRate }: Props) {
  const summary = useMemo(
    () => calcPeriodSummary(entries, type, viaticoRate),
    [entries, type, viaticoRate]
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Entrada</TableHead>
          <TableHead>Salida</TableHead>
          <TableHead>Horas</TableHead>
          <TableHead>Concepto</TableHead>
          <TableHead>H. Extra</TableHead>
          <TableHead>Viático</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summary.days.map((day) => (
          <TableRow key={day.date}>
            <TableCell>{new Date(day.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</TableCell>
            <TableCell>{formatTime(day.start_time)}</TableCell>
            <TableCell>{formatTime(day.end_time)}</TableCell>
            <TableCell className="font-medium">{formatHours(day.hours)}h</TableCell>
            <TableCell className="max-w-[150px] truncate">{day.concept}</TableCell>
            <TableCell>
              {day.extra_hours > 0 ? (
                <Badge variant="outline">{formatHours(day.extra_hours)}h</Badge>
              ) : '—'}
            </TableCell>
            <TableCell>
              {day.viatico ? (
                <Badge>{formatCurrency(day.viatico_amount)}</Badge>
              ) : '—'}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="font-bold bg-muted/50">
          <TableCell colSpan={3}>Totales</TableCell>
          <TableCell>{formatHours(summary.total_hours)}h</TableCell>
          <TableCell />
          <TableCell>{formatHours(summary.total_extra_hours)}h</TableCell>
          <TableCell>{formatCurrency(summary.total_viatico)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
