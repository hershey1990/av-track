import { describe, it, expect } from "vitest";

import {
  buildBreakdown,
  buildDailySeries,
  computeSummaryKpis,
  dayNumericLabel,
  weekdayLabel,
} from "./aggregation";
import type { DayCalculation } from "@/types";

/** Construye un `DayCalculation` con los valores por defecto. */
function makeDay(overrides: Partial<DayCalculation> = {}): DayCalculation {
  return {
    date: "2026-10-19",
    start_time: "08:00",
    scheduled_end_time: "16:00",
    end_time: "16:00",
    concept: "Vuelo",
    entry_id: "entry-1",
    hours: 8,
    standard_hours: 8,
    extra_hours: 0,
    extra_time: "0:00",
    viatico: 0,
    viatico_amount: 0,
    regular_hours: 8,
    night_hours: 0,
    sunday_hours: 0,
    holiday_hours: 0,
    night_surcharge: 0,
    sunday_surcharge: 0,
    holiday_surcharge: 0,
    is_sunday: false,
    is_holiday: false,
    ...overrides,
  };
}

// ── Etiquetas ─────────────────────────────────────────────────

describe("weekdayLabel", () => {
  it("returns the short weekday name", () => {
    expect(weekdayLabel("2026-10-19")).toBe("Lun");
    expect(weekdayLabel("2026-10-25")).toBe("Dom");
  });
});

describe("dayNumericLabel", () => {
  it("formats as dd/mm", () => {
    expect(dayNumericLabel("2026-10-05")).toBe("05/10");
  });
});

// ── buildDailySeries ──────────────────────────────────────────

describe("buildDailySeries", () => {
  it("returns one point per day, sorted by date", () => {
    const series = buildDailySeries(
      [
        makeDay({ date: "2026-10-20", hours: 8 }),
        makeDay({ date: "2026-10-19", hours: 8 }),
      ],
      "fulltime",
    );

    expect(series.map((p) => p.date)).toEqual(["2026-10-19", "2026-10-20"]);
  });

  it("includes days without entries with zero hours", () => {
    const series = buildDailySeries(
      [makeDay({ date: "2026-10-19", hours: 0, concept: "Off" })],
      "fulltime",
    );

    expect(series).toHaveLength(1);
    expect(series[0].totalHours).toBe(0);
    expect(series[0].extraHours).toBe(0);
  });

  it("splits the day into standard and extra hours", () => {
    const series = buildDailySeries(
      [makeDay({ date: "2026-10-19", hours: 10 })],
      "fulltime",
    );

    expect(series[0].totalHours).toBe(10);
    expect(series[0].extraHours).toBe(2);
    expect(series[0].standardHours).toBe(8);
  });

  it("counts extra hours once per day, not per entry", () => {
    // 5h + 5h en el mismo día = 10h → 2h extra (no 2×2h)
    const series = buildDailySeries(
      [
        makeDay({
          date: "2026-10-19",
          hours: 5,
          concept: "A",
          entry_id: "entry-a",
        }),
        makeDay({
          date: "2026-10-19",
          hours: 5,
          concept: "B",
          entry_id: "entry-b",
        }),
      ],
      "fulltime",
    );

    expect(series).toHaveLength(1);
    expect(series[0].totalHours).toBe(10);
    expect(series[0].extraHours).toBe(2);
    expect(series[0].entryCount).toBe(2);
  });

  it("does not count the generated Off days as entries", () => {
    const series = buildDailySeries(
      [
        makeDay({
          date: "2026-10-19",
          hours: 0,
          concept: "Off",
          entry_id: undefined,
        }),
      ],
      "fulltime",
    );

    expect(series[0].entryCount).toBe(0);
  });

  it("uses the parttime standard hours", () => {
    const series = buildDailySeries(
      [makeDay({ date: "2026-10-19", hours: 6 })],
      "parttime",
    );

    expect(series[0].extraHours).toBe(1);
    expect(series[0].standardHours).toBe(5);
  });

  it("sums the viatico of the day", () => {
    const series = buildDailySeries(
      [
        makeDay({ date: "2026-10-19", hours: 8, viatico_amount: 180 }),
        makeDay({ date: "2026-10-20", hours: 8, viatico_amount: 180 }),
      ],
      "fulltime",
    );

    expect(series[0].viatico).toBe(180);
    expect(series[1].viatico).toBe(180);
  });
});

// ── buildBreakdown ────────────────────────────────────────────

