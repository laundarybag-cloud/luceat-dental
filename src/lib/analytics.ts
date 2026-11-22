/**
 * Reporting aggregations.
 *
 * Nothing here invents a figure. Every number is computed from the same
 * fixtures the other modules render: the appointment book, the patient
 * register, invoices, treatment plans, clinician rotas and the assistant's
 * conversations. If a module's data changes, these reports move with it.
 */
import { weekAppointments, serviceById, TODAY } from "./mock/schedule";
import { patientRecords } from "./mock/patients";
import { doctorProfiles } from "./mock/doctors";
import { planIndex } from "./mock/treatment-plans";
import {
  invoices,
  paidOf,
  totalOf,
  balanceOf,
} from "./mock/billing";
import { assistantMetrics, conversations } from "./mock/assistant";
import { catalogue } from "./mock/catalogue";
import { getLocale, LOCALE_META } from "./i18n/locale";
import type { MessageKey } from "./i18n";

/**
 * Chart axis labels are user-visible, so they follow the active language.
 * Built per call rather than once at module load: the locale can change
 * while the page is open.
 */
const axisFormat = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE_META[getLocale()].intlTag, {
    timeZone: "UTC",
    ...opts,
  });

export type RangeKey = "7d" | "30d" | "90d" | "12m" | "all";

export const RANGES: {
  key: RangeKey;
  labelKey: MessageKey;
  days: number | null;
}[] = [
  { key: "7d", labelKey: "range.7d", days: 7 },
  { key: "30d", labelKey: "range.30d", days: 30 },
  { key: "90d", labelKey: "range.90d", days: 90 },
  { key: "12m", labelKey: "range.12m", days: 365 },
  { key: "all", labelKey: "range.all", days: null },
];

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Inclusive start date for a range, or null for all time. */
export function rangeStart(range: RangeKey): string | null {
  const def = RANGES.find((r) => r.key === range);
  if (!def?.days) return null;
  return shiftDate(TODAY, -def.days);
}

const inRange = (isoDate: string, start: string | null) =>
  !start || isoDate.slice(0, 10) >= start;

/* -------------------------------------------------------------- revenue */

