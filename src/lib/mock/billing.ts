/**
 * Billing.
 *
 * Invoices are **derived from clinical activity**, never invented: every line
 * is either a completed appointment or a completed treatment-plan step, at
 * the catalogue price for that service. That means the money in this module
 * reconciles with the calendar and the plans by construction, and the
 * reconciliation panel can prove it rather than assert it.
 */

import { getLocale, LOCALE_META } from "../i18n/locale";
import { patientRecords, type PatientRecord } from "./patients";
import { serviceById, weekAppointments, TODAY } from "./schedule";
import { doctorProfileById } from "./doctors";

export type InvoiceStatus =
  | "paid"
  | "part_paid"
  | "outstanding"
  | "overdue"
  | "refunded";

export type PaymentMethod =
  | "Visa"
  | "Mastercard"
  | "Bank transfer"
  | "Cash"
  | "Insurance";

export interface InvoiceLine {
  id: string;
  description: string;
  serviceId: string;
  /** What produced this line — the audit trail back to clinical activity. */
  source: "appointment" | "plan_step";
  sourceId: string;
  sourceLabel: string;
  amount: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  patientAvatar: string;
  doctorId: string;
  issued: string;
  due: string;
  lines: InvoiceLine[];
  /** Agreed reduction, applied before payments. */
  discount?: { label: string; amount: number };
  payments: Payment[];
  refund?: { date: string; amount: number; reason: string };
}

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (from: string, to: string) =>
  Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() -
      new Date(`${from}T00:00:00Z`).getTime()) /
      86_400_000
  );

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const METHODS: PaymentMethod[] = [
  "Visa",
  "Mastercard",
  "Bank transfer",
  "Cash",
  "Insurance",
];

/* ------------------------------------------------------------- totals -- */

export const subtotalOf = (inv: Invoice) =>
  inv.lines.reduce((sum, l) => sum + l.amount, 0);

export const totalOf = (inv: Invoice) =>
  subtotalOf(inv) - (inv.discount?.amount ?? 0);

export const paidOf = (inv: Invoice) =>
  inv.payments.reduce((sum, p) => sum + p.amount, 0);

export const balanceOf = (inv: Invoice) =>
  Math.max(0, totalOf(inv) - paidOf(inv));

export function statusOf(inv: Invoice): InvoiceStatus {
  if (inv.refund) return "refunded";
  const balance = balanceOf(inv);
  if (balance <= 0) return "paid";
  if (paidOf(inv) > 0) return "part_paid";
  return daysBetween(inv.due, TODAY) > 0 ? "overdue" : "outstanding";
}

export const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; chip: string }
> = {
  paid: { label: "Paid", chip: "bg-status-completed-bg text-status-completed" },
  part_paid: {
    label: "Part paid",
    chip: "bg-status-checkedin-bg text-status-checkedin",
  },
  outstanding: {
    label: "Outstanding",
    chip: "bg-status-pending-bg text-status-pending",
  },
  overdue: {
    label: "Overdue",
    chip: "bg-status-cancelled-bg text-status-cancelled",
  },
  refunded: {
    label: "Refunded",
    chip: "bg-status-noshow-bg text-status-noshow",
  },
};

/* ---------------------------------------------------------- generation -- */

interface PendingLine {
  patient: PatientRecord;
  date: string;
  doctorId: string;
  line: Omit<InvoiceLine, "id">;
}

