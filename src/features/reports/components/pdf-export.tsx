'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable, { type CellInput } from 'jspdf-autotable'
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

export function PdfExport({ days, period, profile }: Props) {
  const exportToPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

    // ── Title ────────────────────────────────────────────────
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORTE HORAS EXTRAS AEROPUERTO MGA', doc.internal.pageSize.width / 2, 15, {
      align: 'center',
    })

    // ── Info section ─────────────────────────────────────────
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('COLABORADOR:', 14, 25)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.full_name, 48, 25)

    doc.setFont('helvetica', 'bold')
    doc.text('CODIGO EMPLEADO:', 14, 31)
    doc.setFont('helvetica', 'normal')
    doc.text(profile.employee_code || '', 48, 31)

    doc.setFont('helvetica', 'bold')
    doc.text('QUINCENAS:', 14, 37)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${formatPeriodDate(period.start_date)} - ${formatPeriodDate(period.end_date)}`,
      48,
      37,
    )

    // ── Table ────────────────────────────────────────────────
    const headers = [
      'DIA',
      'ENTRADA',
      'SALIDA',
      'SALIDA REAL',
      'EXTRAS',
      'MOTIVO',
      'FIRMA SUPERVISOR',
      'VIATICO',
    ]

    const rows: CellInput[][] = []
    let totalExtraMinutes = 0
    let feriadoMinutes = 0
    let workingDays = 0

    for (const day of days) {
      const isOff = day.concept === 'Off'
      const isFeriado = day.concept === 'Feriado Nacional'

      if (isOff) {
        const dayNum = new Date(day.date + 'T12:00:00').getDate()
        rows.push([dayNum, 'Off', 'Off', 'Off', 'Off', 'Off', 'Off', 'Off'])
        continue
      }

      if (isFeriado) {
        const dayNum = new Date(day.date + 'T12:00:00').getDate()
        rows.push([dayNum, formatTime(day.start_time), { content: 'Feriado Nacional', colSpan: 6 }])
        feriadoMinutes += day.hours * 60
        workingDays++
        continue
      }

      const dayNum = new Date(day.date + 'T12:00:00').getDate()
      rows.push([
        dayNum,
        formatTime(day.start_time),
        day.scheduled_end_time,
        formatTime(day.end_time),
        day.extra_time,
        day.concept || '-',
        '',
        day.viatico ? 1 : '',
      ])

      totalExtraMinutes += extraTimeToMinutes(day.extra_time)
      workingDays++
    }

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 42,
      styles: {
        fontSize: 8,
        cellPadding: 2,
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
        5: { cellWidth: 45 },
        6: { cellWidth: 45 },
        7: { halign: 'center', cellWidth: 18 },
      },
    })

    // ── Totals ───────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY + 8

    const totalAllExtraMinutes = totalExtraMinutes + feriadoMinutes
    const totalHours = Math.floor(totalAllExtraMinutes / 60)
    const totalMinutes = totalAllExtraMinutes % 60
    const totalStr = `${totalHours}:${String(totalMinutes).padStart(2, '0')}:00`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(`Total Horas Extras: ${totalStr}`, 14, finalY)
    doc.text(`Días trabajados: ${workingDays}`, 80, finalY)

    // ── Summary ──────────────────────────────────────────────
    const extraHours = Math.floor(totalExtraMinutes / 60)
    const extraRemainder = totalExtraMinutes % 60
    const feriadoHours = feriadoMinutes / 60

    let summaryText = `Total : ${extraHours} hrs extras`
    if (extraRemainder > 0) {
      summaryText += ` + ${extraRemainder / 60}`
    }
    if (feriadoMinutes > 0) {
      summaryText += ` + ${feriadoHours} Feriado Nacional`
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(summaryText, 14, finalY + 7)

    // ── Footer ───────────────────────────────────────────────
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(
      'REPORTE HORAS EXTRAS AEROPUERTO MGA',
      doc.internal.pageSize.width - 14,
      finalY + 16,
      { align: 'right' },
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