describe("buildBreakdown", () => {
  it("groups by concept and sums the hours", () => {
    const rows = buildBreakdown(
      [
        makeDay({ date: "2026-10-19", hours: 4, concept: "Vuelo" }),
        makeDay({ date: "2026-10-20", hours: 6, concept: "Vuelo" }),
        makeDay({ date: "2026-10-20", hours: 2, concept: "Traslado" }),
      ],
      "concept",
      "fulltime",
    );

    expect(rows).toHaveLength(2);
    expect(rows[0].label).toBe("Vuelo");
    expect(rows[0].hours).toBe(10);
    expect(rows[0].entryCount).toBe(2);
    expect(rows[1].label).toBe("Traslado");
    expect(rows[1].hours).toBe(2);
  });

  it("computes the share of the total (sums to 100)", () => {
    const rows = buildBreakdown(
      [
        makeDay({ date: "2026-10-19", hours: 4, concept: "A" }),
        makeDay({ date: "2026-10-20", hours: 6, concept: "B" }),
      ],
      "concept",
      "fulltime",
    );

    const total = rows.reduce((sum, row) => sum + row.sharePct, 0);
    expect(total).toBeCloseTo(100, 5);

    const a = rows.find((row) => row.label === "A");
    const b = rows.find((row) => row.label === "B");
    expect(a?.sharePct).toBeCloseTo(40, 5);
    expect(b?.sharePct).toBeCloseTo(60, 5);
  });

  it("groups by month", () => {
    const rows = buildBreakdown(
      [
        makeDay({ date: "2026-10-01", hours: 4, concept: "A" }),
        makeDay({ date: "2026-11-02", hours: 6, concept: "A" }),
      ],
      "month",
      "fulltime",
    );

    expect(rows).toHaveLength(2);
    expect(rows[0].label).toBe("noviembre 2026");
    expect(rows[1].label).toBe("octubre 2026");
  });

  it("groups by day and assigns the extra hours of the day", () => {
    const rows = buildBreakdown(
      [makeDay({ date: "2026-10-19", hours: 10, concept: "A" })],
      "day",
      "fulltime",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe("19/10");
    expect(rows[0].extraHours).toBe(2);
  });

  it("ignores days without hours", () => {
    const rows = buildBreakdown(
      [makeDay({ date: "2026-10-19", hours: 0, concept: "Off" })],
      "concept",
      "fulltime",
    );

    expect(rows).toHaveLength(0);
  });

  it("does not lose extra hours when grouping by concept", () => {
    const rows = buildBreakdown(
      [
        makeDay({ date: "2026-10-19", hours: 6, concept: "A" }),
        makeDay({ date: "2026-10-19", hours: 4, concept: "B" }),
      ],
      "concept",
      "fulltime",
    );

    const totalExtra = rows.reduce((sum, row) => sum + row.extraHours, 0);
    expect(totalExtra).toBeCloseTo(2, 2);
  });
});

// ── computeSummaryKpis ────────────────────────────────────────

describe("computeSummaryKpis", () => {
  it("returns zeros when there are no entries", () => {
    const kpis = computeSummaryKpis([], "fulltime");

    expect(kpis.totalHours).toBe(0);
    expect(kpis.extraHours).toBe(0);
    expect(kpis.extraPct).toBe(0);
    expect(kpis.workingDays).toBe(0);
    expect(kpis.avgDailyHours).toBe(0);
  });

  it("totals hours, extras and viatico", () => {
    const kpis = computeSummaryKpis(
      [
        makeDay({ date: "2026-10-19", hours: 10, viatico_amount: 180 }),
        makeDay({ date: "2026-10-20", hours: 8 }),
      ],
      "fulltime",
    );

    expect(kpis.totalHours).toBe(18);
    expect(kpis.extraHours).toBe(2);
    expect(kpis.totalViatico).toBe(180);
    expect(kpis.workingDays).toBe(2);
    expect(kpis.totalDays).toBe(2);
  });

  it("averages over the worked days only", () => {
    const kpis = computeSummaryKpis(
      [
        makeDay({ date: "2026-10-19", hours: 8 }),
        makeDay({ date: "2026-10-20", hours: 0, concept: "Off" }),
      ],
      "fulltime",
    );

    expect(kpis.workingDays).toBe(1);
    expect(kpis.totalDays).toBe(2);
    expect(kpis.avgDailyHours).toBe(8);
  });

  it("computes the extra percentage", () => {
    const kpis = computeSummaryKpis(
      [makeDay({ date: "2026-10-19", hours: 10 })],
      "fulltime",
    );

    expect(kpis.extraPct).toBeCloseTo(20, 5);
  });
});