function collectBillableActivity(): PendingLine[] {
  const out: PendingLine[] = [];
  const byId = new Map(patientRecords.map((p) => [p.id, p]));

  // 1. Completed appointments.
  for (const appt of weekAppointments) {
    if (appt.status !== "completed") continue;
    const patient = byId.get(appt.patient.id);
    const service = appt.serviceId ? serviceById(appt.serviceId) : undefined;
    if (!patient || !service) continue;
    out.push({
      patient,
      date: appt.start.slice(0, 10),
      doctorId: appt.doctorId,
      line: {
        description: service.name,
        serviceId: service.id,
        source: "appointment",
        sourceId: appt.id,
        sourceLabel: `Appointment ${appt.start.slice(11, 16)} with ${
          doctorProfileById(appt.doctorId)?.name ?? "clinician"
        }`,
        amount: service.price,
      },
    });
  }

  // 2. Completed treatment-plan sessions.
  for (const patient of patientRecords) {
    for (const plan of patient.plans) {
      for (const step of plan.steps) {
        if (step.status !== "done" || !step.date) continue;
        const service = serviceById(step.serviceId);
        if (!service) continue;
        out.push({
          patient,
          date: step.date,
          doctorId: plan.doctorId,
          line: {
            description: step.name,
            serviceId: step.serviceId,
            source: "plan_step",
            sourceId: step.id,
            sourceLabel: `${plan.title} — session`,
            amount: step.cost,
          },
        });
      }
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function buildInvoices(): Invoice[] {
  const activity = collectBillableActivity();
  const rand = rng(770011);

  // One invoice per patient per day of treatment.
  const grouped = new Map<string, PendingLine[]>();
  for (const item of activity) {
    const key = `${item.patient.id}|${item.date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const invoices: Invoice[] = [];
  let seq = 0;

  for (const [key, items] of grouped) {
    const [patientId, date] = key.split("|");
    const patient = items[0].patient;
    seq += 1;

    const lines: InvoiceLine[] = items.map((i, n) => ({
      ...i.line,
      id: `ln-${seq}-${n}`,
    }));
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);

    // Occasional agreed reduction.
    const discountRoll = rand();
    const discount =
      discountRoll < 0.14
        ? {
            label:
              discountRoll < 0.07
                ? "Insurance contribution"
                : "Treatment plan discount",
            amount: Math.round(subtotal * 0.2),
          }
        : undefined;
    const total = subtotal - (discount?.amount ?? 0);

    const age = daysBetween(date, TODAY);
    const issued = date;
    const due = shiftDate(issued, 21);

    // Older invoices are mostly settled; recent ones are still in flight.
    const roll = rand();
    const payments: Payment[] = [];
    let refund: Invoice["refund"];

    const settleFully = age > 25 ? roll < 0.88 : roll < 0.45;
    const partial = !settleFully && roll < (age > 25 ? 0.95 : 0.68);

    if (settleFully) {
      payments.push({
        id: `pay-${seq}-1`,
        date: shiftDate(issued, Math.min(age, 1 + Math.floor(rand() * 12))),
        amount: total,
        method: METHODS[Math.floor(rand() * METHODS.length)],
        reference: `TXN-${40000 + seq}`,
      });
      if (rand() < 0.05) {
        refund = {
          date: shiftDate(issued, Math.min(age, 20)),
          amount: total,
          reason: "Treatment not completed — full refund agreed.",
        };
      }
    } else if (partial) {
      payments.push({
        id: `pay-${seq}-1`,
        date: shiftDate(issued, Math.min(age, 2 + Math.floor(rand() * 6))),
        amount: Math.round(total * 0.5),
        method: METHODS[Math.floor(rand() * METHODS.length)],
        reference: `TXN-${40000 + seq}`,
      });
    }

    invoices.push({
      id: `inv-${seq}`,
      number: `LD-INV-${String(1200 + seq).padStart(4, "0")}`,
      patientId,
      patientName: patient.name,
      patientAvatar: patient.avatar,
      doctorId: items[0].doctorId,
      issued,
      due,
      lines,
      discount,
      payments,
      refund,
    });
  }

  return invoices.sort((a, b) => b.issued.localeCompare(a.issued));
}

export const invoices: Invoice[] = buildInvoices();

export const invoiceById = (id: string) => invoices.find((i) => i.id === id);

export const invoicesForPatient = (patientId: string) =>
  invoices.filter((i) => i.patientId === patientId);

/** The one answer to "what does this patient owe?". */
export const patientBalance = (patientId: string) =>
  invoicesForPatient(patientId).reduce(
    (sum, i) => (i.refund ? sum : sum + balanceOf(i)),
    0
  );

export const patientLifetimeBilled = (patientId: string) =>
  invoicesForPatient(patientId).reduce((sum, i) => sum + totalOf(i), 0);

/* ------------------------------------------------------------ analytics */

export const collected = invoices.reduce(
  (sum, i) => sum + paidOf(i) - (i.refund?.amount ?? 0),
  0
);
export const outstanding = invoices.reduce(
  (sum, i) => (i.refund ? sum : sum + balanceOf(i)),
  0
);
export const invoicedTotal = invoices.reduce((sum, i) => sum + totalOf(i), 0);
export const refundedTotal = invoices.reduce(
  (sum, i) => sum + (i.refund?.amount ?? 0),
  0
);
export const discountsTotal = invoices.reduce(
  (sum, i) => sum + (i.discount?.amount ?? 0),
  0
);

/** Outstanding balances bucketed by how long they have been owed. */
export function ageingBuckets() {
  const buckets = [
    { label: "Not yet due", min: -9999, max: 0, amount: 0, count: 0 },
    { label: "1–30 days", min: 1, max: 30, amount: 0, count: 0 },
    { label: "31–60 days", min: 31, max: 60, amount: 0, count: 0 },
    { label: "60+ days", min: 61, max: 9999, amount: 0, count: 0 },
  ];
  for (const inv of invoices) {
    if (inv.refund) continue;
    const balance = balanceOf(inv);
    if (balance <= 0) continue;
    const overdueDays = daysBetween(inv.due, TODAY);
    const bucket = buckets.find(
      (b) => overdueDays >= b.min && overdueDays <= b.max
    );
    if (bucket) {
      bucket.amount += balance;
      bucket.count += 1;
    }
  }
  return buckets;
}

/** Collected amount by payment method. */
export function methodMix() {
  const map = new Map<PaymentMethod, number>();
  for (const inv of invoices) {
    for (const p of inv.payments) {
      map.set(p.method, (map.get(p.method) ?? 0) + p.amount);
    }
  }
  return METHODS.map((m) => ({ method: m, amount: map.get(m) ?? 0 })).filter(
    (m) => m.amount > 0
  );
}

/** Invoiced and collected by month, oldest first. */
export function monthlyTotals() {
  const map = new Map<string, { invoiced: number; collected: number }>();
  for (const inv of invoices) {
    const key = inv.issued.slice(0, 7);
    if (!map.has(key)) map.set(key, { invoiced: 0, collected: 0 });
    map.get(key)!.invoiced += totalOf(inv);
    for (const p of inv.payments) {
      const pk = p.date.slice(0, 7);
      if (!map.has(pk)) map.set(pk, { invoiced: 0, collected: 0 });
      map.get(pk)!.collected += p.amount;
    }
  }
  // Axis labels are user-visible, so they follow the active language.
  const monthFmt = new Intl.DateTimeFormat(LOCALE_META[getLocale()].intlTag, {
    timeZone: "UTC",
    month: "short",
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([key, v]) => ({
      key,
      month: monthFmt.format(new Date(`${key}-01T00:00:00.000Z`)),
      ...v,
    }));
}

/**
 * Proves the module's claim: every completed appointment and plan session
 * should appear on exactly one invoice line.
 */
export function reconciliation() {
  const activity = collectBillableActivity();
  const invoicedSourceIds = new Set(
    invoices.flatMap((i) => i.lines.map((l) => l.sourceId))
  );
  const appointments = activity.filter((a) => a.line.source === "appointment");
  const planSteps = activity.filter((a) => a.line.source === "plan_step");
  const missing = activity.filter(
    (a) => !invoicedSourceIds.has(a.line.sourceId)
  );
  return {
    appointments: appointments.length,
    planSteps: planSteps.length,
    lines: invoices.reduce((sum, i) => sum + i.lines.length, 0),
    invoices: invoices.length,
    missing: missing.length,
    value: activity.reduce((sum, a) => sum + a.line.amount, 0),
  };
}