export function revenueReport(range: RangeKey) {
  const start = rangeStart(range);
  const list = invoices.filter((i) => inRange(i.issued, start));

  const invoiced = list.reduce((s, i) => s + totalOf(i), 0);
  const collected = list.reduce(
    (s, i) => s + paidOf(i) - (i.refund?.amount ?? 0),
    0
  );
  const outstanding = list.reduce(
    (s, i) => (i.refund ? s : s + balanceOf(i)),
    0
  );
  const refunded = list.reduce((s, i) => s + (i.refund?.amount ?? 0), 0);
  const discounts = list.reduce((s, i) => s + (i.discount?.amount ?? 0), 0);

  // By service, from invoice lines.
  const byServiceMap = new Map<string, { revenue: number; count: number }>();
  for (const inv of list) {
    for (const line of inv.lines) {
      const cur = byServiceMap.get(line.serviceId) ?? { revenue: 0, count: 0 };
      cur.revenue += line.amount;
      cur.count += 1;
      byServiceMap.set(line.serviceId, cur);
    }
  }
  const byService = [...byServiceMap.entries()]
    .map(([serviceId, v]) => ({
      serviceId,
      name: serviceById(serviceId)?.name ?? serviceId,
      ...v,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // By clinician.
  const byClinicianMap = new Map<string, number>();
  for (const inv of list) {
    byClinicianMap.set(
      inv.doctorId,
      (byClinicianMap.get(inv.doctorId) ?? 0) + totalOf(inv)
    );
  }
  const byClinician = doctorProfiles
    .map((d) => ({
      doctorId: d.id,
      name: d.name,
      avatar: d.avatar,
      revenue: byClinicianMap.get(d.id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Trend. The bucket has to follow the range: bucketing 30 days by month
  // produced a two-bar chart that read as broken rather than as data.
  const bucket: "day" | "week" | "month" =
    range === "7d" || range === "30d"
      ? "day"
      : range === "90d"
        ? "week"
        : "month";

  /** Start-of-bucket key for a date, so invoices and payments land together. */
  const bucketKey = (iso: string) => {
    const date = iso.slice(0, 10);
    if (bucket === "month") return `${date.slice(0, 7)}-01`;
    if (bucket === "day") return date;
    const d = new Date(`${date}T00:00:00.000Z`);
    // ISO weeks start Monday; getUTCDay() is 0 on Sunday.
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };

  const trendMap = new Map<string, { invoiced: number; collected: number }>();
  const touch = (key: string) => {
    if (!trendMap.has(key)) trendMap.set(key, { invoiced: 0, collected: 0 });
    return trendMap.get(key)!;
  };
  for (const inv of list) {
    touch(bucketKey(inv.issued)).invoiced += totalOf(inv);
    for (const p of inv.payments) touch(bucketKey(p.date)).collected += p.amount;
  }

  const dayFmt = axisFormat({ day: "numeric", month: "short" });
  const monthFmt = axisFormat({ month: "short", year: "2-digit" });

  // Every bucket in the window, not only the ones with invoices: a chart
  // that skips empty days spaces unequal gaps evenly and misreads the shape.
  const firstKey = [...trendMap.keys()].sort()[0];
  const windowStart = bucketKey(start ?? firstKey ?? TODAY);
  const keys: string[] = [];
  if (trendMap.size) {
    const cursor = new Date(`${windowStart}T00:00:00.000Z`);
    const last = new Date(`${bucketKey(TODAY)}T00:00:00.000Z`);
    // A 12-month "all" window could run long if a fixture dated far back;
    // the cap keeps a malformed date from spinning here.
    for (let guard = 0; cursor <= last && guard < 800; guard++) {
      keys.push(cursor.toISOString().slice(0, 10));
      if (bucket === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
      else if (bucket === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
      else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    // Any bucket outside the computed window (an early payment, say) still
    // belongs on the chart.
    for (const k of trendMap.keys()) if (!keys.includes(k)) keys.push(k);
    keys.sort();
  }

  const trend = keys.map((key) => ({
    key,
    label: (bucket === "month" ? monthFmt : dayFmt).format(
      new Date(`${key}T00:00:00.000Z`)
    ),
    ...(trendMap.get(key) ?? { invoiced: 0, collected: 0 }),
  }));

  return {
    invoices: list.length,
    invoiced,
    collected,
    outstanding,
    refunded,
    discounts,
    collectionRate: invoiced ? (collected / invoiced) * 100 : 0,
    byService,
    byClinician,
    trend,
    trendBucket: bucket,
    unpaid: list.filter((i) => !i.refund && balanceOf(i) > 0).length,
  };
}

/* --------------------------------------------------------- appointments */

export function appointmentReport(range: RangeKey) {
  const start = rangeStart(range);
  const list = weekAppointments.filter((a) => inRange(a.start, start));

  const count = (s: string) => list.filter((a) => a.status === s).length;
  const completed = count("completed");
  const cancelled = count("cancelled");
  const noShow = count("no_show");
  const booked = list.length;

  const byDayMap = new Map<
    string,
    { completed: number; cancelled: number; noShow: number; other: number }
  >();
  for (const a of list) {
    const key = a.start.slice(0, 10);
    if (!byDayMap.has(key))
      byDayMap.set(key, { completed: 0, cancelled: 0, noShow: 0, other: 0 });
    const row = byDayMap.get(key)!;
    if (a.status === "completed") row.completed += 1;
    else if (a.status === "cancelled") row.cancelled += 1;
    else if (a.status === "no_show") row.noShow += 1;
    else row.other += 1;
  }
  const dayFmt = axisFormat({ weekday: "short", day: "numeric" });
  const byDay = [...byDayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({
      key,
      day: dayFmt.format(new Date(`${key}T00:00:00.000Z`)),
      ...v,
    }));

  const chairMinutes = list
    .filter((a) => a.status === "completed")
    .reduce((s, a) => s + a.durationMin, 0);

  // Demand by hour of day — which part of the day the book actually fills.
  const hourMap = new Map<number, number>();
  for (const a of list) {
    const h = new Date(a.start).getUTCHours();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }
  const byHour = [...hourMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, count]) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));

  return {
    booked,
    completed,
    cancelled,
    noShow,
    cancellationRate: booked ? (cancelled / booked) * 100 : 0,
    noShowRate: booked ? (noShow / booked) * 100 : 0,
    completionRate: booked ? (completed / booked) * 100 : 0,
    byDay,
    byHour,
    chairHours: chairMinutes / 60,
    newPatients: list.filter((a) => a.isNewPatient).length,
  };
}

/* ------------------------------------------------------- patient growth */

export function patientReport(range: RangeKey) {
  const start = rangeStart(range);
  const registered = patientRecords.filter((p) => inRange(p.registered, start));

  const monthMap = new Map<string, number>();
  for (const p of patientRecords) {
    const key = p.registered.slice(0, 7);
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const monthFmt = axisFormat({ month: "short", year: "2-digit" });
  const sorted = [...monthMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  // Every calendar month since the register opened, gaps included. Taking
  // the last twelve *entries* instead spaced four years of registrations
  // evenly and labelled the result "last 12 months".
  // `label` is the key the chart's XAxis reads.
  const growth: { key: string; label: string; added: number }[] = [];
  if (sorted.length) {
    const cursor = new Date(`${sorted[0][0]}-01T00:00:00.000Z`);
    const last = new Date(`${TODAY.slice(0, 7)}-01T00:00:00.000Z`);
    for (let guard = 0; cursor <= last && guard < 240; guard++) {
      const key = cursor.toISOString().slice(0, 7);
      growth.push({
        key,
        label: monthFmt.format(new Date(`${key}-01T00:00:00.000Z`)),
        added: monthMap.get(key) ?? 0,
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  const byStatus = ["active", "new", "treatment", "overdue", "inactive"].map(
    (status) => ({
      status,
      count: patientRecords.filter((p) => p.status === status).length,
    })
  );

  return {
    total: patientRecords.length,
    registeredInRange: registered.length,
    growth,
    byStatus,
    overdue: patientRecords.filter((p) => p.status === "overdue").length,
    withBalance: patientRecords.filter((p) =>
      invoices.some((i) => i.patientId === p.id && !i.refund && balanceOf(i) > 0)
    ).length,
  };
}

/* ---------------------------------------------------- doctor performance */

export function clinicianReport(range: RangeKey) {
  const start = rangeStart(range);
  const appts = weekAppointments.filter((a) => inRange(a.start, start));
  const invs = invoices.filter((i) => inRange(i.issued, start));

  return doctorProfiles
    .map((d) => {
      const mine = appts.filter((a) => a.doctorId === d.id);
      const completed = mine.filter((a) => a.status === "completed").length;
      const lost = mine.filter(
        (a) => a.status === "cancelled" || a.status === "no_show"
      ).length;
      const revenue = invs
        .filter((i) => i.doctorId === d.id)
        .reduce((s, i) => s + totalOf(i), 0);
      const plans = planIndex.filter((p) => p.plan.doctorId === d.id).length;
      return {
        doctorId: d.id,
        name: d.name,
        avatar: d.avatar,
        specialty: d.specialty,
        status: d.status,
        booked: mine.length,
        completed,
        lost,
        completionRate: mine.length ? (completed / mine.length) * 100 : 0,
        revenue,
        utilisation: d.utilisation,
        rating: d.rating,
        plans,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/* ------------------------------------------------------ service report */

export function serviceReport(range: RangeKey) {
  const start = rangeStart(range);
  const appts = weekAppointments.filter((a) => inRange(a.start, start));
  const invs = invoices.filter((i) => inRange(i.issued, start));

  return catalogue
    .map((s) => {
      const booked = appts.filter((a) => a.serviceId === s.id).length;
      const revenue = invs
        .flatMap((i) => i.lines)
        .filter((l) => l.serviceId === s.id)
        .reduce((sum, l) => sum + l.amount, 0);
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price,
        durationMin: s.durationMin,
        booked,
        revenue,
        active: s.active,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/* --------------------------------------------------------- AI reporting */

export function aiReport() {
  const m = assistantMetrics();
  const byTopic = new Map<string, number>();
  for (const c of conversations) {
    byTopic.set(c.topic, (byTopic.get(c.topic) ?? 0) + 1);
  }
  return {
    ...m,
    topics: [...byTopic.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/* ------------------------------------------------------------- headline */

/**
 * The figures Module 01 shows. Derived here so the dashboard and the reports
 * can never disagree about how many patients the clinic has.
 */
export function clinicHeadline() {
  const today = weekAppointments.filter((a) => a.start.startsWith(TODAY));
  const sixtyDaysAgo = shiftDate(TODAY, -60);
  const rev = revenueReport("30d");

  return {
    totalPatients: patientRecords.length,
    newPatients: patientRecords.filter((p) => p.registered >= sixtyDaysAgo)
      .length,
    appointmentsToday: today.length,
    completedToday: today.filter((a) => a.status === "completed").length,
    cancelledToday: today.filter((a) => a.status === "cancelled").length,
    awaitingConfirmation: today.filter((a) => a.status === "pending").length,
    chairsInUse: new Set(
      today
        .filter((a) => a.status === "in_progress" || a.status === "checked_in")
        .map((a) => a.doctorId)
    ).size,
    operatories: doctorProfiles.length,
    revenue30d: rev.invoiced,
    collected30d: rev.collected,
  };
}

/* ------------------------------------------------------------------ CSV */

/** Escapes a value for CSV: quotes, commas and newlines are all handled. */
function csvCell(value: string | number) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(
  columns: { key: string; header: string }[],
  rows: Record<string, string | number>[]
) {
  const head = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => csvCell(r[c.key])).join(","))
    .join("\n");
  return `${head}\n${body}\n`;
}

/* ------------------------------------------------------ dashboard KPIs */

/**
 * Series and period-over-period deltas for the overview's four headline
 * cards. A delta is `null` whenever the comparison window holds no data —
 * the fixture's appointment book covers a single week, so inventing a
 * "+9.1% vs last Friday" would be a decorative lie. The card then renders
 * without a delta chip rather than with a made-up one.
 */
export function kpiSeries() {
  const monthKeys: string[] = [];
  const base = new Date(`${TODAY}T00:00:00.000Z`);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() - i, 1);
    monthKeys.push(d.toISOString().slice(0, 7));
  }

  // Register size at the end of each month (cumulative registrations).
  const totalSeries = monthKeys.map(
    (m) => patientRecords.filter((p) => p.registered.slice(0, 7) <= m).length
  );
  const newSeries = monthKeys.map(
    (m) => patientRecords.filter((p) => p.registered.slice(0, 7) === m).length
  );

  /**
   * Period-over-period change, or null when the comparison period is too
   * thin to divide by. A near-empty prior window yields a "+11,048%" that
   * says nothing true about the clinic, so it is suppressed rather than
   * shown.
   */
  const pct = (now: number, before: number) => {
    if (before <= 0) return null;
    const change = ((now - before) / before) * 100;
    return Math.abs(change) > 300 ? null : change;
  };

  // Register growth over the last 30 days.
  const thirty = shiftDate(TODAY, -30);
  const registerBefore = patientRecords.filter(
    (p) => p.registered < thirty
  ).length;
  const totalDelta = pct(patientRecords.length, registerBefore);

  // Last 60 days of registrations against the 60 before them.
  const sixty = shiftDate(TODAY, -60);
  const oneTwenty = shiftDate(TODAY, -120);
  const newNow = patientRecords.filter((p) => p.registered >= sixty).length;
  const newBefore = patientRecords.filter(
    (p) => p.registered >= oneTwenty && p.registered < sixty
  ).length;
  const newDelta = pct(newNow, newBefore);

  // Appointments per day across the whole fixture week.
  const dayCounts = new Map<string, number>();
  for (const a of weekAppointments) {
    const k = a.start.slice(0, 10);
    dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
  }
  const todaySeries = [...dayCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, n]) => n);

  // Invoiced per day across the last 30 days.
  const revMap = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.issued.slice(0, 10) < thirty) continue;
    const k = inv.issued.slice(0, 10);
    revMap.set(k, (revMap.get(k) ?? 0) + totalOf(inv));
  }
  const revenueSeries = [...revMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);

  const sixtyBack = shiftDate(TODAY, -60);
  const revNow = invoices
    .filter((i) => i.issued >= thirty)
    .reduce((s, i) => s + totalOf(i), 0);
  const revBefore = invoices
    .filter((i) => i.issued >= sixtyBack && i.issued < thirty)
    .reduce((s, i) => s + totalOf(i), 0);

  return {
    total: { series: totalSeries, delta: totalDelta },
    newPatients: { series: newSeries, delta: newDelta },
    // One week of fixture data: there is no prior Friday to compare against.
    today: { series: todaySeries, delta: null as number | null },
    revenue: { series: revenueSeries, delta: pct(revNow, revBefore) },
  };
}
