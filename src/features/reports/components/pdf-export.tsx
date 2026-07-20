'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable, { type CellInput } from 'jspdf-autotable'
import { calcExtraTime, calcScheduledEndTime, formatTime } from '@/lib/calculations'
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

function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function extraTimeToMinutes(extraTime: string): number {
  if (extraTime === 'Off' || extraTime === '0:00') return 0
  const [h, m] = extraTime.split(':').map(Number)
  return h * 60 + m
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

export function PdfExport({ days, period, profile }: Props) {
  const exportToPdf = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
    const logoDataUrl = await loadImageDataUrl('/avianca-logo.png')

    // ── Header ────────────────────────────────────────────────
    const pageWidth = doc.internal.pageSize.width
    const headerX = 8
    const headerY = 8
    const headerWidth = pageWidth - 16
    const logoWidth = 74
    const infoWidth = headerWidth - logoWidth
    const titleHeight = 15
    const infoRowHeight = 7
    const labelWidth = 48
    const infoRowsHeight = infoRowHeight * 3
    const headerHeight = titleHeight + infoRowsHeight

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)

    doc.setFillColor(166, 166, 166)
    doc.rect(headerX, headerY, infoWidth, titleHeight, 'FD')
    doc.setFillColor(255, 255, 255)
    doc.rect(headerX + infoWidth, headerY, logoWidth, headerHeight, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(
      'REPORTE HORAS EXTRAS AEROPUERTO MGA',
      headerX + infoWidth / 2,
      headerY + 9,
      { align: 'center' },
    )

    const infoLabels = ['COLABORADOR', 'CODIGO EMPLEADO', 'QUINCENAS']
    const infoValues = [
      profile.full_name,
      profile.employee_code || '',
      `${formatPeriodDate(period.start_date)} - ${formatPeriodDate(period.end_date)}`,
    ]

    doc.setFontSize(10)
    for (let index = 0; index < infoLabels.length; index++) {
      const y = headerY + titleHeight + index * infoRowHeight
      doc.rect(headerX, y, infoWidth, infoRowHeight)
      doc.line(headerX + labelWidth, y, headerX + labelWidth, y + infoRowHeight)
      doc.setFont('helvetica', 'bold')
      doc.text(infoLabels[index], headerX + labelWidth / 2, y + 4.7, { align: 'center' })
      doc.text(infoValues[index], headerX + labelWidth + (infoWidth - labelWidth) / 2, y + 4.7, {
        align: 'center',
      })
    }

    doc.addImage(
      logoDataUrl,
      'PNG',
      headerX + infoWidth + 5,
      headerY + 2,
      logoWidth - 10,
      headerHeight - 4,
    )

    // ── Table ────────────────────────────────────────────────
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

    const rows: CellInput[][] = []
    let totalExtraMinutes = 0
    let feriadoMinutes = 0

    for (const day of days) {
      const isOff = day.concept === 'Off'
      const isFeriado = day.concept === 'Feriado Nacional'

      if (isOff) {
        rows.push([formatDayMonth(day.date), 'Off', 'Off', 'Off', 'Off', 'Off', 'Off', 'Off'])
        continue
      }

      if (isFeriado) {
        rows.push([formatDayMonth(day.date), formatTime(day.start_time), { content: 'Feriado Nacional', colSpan: 6 }])
        feriadoMinutes += day.hours * 60
        continue
      }

      const scheduledEnd = calcScheduledEndTime(day.start_time, profile.type)
      const extraTime = calcExtraTime(scheduledEnd, day.end_time)
      rows.push([
        formatDayMonth(day.date),
        formatTime(day.start_time),
        scheduledEnd,
        formatTime(day.end_time),
        extraTime,
        day.concept || '-',
        '',
        day.viatico ? 1 : '',
      ])

      totalExtraMinutes += extraTimeToMinutes(extraTime)
    }

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: headerY + headerHeight + 5,
      styles: {
        fontSize: 10,
        cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        halign: 'center',
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 45 },
        6: { halign: 'center', cellWidth: 45 },
        7: { halign: 'center', cellWidth: 18 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.fillColor = [248, 203, 173]
        }
        if (data.section === 'body' && (data.column.index === 4 || data.column.index === 7)) {
          data.cell.styles.fillColor = [217, 217, 217]
        }
      },
    })

    // ── Totals ───────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY + 8

    const totalAllExtraMinutes = totalExtraMinutes + feriadoMinutes
    const totalExtraHours = totalAllExtraMinutes / 60
    const totalHoursLabel = Number.isInteger(totalExtraHours)
      ? String(totalExtraHours)
      : totalExtraHours.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(
      `Total: ${totalHoursLabel} hrs extras`,
      14,
      finalY,
      { align: 'left' },
    )

    // ── Save ─────────────────────────────────────────────────
    doc.save(`${period.name.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <Button onClick={exportToPdf} variant="outline">
      <FileDown className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  )
}
