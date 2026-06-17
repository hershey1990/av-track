'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { formatTime, formatHours, formatCurrency } from '@/lib/calculations'
import type { DayCalculation } from '@/types'

interface Props {
  days: DayCalculation[]
  periodName: string
}

export function ExcelExport({ days, periodName }: Props) {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(periodName)

    sheet.columns = [
      { header: 'Fecha', key: 'date', width: 14 },
      { header: 'Entrada', key: 'start', width: 10 },
      { header: 'Salida', key: 'end', width: 10 },
      { header: 'Horas', key: 'hours', width: 10 },
      { header: 'Concepto', key: 'concept', width: 30 },
      { header: 'Horas Extra', key: 'extra', width: 12 },
      { header: 'Viático', key: 'viatico', width: 14 },
    ]

    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    }

    let totalHours = 0
    let totalExtra = 0
    let totalViatico = 0

    days.forEach((day) => {
      sheet.addRow({
        date: new Date(day.date).toLocaleDateString('es-ES'),
        start: formatTime(day.start_time),
        end: formatTime(day.end_time),
        hours: `${formatHours(day.hours)}h`,
        concept: day.concept,
        extra: day.extra_hours > 0 ? `${formatHours(day.extra_hours)}h` : '—',
        viatico: day.viatico ? formatCurrency(day.viatico_amount) : '—',
      })
      totalHours += day.hours
      totalExtra += day.extra_hours
      totalViatico += day.viatico_amount
    })

    const totalRow = sheet.addRow({
      date: 'TOTALES',
      hours: `${formatHours(totalHours)}h`,
      extra: `${formatHours(totalExtra)}h`,
      viatico: formatCurrency(totalViatico),
    })
    totalRow.font = { bold: true }
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' },
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `${periodName.replace(/\s+/g, '_')}.xlsx`)
  }

  return (
    <Button onClick={exportToExcel} variant="outline">
      <FileDown className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  )
}
