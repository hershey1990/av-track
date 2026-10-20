"use client";

import { FileSpreadsheet } from "lucide-react";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { formatPeriodDate } from "../export-utils";
import type { BreakdownRow, DailySeriesPoint } from "../aggregation";
import type { Period, Profile } from "@/types";

interface Props {
  /** Filas del desglose (por concepto, día o mes). */
  rows: BreakdownRow[];
  /** Serie diaria del período. */
  daily: DailySeriesPoint[];
  period: Period;
  profile: Profile;
  fileName?: string;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFA6A6A6" },
};

const TABLE_BORDER: ExcelJS.Borders = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
  diagonal: {},
};

/**
 * Exporta el resumen del período a un `.xlsx` con dos hojas: el desglose y
 * el detalle por día.
 *
 * Es un export **nuevo**, complementario al `ExcelExport` existente (que
 * genera el formato oficial de horas extras con logo y firma del
 * supervisor). Este no lo modifica.
 */
export function BreakdownExcelExport({
  rows,
  daily,
  period,
  profile,
  fileName,
}: Props) {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BB Track";

    // ── Hoja 1: Resumen por concepto ────────────────────────
    const summary = workbook.addWorksheet("Resumen");
    summary.getColumn(1).width = 30;
    summary.getColumn(2).width = 12;
    summary.getColumn(3).width = 12;
    summary.getColumn(4).width = 12;
    summary.getColumn(5).width = 12;
    summary.getColumn(6).width = 12;

    summary.getCell("A1").value = "RESUMEN DE HORAS";
    summary.getCell("A1").font = { bold: true, size: 14 };
    summary.mergeCells("A1:F1");

    summary.getCell("A2").value = "COLABORADOR";
    summary.getCell("A2").font = { bold: true };
    summary.getCell("B2").value = profile.full_name;
    summary.mergeCells("B2:F2");

    summary.getCell("A3").value = "PERIODO";
    summary.getCell("A3").font = { bold: true };
    summary.getCell("B3").value =
      `${formatPeriodDate(period.start_date)} - ${formatPeriodDate(period.end_date)}`;
    summary.mergeCells("B3:F3");

    const headerRow = summary.getRow(5);
    const headers = [
      "CONCEPTO",
      "HORAS",
      "HORAS EXTRA",
      "VIATICO",
      "REGISTROS",
      "% DEL TOTAL",
    ];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = HEADER_FILL;
      cell.alignment = { horizontal: "center" };
      cell.border = TABLE_BORDER;
    });

    let rowNum = 6;
    for (const row of rows) {
      const excelRow = summary.getRow(rowNum);
      excelRow.getCell(1).value = row.label;
      excelRow.getCell(2).value = row.hours;
      excelRow.getCell(3).value = row.extraHours;
      excelRow.getCell(4).value = row.viatico;
      excelRow.getCell(5).value = row.entryCount;
      excelRow.getCell(6).value = Number(row.sharePct.toFixed(2)) / 100;
      excelRow.getCell(6).numFmt = "0.00%";
      excelRow.eachCell((cell) => {
        cell.border = TABLE_BORDER;
      });
      [2, 3, 4, 5, 6].forEach((column) => {
        excelRow.getCell(column).alignment = { horizontal: "center" };
      });
      rowNum++;
    }

    const totalHours = rows.reduce((sum, row) => sum + row.hours, 0);
    const totalExtra = rows.reduce((sum, row) => sum + row.extraHours, 0);
    const totalViatico = rows.reduce((sum, row) => sum + row.viatico, 0);
    const totalEntries = rows.reduce((sum, row) => sum + row.entryCount, 0);

    const totalRow = summary.getRow(rowNum);
    totalRow.getCell(1).value = "TOTAL";
    totalRow.getCell(2).value = Number(totalHours.toFixed(2));
    totalRow.getCell(3).value = Number(totalExtra.toFixed(2));
    totalRow.getCell(4).value = Number(totalViatico.toFixed(2));
    totalRow.getCell(5).value = totalEntries;
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = TABLE_BORDER;
    });
    [2, 3, 4, 5].forEach((column) => {
      totalRow.getCell(column).alignment = { horizontal: "center" };
    });

    // ── Hoja 2: Detalle por día ─────────────────────────────
    const detail = workbook.addWorksheet("Detalle por dia");
    detail.getColumn(1).width = 14;
    detail.getColumn(2).width = 12;
    detail.getColumn(3).width = 12;
    detail.getColumn(4).width = 12;
    detail.getColumn(5).width = 12;
    detail.getColumn(6).width = 12;

    const detailHeader = detail.getRow(1);
    const detailHeaders = [
      "FECHA",
      "DIA",
      "HORAS",
      "HORAS EXTRA",
      "VIATICO",
      "REGISTROS",
    ];
    detailHeaders.forEach((header, index) => {
      const cell = detailHeader.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = HEADER_FILL;
      cell.alignment = { horizontal: "center" };
      cell.border = TABLE_BORDER;
    });

    daily.forEach((day, index) => {
      const excelRow = detail.getRow(index + 2);
      excelRow.getCell(1).value = day.dateLabel;
      excelRow.getCell(2).value = day.weekday;
      excelRow.getCell(3).value = day.totalHours;
      excelRow.getCell(4).value = day.extraHours;
      excelRow.getCell(5).value = day.viatico;
      excelRow.getCell(6).value = day.entryCount;
      excelRow.eachCell((cell) => {
        cell.border = TABLE_BORDER;
      });
      [1, 2, 3, 4, 5, 6].forEach((column) => {
        excelRow.getCell(column).alignment = { horizontal: "center" };
      });
    });

    // ── Descarga ────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      blob,
      fileName ?? `resumen_${period.name.replace(/\s+/g, "_")}.xlsx`,
    );
  };

  return (
    <Button onClick={exportToExcel} variant="outline" size="sm">
      <FileSpreadsheet className="h-4 w-4" />
      Exportar desglose
    </Button>
  );
}
