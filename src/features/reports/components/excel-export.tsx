'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { calcExtraTime, calcScheduledEndTime, formatTime } from '@/lib/calculations'
import type { DayCalculation, Period, Profile } from '@/types'

interface Props {
  days: DayCalculation[]
  period: Period
  profile: Profile
  fileName?: string
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

function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

async function loadImageDataUrl(src: string): Promise<string> {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error(`Unable to load image: ${src}`)
  }
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error(`Unable to read image: ${src}`))
    reader.readAsDataURL(blob)
  })
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

const REAL_EXIT_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8CBAD' },
}

const EXTRAS_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9D9D9' },
}

const TABLE_BORDER: ExcelJS.Borders = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
  diagonal: {},
}

export function ExcelExport({ days, period, profile, fileName }: Props) {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(period.name)
    const logoDataUrl = await loadImageDataUrl('/avianca-logo.png')
    const logoImageId = workbook.addImage({ base64: logoDataUrl, extension: 'png' })

    // Column widths
    // Excel column widths use character units; 24 is approximately 170 px.
    sheet.getColumn(1).width = 24
    sheet.getColumn(2).width = 12
    sheet.getColumn(3).width = 12
    sheet.getColumn(4).width = 14
    sheet.getColumn(5).width = 10
    sheet.getColumn(6).width = 22
    sheet.getColumn(7).width = 22
    sheet.getColumn(8).width = 16

    // ── Header section ──────────────────────────────────────

    // Row 1-3: Title and logo
    sheet.mergeCells('A1:F3')
    sheet.mergeCells('G1:H6')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'REPORTE HORAS EXTRAS AEROPUERTO MGA'
    titleCell.font = { bold: true, size: 14 }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    for (let row = 1; row <= 3; row++) {
      for (let column = 1; column <= 6; column++) {
        const cell = sheet.getCell(row, column)
        cell.fill = HEADER_FILL
        cell.border = TABLE_BORDER
      }
    }

    // Rows 4-6: Report information
    sheet.getCell('A4').value = 'COLABORADOR'
    sheet.getCell('A4').font = { bold: true }
    sheet.mergeCells('B4:F4')
    sheet.getCell('B4').value = profile.full_name

    sheet.getCell('A5').value = 'CODIGO EMPLEADO'
    sheet.getCell('A5').font = { bold: true }
    sheet.mergeCells('B5:F5')
    sheet.getCell('B5').value = profile.employee_code || ''

    sheet.getCell('A6').value = 'QUINCENAS'
    sheet.getCell('A6').font = { bold: true }
    sheet.mergeCells('B6:F6')
    sheet.getCell('B6').value = `${formatPeriodDate(period.start_date)} - ${formatPeriodDate(period.end_date)}`
    for (let row = 4; row <= 6; row++) {
      for (let column = 1; column <= 6; column++) {
        sheet.getCell(row, column).border = TABLE_BORDER
      }
    }
    sheet.getCell('G1').border = TABLE_BORDER
    sheet.addImage(logoImageId, {
      tl: { col: 6.1, row: 0.15 },
      ext: { width: 190, height: 92 },
    })

    // Row 8: Table headers
    const headerRow = sheet.getRow(8)
    const headers = [
      'DIA',
      'ENTRADA',
      'SALIDA',
      'SALIDA REAL',
      'EXTRAS',
      'MOTIVO HORAS EXTRAS',
      'FIRMA SUPERVISOR',
      'VIATICO',
    ]
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true }
      cell.fill = HEADER_FILL
      cell.alignment = { horizontal: 'center' }
      cell.border = TABLE_BORDER
    })

    // ── Data rows ───────────────────────────────────────────

    let rowNum = 9
    let totalExtraMinutes = 0
    let feriadoMinutes = 0

    for (const day of days) {
      const isOff = day.concept === 'Off'
      const isFeriado = day.concept === 'Feriado Nacional'

      if (isOff) {
        const row = sheet.getRow(rowNum)
        row.getCell(1).value = formatDayMonth(day.date)
        row.getCell(1).alignment = { horizontal: 'center' }
        for (let c = 2; c <= 8; c++) {
          row.getCell(c).value = 'Off'
          row.getCell(c).alignment = { horizontal: 'center' }
        }
        row.eachCell((cell) => {
          cell.border = TABLE_BORDER
        })
        rowNum++
        continue
      }

      if (isFeriado) {
        const row = sheet.getRow(rowNum)
        row.getCell(1).value = formatDayMonth(day.date)
        row.getCell(1).alignment = { horizontal: 'center' }
        row.getCell(2).value = formatTime(day.start_time)
        row.getCell(2).alignment = { horizontal: 'center' }
        sheet.mergeCells(rowNum, 3, rowNum, 8)
        row.getCell(3).value = 'Feriado Nacional'
        row.getCell(3).alignment = { horizontal: 'center' }
        row.getCell(3).border = TABLE_BORDER
        feriadoMinutes += day.hours * 60
        rowNum++
        continue
      }

      // Normal working day
      const row = sheet.getRow(rowNum)
      const scheduledEnd = calcScheduledEndTime(day.start_time, profile.type)
      const extraTime = calcExtraTime(scheduledEnd, day.end_time)

      row.getCell(1).value = formatDayMonth(day.date)
      row.getCell(2).value = formatTime(day.start_time)
      row.getCell(3).value = scheduledEnd
      row.getCell(4).value = formatTime(day.end_time)
      row.getCell(5).value = extraTime
      row.getCell(6).value = day.concept || '-'
      row.getCell(7).value = '' // FIRMA SUPERVISOR — se llena a mano
      row.getCell(8).value = day.viatico ? 1 : ''
      row.getCell(4).fill = REAL_EXIT_FILL
      row.getCell(5).fill = EXTRAS_FILL

      // Center-align numeric-ish columns
      ;[1, 2, 3, 4, 5, 8].forEach((c) => {
        row.getCell(c).alignment = { horizontal: 'center' }
      })
      row.eachCell((cell) => {
        cell.border = TABLE_BORDER
      })

      totalExtraMinutes += extraTimeToMinutes(extraTime)
      rowNum++
    }

    // ── Totals section ──────────────────────────────────────
    rowNum++ // blank row before totals

    const totalAllExtraMinutes = totalExtraMinutes + feriadoMinutes
    const totalExtraHours = totalAllExtraMinutes / 60
    const totalHoursLabel = Number.isInteger(totalExtraHours)
      ? String(totalExtraHours)
      : totalExtraHours.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')

    sheet.mergeCells(rowNum, 1, rowNum, 8)
    const totalCell = sheet.getCell(`A${rowNum}`)
    totalCell.value = `Total: ${totalHoursLabel} hrs extras`
    totalCell.font = { bold: true, size: 10 }
    totalCell.alignment = { horizontal: 'left', vertical: 'middle' }

    // Apply the report's final typography and alignment consistently.
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = { ...(cell.font ?? {}), size: 10 }
        cell.alignment = {
          ...(cell.alignment ?? {}),
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true,
        }
      })
    })
    totalCell.alignment = { horizontal: 'left', vertical: 'middle' }
    for (let row = 1; row <= 6; row++) {
      sheet.getRow(row).height = 15
    }
    sheet.getRow(8).height = 15

    // ── Generate and download ───────────────────────────────

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    saveAs(blob, fileName ?? `${period.name.replace(/\s+/g, '_')}.xlsx`)
  }

  return (
    <Button onClick={exportToExcel} variant="outline">
      <FileDown className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  )
}
