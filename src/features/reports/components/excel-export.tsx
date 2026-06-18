'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { formatTime } from '@/lib/calculations'
import type { DayCalculation, Period, Profile } from '@/types'

interface Props {
  days: DayCalculation[]
  period: Period
  profile: Profile
}

const SPANISH_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function formatPeriodDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDate()
  const month = SPANISH_MONTHS[d.getMonth()]
  return `${day} ${month}`
}

function extraTimeToMinutes(extraTime: string): number {
  if (extraTime === 'Off' || extraTime === '0:00') return 0
  const [h, m] = extraTime.split(':').map(Number)
  return h * 60 + m
}

function minutesToHHMMSS(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}:${String(m).padStart(2, '0')}:00`
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9D9D9' },
}

export function ExcelExport({ days, period, profile }: Props) {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(period.name)

    // Column widths
    sheet.getColumn(1).width = 8
    sheet.getColumn(2).width = 12
    sheet.getColumn(3).width = 12
    sheet.getColumn(4).width = 14
    sheet.getColumn(5).width = 10
    sheet.getColumn(6).width = 22
    sheet.getColumn(7).width = 22
    sheet.getColumn(8).width = 12

    // ── Header section ──────────────────────────────────────

    // Row 1: Title
    sheet.mergeCells('A1:H1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'REPORTE HORAS EXTRAS AEROPUERTO MGA'
    titleCell.font = { bold: true, size: 14 }
    titleCell.alignment = { horizontal: 'center' }

    // Row 2: COLABORADOR
    sheet.getCell('A2').value = 'COLABORADOR'
    sheet.getCell('A2').font = { bold: true }
    sheet.mergeCells('B2:H2')
    sheet.getCell('B2').value = profile.full_name

    // Row 3: CODIGO EMPLEADO
    sheet.getCell('A3').value = 'CODIGO EMPLEADO'
    sheet.getCell('A3').font = { bold: true }
    sheet.mergeCells('B3:H3')
    sheet.getCell('B3').value = profile.employee_code || ''

    // Row 4: QUINCENAS
    sheet.getCell('A4').value = 'QUINCENAS'
    sheet.getCell('A4').font = { bold: true }
    sheet.mergeCells('B4:H4')
    sheet.getCell('B4').value = `${formatPeriodDate(period.start_date)} - ${formatPeriodDate(period.end_date)}`

    // Row 5: empty
    // Row 6: Table headers
    const headerRow = sheet.getRow(6)
    const headers = ['DIA', 'ENTRADA', 'SALIDA', 'SALIDA REAL', 'EXTRAS', 'MOTIVO', 'FIRMA SUPERVISOR', 'VIATICO']
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true }
      cell.fill = HEADER_FILL
      cell.alignment = { horizontal: 'center' }
    })

    // ── Data rows ───────────────────────────────────────────

    let rowNum = 7
    let totalExtraMinutes = 0
    let feriadoMinutes = 0
    let workingDays = 0

    for (const day of days) {
      const isOff = day.concept === 'Off'
      const isFeriado = day.concept === 'Feriado Nacional'

      if (isOff) {
        const row = sheet.getRow(rowNum)
        row.getCell(1).value = new Date(day.date + 'T12:00:00').getDate()
        for (let c = 2; c <= 8; c++) {
          row.getCell(c).value = 'Off'
          row.getCell(c).alignment = { horizontal: 'center' }
        }
        rowNum++
        continue
      }

      if (isFeriado) {
        const row = sheet.getRow(rowNum)
        row.getCell(1).value = new Date(day.date + 'T12:00:00').getDate()
        row.getCell(1).alignment = { horizontal: 'center' }
        row.getCell(2).value = formatTime(day.start_time)
        row.getCell(2).alignment = { horizontal: 'center' }
        sheet.mergeCells(rowNum, 3, rowNum, 8)
        row.getCell(3).value = 'Feriado Nacional'
        feriadoMinutes += day.hours * 60
        workingDays++
        rowNum++
        continue
      }

      // Normal working day
      const row = sheet.getRow(rowNum)
      const dayOfMonth = new Date(day.date + 'T12:00:00').getDate()

      row.getCell(1).value = dayOfMonth
      row.getCell(2).value = formatTime(day.start_time)
      row.getCell(3).value = day.scheduled_end_time
      row.getCell(4).value = formatTime(day.end_time)
      row.getCell(5).value = day.extra_time
      row.getCell(6).value = day.concept || '-'
      row.getCell(7).value = '' // FIRMA SUPERVISOR — se llena a mano
      row.getCell(8).value = day.viatico ? 1 : ''

      // Center-align numeric-ish columns
      ;[1, 2, 3, 4, 5, 8].forEach((c) => {
        row.getCell(c).alignment = { horizontal: 'center' }
      })

      totalExtraMinutes += extraTimeToMinutes(day.extra_time)
      workingDays++
      rowNum++
    }

    // ── Totals section ──────────────────────────────────────

    rowNum++ // blank row before totals

    const totalAllExtraMinutes = totalExtraMinutes + feriadoMinutes

    // Total row: HH:MM:SS and working days count
    const totalRow = sheet.getRow(rowNum)
    totalRow.getCell(1).value = minutesToHHMMSS(totalAllExtraMinutes)
    totalRow.getCell(1).font = { bold: true }
    totalRow.getCell(1).alignment = { horizontal: 'center' }
    totalRow.getCell(2).value = workingDays
    totalRow.getCell(2).font = { bold: true }
    totalRow.getCell(2).alignment = { horizontal: 'center' }

    // Summary text row
    rowNum++
    const totalExtraHours = Math.floor(totalExtraMinutes / 60)
    const extraRemainder = totalExtraMinutes % 60
    const feriadoHours = feriadoMinutes / 60

    let summaryText = `Total : ${totalExtraHours} hrs extras`
    if (extraRemainder > 0) {
      summaryText += ` + ${extraRemainder / 60}`
    }
    if (feriadoMinutes > 0) {
      summaryText += ` + ${feriadoHours} Feriado Nacional`
    }

    sheet.mergeCells(rowNum, 1, rowNum, 8)
    const summaryCell = sheet.getCell(`A${rowNum}`)
    summaryCell.value = summaryText
    summaryCell.font = { bold: true }

    // ── Footer: REPORTE HORAS EXTRAS AEROPUERTO MGA (right-aligned) ──
    rowNum++
    sheet.mergeCells(rowNum, 1, rowNum, 8)
    const footerCell = sheet.getCell(`A${rowNum}`)
    footerCell.value = 'REPORTE HORAS EXTRAS AEROPUERTO MGA'
    footerCell.alignment = { horizontal: 'right' }

    // ── Generate and download ───────────────────────────────

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, `${period.name.replace(/\s+/g, '_')}.xlsx`)
  }

  return (
    <Button onClick={exportToExcel} variant="outline">
      <FileDown className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  )
}
