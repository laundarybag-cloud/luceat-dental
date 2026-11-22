"use client";

import * as React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDot,
  Download,
  FileText,
  FileImage,
  Pill,
  Plus,
  Receipt,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  StickyNote,
} from "lucide-react";
import type { Appointment } from "@/lib/types";
import type { PatientRecord } from "@/lib/mock/patients";
import { doctorById } from "@/lib/mock/clinic";
import {
  INVOICE_STATUS_META,
  balanceOf,
  invoicesForPatient,
  patientBalance,
  patientLifetimeBilled,
  statusOf,
  totalOf,
} from "@/lib/mock/billing";
import Link from "next/link";
import { endOf, formatTime } from "@/lib/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, Progress, Separator } from "@/components/ui/primitives";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { fmtDate } from "./patients-register";
import { useI18n } from "@/components/i18n/locale-context";

/* ------------------------------------------------------------- helpers */

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h3 className="text-card text-ink">{title}</h3>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-small text-ink-faint">{text}</p>;
}

function DefRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-[0.75rem] text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-end text-small text-ink">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------ Overview */

export function OverviewTab({
  patient,
  appointments,
}: {
  patient: PatientRecord;
  appointments: Appointment[];
}) {
  const { t } = useI18n();
  const doctor = doctorById(patient.primaryDoctorId);
  const upcoming = appointments.filter(
    (a) => a.start > "2026-11-20T23:59" && a.status !== "cancelled"
  );
  const activePlan = patient.plans[0];
  const planDone = activePlan
    ? activePlan.steps.filter((s) => s.status === "done").length
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title={t("patients.details")} className="lg:col-span-1">
        <dl className="divide-y divide-line">
          <DefRow label={t("patients.patientId")} value={<span className="tabular-nums">{patient.ref}</span>} />
          <DefRow label={t("patients.registered")} value={fmtDate(patient.registered)} />
          <DefRow label={t("patients.gender")} value={patient.gender} />
          <DefRow label={t("patients.age")} value={`${patient.age}`} />
          <DefRow
            label={t("patients.phone")}
            value={
              <span dir="ltr" className="inline-block tabular-nums">
                {patient.phone}
              </span>
            }
          />
          <DefRow label={t("patients.email")} value={<span className="break-all">{patient.email}</span>} />
          <DefRow label={t("patients.address")} value={patient.address} />
          <DefRow label={t("patients.insurer")} value={patient.insurer} />
          <DefRow
            label={t("patients.primaryClinician")}
            value={
              doctor ? (
                <span className="flex items-center justify-end gap-1.5">
                  <Avatar src={doctor.avatar} name={doctor.name} size="xs" />
                  {doctor.name}
                </span>
              ) : (
                "—"
              )
            }
          />
        </dl>
      </Panel>

      <div className="space-y-4 lg:col-span-2">
        {/* Safety strip — the things a clinician must see before treating. */}
        <Panel title={t("patients.clinicalAlerts")}>
          {patient.allergies.length === 0 &&
          patient.conditions.length === 0 &&
          patient.medications.length === 0 ? (
            <p className="flex items-center gap-2 text-small text-ink-muted">
              <ShieldCheck className="size-4 text-status-completed" />
              {t("patients.noHistory")}
            </p>
          ) : (
            <div className="space-y-2.5">
              {patient.allergies.map((a) => (
                <div
                  key={a.substance}
                  className="flex items-start gap-2.5 rounded-field border border-status-cancelled/25 bg-status-cancelled-bg/60 px-3 py-2.5"
                >
                  <AlertTriangle className="mt-px size-4 shrink-0 text-status-cancelled" />
                  <div className="min-w-0">
                    <p className="text-small font-medium text-ink">
                      Allergy — {a.substance}{" "}
                      <Badge tone="danger" className="ms-1 align-middle">
                        {a.severity}
                      </Badge>
                    </p>
                    <p className="text-[0.75rem] text-ink-muted">{a.reaction}</p>
                  </div>
                </div>
              ))}
              {patient.conditions.map((c) => (
                <div
                  key={c.name}
                  className="flex items-start gap-2.5 rounded-field border border-line bg-canvas px-3 py-2.5"
                >
                  <Stethoscope className="mt-px size-4 shrink-0 text-ink-muted" />
                  <div className="min-w-0">
                    <p className="text-small font-medium text-ink">
                      {c.name}{" "}
                      <span className="font-normal text-ink-faint">
                        since {c.since}
                      </span>
                    </p>
                    {c.note && (
                      <p className="text-[0.75rem] text-ink-muted">{c.note}</p>
                    )}
                  </div>
                </div>
              ))}
              {patient.medications.map((m) => (
                <div
                  key={m.name}
                  className="flex items-start gap-2.5 rounded-field border border-line bg-canvas px-3 py-2.5"
                >
                  <Pill className="mt-px size-4 shrink-0 text-ink-muted" />
                  <div className="min-w-0">
                    <p className="text-small font-medium text-ink">
                      {m.name}{" "}
                      <span className="font-normal text-ink-muted">{m.dose}</span>
                    </p>
                    <p className="text-[0.75rem] text-ink-muted">{m.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title={t("patients.nextAppointment")}>
            {upcoming.length ? (
              <div>
                <p className="text-title text-ink">
                  {fmtDate(upcoming[0].start)}
                </p>
                <p className="mt-0.5 text-small tabular-nums text-ink-muted">
                  {formatTime(upcoming[0].start)}–{formatTime(endOf(upcoming[0]))}
                </p>
                <p className="mt-2 text-small text-ink">{upcoming[0].service}</p>
                <p className="text-[0.75rem] text-ink-muted">
                  {doctorById(upcoming[0].doctorId)?.name}
                </p>
              </div>
            ) : (
              <Empty text={t("empty.nothingRecallDue")} />
            )}
          </Panel>

          <Panel title={t("patients.accountBalance")}>
            <p
              className={cn(
                "text-title tabular-nums",
                patientBalance(patient.id) > 0
                  ? "text-status-pending"
                  : "text-ink"
              )}
            >
              {formatMoney(patientBalance(patient.id), true)}
            </p>
            <p className="mt-1 text-[0.75rem] text-ink-muted">
              {patientBalance(patient.id) > 0
                ? `${
                    invoicesForPatient(patient.id).filter(
                      (i) => !i.refund && balanceOf(i) > 0
                    ).length
                  } invoice(s) outstanding`
                : "All invoices settled."}
            </p>
            <Separator className="my-3" />
            <p className="text-[0.75rem] text-ink-muted">
              Lifetime billed{" "}
              <span className="font-semibold tabular-nums text-ink">
                {formatMoney(patientLifetimeBilled(patient.id))}
              </span>
            </p>
          </Panel>
        </div>

        {activePlan && (
          <Panel title={t("patients.activePlan")}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-small font-medium text-ink">
                {activePlan.title}
              </p>
              <span className="text-[0.75rem] tabular-nums text-ink-muted">
                {planDone} of {activePlan.steps.length} steps
              </span>
            </div>
            <Progress
              value={(planDone / activePlan.steps.length) * 100}
              className="mt-2"
            />
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ Medical history */

export function MedicalHistoryTab({ patient }: { patient: PatientRecord }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title={t("patients.allergies")}>
        {patient.allergies.length ? (
          <ul className="space-y-2">
            {patient.allergies.map((a) => (
              <li key={a.substance} className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-cancelled" />
                <div>
                  <p className="text-small font-medium text-ink">
                    {a.substance}
                  </p>
                  <p className="text-[0.75rem] text-ink-muted">
                    {a.severity} · {a.reaction}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No known allergies." />
        )}
      </Panel>

      <Panel title={t("patients.conditions")}>
        {patient.conditions.length ? (
          <ul className="space-y-2">
            {patient.conditions.map((c) => (
              <li key={c.name}>
                <p className="text-small font-medium text-ink">
                  {c.name}{" "}
                  <span className="font-normal text-ink-faint">
                    since {c.since}
                  </span>
                </p>
                {c.note && (
                  <p className="text-[0.75rem] text-ink-muted">{c.note}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No conditions recorded." />
        )}
      </Panel>

      <Panel title={t("patients.medications")}>
        {patient.medications.length ? (
          <ul className="space-y-2">
            {patient.medications.map((m) => (
              <li key={m.name} className="flex items-start gap-2.5">
                <Pill className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                <div>
                  <p className="text-small font-medium text-ink">
                    {m.name} <span className="font-normal">{m.dose}</span>
                  </p>
                  <p className="text-[0.75rem] text-ink-muted">{m.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No regular medications." />
        )}
      </Panel>

      <Panel title={t("patients.treatmentHistory")}>
        <ul className="space-y-2">
          {invoicesForPatient(patient.id)
            .flatMap((inv) =>
              inv.lines.map((l) => ({ ...l, date: inv.issued }))
            )
            .slice(0, 6)
            .map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-3 text-small"
              >
                <span className="min-w-0 truncate text-ink">
                  {l.description}
                </span>
                <span className="shrink-0 tabular-nums text-ink-faint">
                  {fmtDate(l.date)}
                </span>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------- Appointments */

export function AppointmentsTab({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const { t } = useI18n();
  if (!appointments.length) {
    return (
      <Panel title={t("patients.appointmentHistory")}>
        <Empty text={t("empty.noApptsInBook")} />
      </Panel>
    );
  }
  return (
    <Panel title={`Appointment history (${appointments.length})`}>
      <ul className="divide-y divide-line">
        {appointments.map((a) => {
          const d = doctorById(a.doctorId);
          return (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <div className="w-24 shrink-0">
                <p className="text-small tabular-nums text-ink">
                  {fmtDate(a.start)}
                </p>
                <p className="text-[0.6875rem] tabular-nums text-ink-faint">
                  {formatTime(a.start)}–{formatTime(endOf(a))}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-small text-ink">{a.service}</p>
                <p className="truncate text-[0.75rem] text-ink-muted">
                  {d?.name} · {d?.room}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------ Treatment plans */

const STEP_ICON = {
  done: CheckCircle2,
  active: CircleDot,
  planned: Circle,
} as const;

export function TreatmentPlansTab({ patient }: { patient: PatientRecord }) {
  const { t } = useI18n();
  if (!patient.plans.length) {
    return (
      <Panel title={t("patients.tab.plans")}>
        <EmptyState
          compact
          illustration={
            <span className="flex size-10 items-center justify-center rounded-full bg-forest-50">
              <FileText className="size-4 text-forest-400" />
            </span>
          }
          title={t("patients.noPlan")}
          description={t("patients.noPlanBody")}
          action={
            <Button variant="secondary" size="sm">
              <Plus />
              {t("patients.newPlan")}
            </Button>
          }
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      {patient.plans.map((plan) => {
        const total = plan.steps.reduce((s, x) => s + x.cost, 0);
        const paid = plan.steps
          .filter((s) => s.status === "done")
          .reduce((s, x) => s + x.cost, 0);
        const done = plan.steps.filter((s) => s.status === "done").length;

        return (
          <Panel
            key={plan.id}
            title={plan.title}
            action={
              <span className="text-[0.75rem] tabular-nums text-ink-muted">
                {formatMoney(total)} total
              </span>
            }
          >
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-4 text-[0.75rem] text-ink-muted">
              <span>
                Clinician{" "}
                <span className="text-ink">
                  {doctorById(plan.doctorId)?.name}
                </span>
              </span>
              <span>
                {t("patients.created")} <span className="text-ink">{fmtDate(plan.created)}</span>
              </span>
              <span>
                Completed{" "}
                <span className="text-ink tabular-nums">
                  {done}/{plan.steps.length}
                </span>
              </span>
              <span>
                Invoiced{" "}
                <span className="text-ink tabular-nums">
                  {formatMoney(paid)}
                </span>
              </span>
            </div>

            <Progress
              value={(done / plan.steps.length) * 100}
              className="mb-4"
            />

            <ol className="relative space-y-3 ps-1">
              <span
                className="absolute inset-y-2 start-[0.6875rem] w-px bg-line"
                aria-hidden
              />
              {plan.steps.map((step, i) => {
                const Icon = STEP_ICON[step.status];
                return (
                  <li key={i} className="relative flex items-start gap-3">
                    <span
                      className={cn(
                        "z-10 flex size-6 shrink-0 items-center justify-center rounded-full ring-4 ring-surface [&_svg]:size-3.5",
                        step.status === "done"
                          ? "bg-status-completed-bg text-status-completed"
                          : step.status === "active"
                            ? "bg-status-progress-bg text-status-progress"
                            : "bg-surface-sunken text-ink-faint"
                      )}
                    >
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-small text-ink">{step.name}</p>
                      <p className="text-[0.75rem] text-ink-muted">
                        {step.status === "done"
                          ? `Completed ${fmtDate(step.date)}`
                          : step.status === "active"
                            ? `Scheduled ${fmtDate(step.date)}`
                            : "Not yet scheduled"}
                      </p>
                    </div>
                    <span className="shrink-0 text-small tabular-nums text-ink-soft">
                      {formatMoney(step.cost)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Panel>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------- Prescriptions */

export function PrescriptionsTab({ patient }: { patient: PatientRecord }) {
  const { t } = useI18n();
  return (
    <Panel title={t("patients.tab.prescriptions")}>
      {patient.prescriptions.length ? (
        <ul className="divide-y divide-line">
          {patient.prescriptions.map((rx) => (
            <li key={rx.id} className="flex items-start gap-3 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-600">
                <Pill className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium text-ink">
                  {rx.drug} {rx.dose}
                </p>
                <p className="text-[0.75rem] text-ink-muted">{rx.course}</p>
                <p className="mt-0.5 text-[0.6875rem] text-ink-faint">
                  Issued {fmtDate(rx.issued)} by {doctorById(rx.doctorId)?.name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="No prescriptions issued." />
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------ Documents */

const DOC_ICON = {
  xray: ScanLine,
  scan: ScanLine,
  consent: FileText,
  referral: FileText,
  photo: FileImage,
} as const;

export function DocumentsTab({ patient }: { patient: PatientRecord }) {
  const { t } = useI18n();
  const toast = useToast();
  return (
    <Panel
      title={`Documents & imaging (${patient.documents.length})`}
      action={
        <Button variant="secondary" size="sm">
          <Plus />
          {t("patients.upload")}
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {patient.documents.map((doc) => {
          const Icon = DOC_ICON[doc.kind];
          return (
            <div
              key={doc.id}
              className="overflow-hidden rounded-card border border-line bg-canvas"
            >
              <div className="relative h-28 bg-forest-900">
                {doc.preview ? (
                  <Image
                    src={doc.preview}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 20rem"
                    className="object-cover opacity-90"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <FileText className="size-7 text-forest-300" />
                  </span>
                )}
              </div>
              <div className="flex items-start gap-2 p-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium text-ink">
                    {doc.name}
                  </p>
                  <p className="text-[0.6875rem] tabular-nums text-ink-faint">
                    {fmtDate(doc.added)} · {(doc.sizeKb / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download ${doc.name}`}
                  onClick={() =>
                    toast({
                      tone: "info",
                      title: t("patients.noFileYet"),
                      detail: t("patients.documentsNeedBackend"),
                    })
                  }
                >
                  <Download />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- Payments */

export function PaymentsTab({ patient }: { patient: PatientRecord }) {
  const { t } = useI18n();
  // Reads the billing module, not a second ledger, so the patient's balance
  // here always matches Payments & Invoices.
  const list = invoicesForPatient(patient.id);
  const owed = list.reduce(
    (sum, i) => (i.refund ? sum : sum + balanceOf(i)),
    0
  );

  return (
    <Panel
      title={`Invoices & payments (${list.length})`}
      action={
        <Link
          href="/payments"
          className="text-[0.75rem] font-medium text-forest-600 hover:text-forest-800"
        >
          {t("patients.openBilling")}
        </Link>
      }
    >
      {list.length === 0 ? (
        <Empty text={t("empty.noInvoicesYet")} />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {list.map((inv) => {
              const meta = INVOICE_STATUS_META[statusOf(inv)];
              return (
                <li key={inv.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-muted">
                    <Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/payments/${inv.id}`}
                      className="block truncate text-small text-ink hover:text-forest-700"
                    >
                      {inv.lines.map((l) => l.description).join(", ")}
                    </Link>
                    <p className="text-[0.75rem] tabular-nums text-ink-muted">
                      {inv.number} · {fmtDate(inv.issued)}
                      {inv.payments[0] ? ` · ${inv.payments[0].method}` : ""}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                      meta.chip
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="w-20 shrink-0 text-end text-small font-semibold tabular-nums text-ink">
                    {formatMoney(totalOf(inv), true)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-small text-ink-muted">{t("patients.outstanding")}</span>
            <span
              className={cn(
                "text-section tabular-nums",
                owed > 0 ? "text-status-pending" : "text-ink"
              )}
            >
              {formatMoney(owed, true)}
            </span>
          </div>
        </>
      )}
    </Panel>
  );
}

/* ----------------------------------------------------------------- Notes */

export function NotesTab({ patient }: { patient: PatientRecord }) {
  const { t } = useI18n();
  const toast = useToast();
  const [draft, setDraft] = React.useState("");

  return (
    <div className="space-y-4">
      <Panel title={t("patients.addNote")}>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("patients.notePlaceholder")}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[0.75rem] text-ink-muted">
            Notes form part of the clinical record and cannot be deleted once
            saved.
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled={!draft.trim()}
            onClick={() => {
              toast({
                tone: "info",
                title: t("patients.noteNotSaved"),
                detail: t("patients.noteNotSavedBody"),
              });
              setDraft("");
            }}
          >
            {t("patients.saveNote")}
          </Button>
        </div>
      </Panel>

      <Panel title={`Previous notes (${patient.notes.length})`}>
        <ul className="space-y-3">
          {patient.notes.map((n) => {
            const d = doctorById(n.doctorId);
            return (
              <li
                key={n.id}
                className="rounded-field border border-line bg-canvas p-3"
              >
                <div className="flex items-center gap-2">
                  {d && <Avatar src={d.avatar} name={d.name} size="xs" />}
                  <p className="text-[0.75rem] font-medium text-ink">
                    {d?.name}
                  </p>
                  <span className="ms-auto text-[0.6875rem] tabular-nums text-ink-faint">
                    {fmtDate(n.at)}
                  </span>
                </div>
                <p className="mt-2 flex items-start gap-2 text-small leading-5 text-ink-soft">
                  <StickyNote className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
                  {n.body}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
