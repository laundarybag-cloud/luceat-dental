"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  FileText,
  Printer,
  Stethoscope,
  StickyNote,
  Wallet,
} from "lucide-react";
import type { PatientRecord, TreatmentPlan, TreatmentStep } from "@/lib/mock/patients";
import { doctorProfileById } from "@/lib/mock/doctors";
import { serviceById } from "@/lib/mock/schedule";
import { summarise, PLAN_STATUS_META, STEP_STATUS_META } from "@/lib/treatment";
import { relocalizePlan } from "@/lib/mock/treatment-plans";
import { formatDuration, formatTime } from "@/lib/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress, Tooltip } from "@/components/ui/primitives";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { Panel } from "@/components/patients/profile-tabs";
import { fmtDate } from "@/components/patients/patients-register";
import { ScheduleStepDialog } from "./schedule-step";
import { useI18n } from "@/components/i18n/locale-context";

const STEP_ICON = {
  done: CheckCircle2,
  active: CircleDot,
  planned: Circle,
} as const;

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "pending";
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-[0.75rem] text-ink-muted">{label}</p>
      <p
        data-metric
        className={cn(
          "mt-0.5 text-title",
          tone === "pending" ? "text-status-pending" : "text-ink"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">{hint}</p>
    </div>
  );
}

export function PlanDetail({
  plan: initialPlan,
  patient,
}: {
  plan: TreatmentPlan;
  patient: PatientRecord;
}) {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const { can } = useRole();
  const [plan, setPlan] = React.useState(initialPlan);
  const [scheduling, setScheduling] = React.useState<TreatmentStep | null>(null);
  const [note, setNote] = React.useState("");

  const summary = summarise(plan);
  const meta = PLAN_STATUS_META[summary.status];
  const doctor = doctorProfileById(plan.doctorId);
  const totalChairTime = plan.steps.reduce(
    (sum, s) => sum + (serviceById(s.serviceId)?.durationMin ?? 0),
    0
  );

  const schedule = (stepId: string, startISO: string, doctorId: string) => {
    setPlan((p) => ({
      ...p,
      steps: p.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              status: "active" as const,
              date: startISO.slice(0, 10),
              appointmentId: `ap-plan-${stepId}`,
              note: `Booked with ${doctorProfileById(doctorId)?.name} at ${formatTime(startISO)}.`,
            }
          : s
      ),
    }));
  };

  const complete = (step: TreatmentStep) => {
    // Cloning drops the language getters, so the copy is re-resolved.
    setPlan((p) =>
      relocalizePlan({
        ...p,
        steps: p.steps.map((s) =>
          s.id === step.id ? { ...s, status: "done" as const } : s
        ),
      })
    );
    toast({
      tone: "success",
      title: `${step.name} marked completed`,
      detail: `${formatMoney(step.cost)} is now invoiceable. Session state only — nothing was billed.`,
    });
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/treatment-plans">
          <ArrowLeft className="rtl:rotate-180" />
          {t("plans.all")}
        </Link>
      </Button>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-[linear-gradient(104deg,var(--color-surface)_0%,var(--color-canvas)_60%,var(--color-forest-50)_100%)] p-5 md:flex-row md:items-center">
          <Avatar
            src={patient.avatar}
            name={patient.name}
            size="xl"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title text-ink">{plan.title}</h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                  meta.chip
                )}
              >
                {t(meta.labelKey)}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
              <Link
                href={`/patients/${patient.id}`}
                className="font-medium text-forest-600 hover:text-forest-800"
              >
                {patient.name}
              </Link>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{patient.ref}</span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5">
                {doctor && (
                  <Avatar src={doctor.avatar} name={doctor.name} size="xs" />
                )}
                {doctor?.name}
              </span>
              <span aria-hidden>·</span>
              <span>Created {fmtDate(plan.created)}</span>
            </p>
            <p className="mt-1 text-[0.75rem] text-ink-faint">{t(meta.hintKey)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              aria-label={t("plans.printPlan")}
              onClick={() =>
                toast({
                  tone: "info",
                  title: t("patients.printNeedsBackend"),
                  detail: t("plans.printBody"),
                })
              }
            >
              <Printer />
            </Button>
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-small text-ink-muted">
              {summary.completed} of {summary.sessions} sessions completed
            </p>
            <p className="text-small font-semibold tabular-nums text-ink">
              {Math.round(summary.progress)}%
            </p>
          </div>
          <Progress value={summary.progress} className="mt-2" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t("plans.planValue")}
          value={formatMoney(summary.total)}
          hint={t("h.sessionsChairTime", {
              sessions: fmt.number(summary.sessions),
              duration: formatDuration(totalChairTime),
            })}
        />
        <Stat
          label={t("plans.invoiced")}
          value={formatMoney(summary.invoiced)}
          hint={t("h.completedSessions", {
              count: fmt.number(summary.completed),
            })}
        />
        <Stat
          label={t("plans.remaining")}
          value={formatMoney(summary.remaining)}
          hint={t("h.sessionsToDeliver", {
              count: fmt.number(summary.sessions - summary.completed),
            })}
        />
        <Stat
          label={t("plans.notScheduled")}
          value={String(summary.unscheduled)}
          hint={
            summary.unscheduled
              ? t("plans.needsAppointment")
              : t("empty.everySessionBooked")
          }
          tone={summary.unscheduled ? "pending" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Timeline */}
        <Panel title={t("plans.sequence")}>
          <ol className="relative space-y-1">
            <span
              className="absolute inset-y-3 start-[0.875rem] w-px bg-line"
              aria-hidden
            />
            {plan.steps.map((step, i) => {
              const Icon = STEP_ICON[step.status];
              const service = serviceById(step.serviceId);
              const stepMeta = STEP_STATUS_META[step.status];
              return (
                <li
                  key={step.id}
                  className="relative flex items-start gap-3 rounded-field px-1 py-2.5 transition-colors hover:bg-canvas"
                >
                  <span
                    className={cn(
                      "z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-surface [&_svg]:size-4",
                      step.status === "done"
                        ? "bg-status-completed-bg text-status-completed"
                        : step.status === "active"
                          ? "bg-status-checkedin-bg text-status-checkedin"
                          : "bg-surface-sunken text-ink-faint"
                    )}
                  >
                    <Icon />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-small font-medium text-ink">
                        <span className="tabular-nums text-ink-faint">
                          {i + 1}.
                        </span>{" "}
                        {step.name}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
                          stepMeta.chip
                        )}
                      >
                        {t(stepMeta.labelKey)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.75rem] text-ink-muted">
                      {service?.name}
                      {service && (
                        <>
                          {" · "}
                          <span className="tabular-nums">
                            {formatDuration(service.durationMin)}
                          </span>
                        </>
                      )}
                      {step.date && (
                        <>
                          {" · "}
                          <span className="tabular-nums">
                            {step.status === "done" ? t("status.completed") : "Booked"}{" "}
                            {fmtDate(step.date)}
                          </span>
                        </>
                      )}
                    </p>
                    {step.note && (
                      <p className="mt-1 text-[0.6875rem] text-ink-faint">
                        {step.note}
                      </p>
                    )}

                    {step.status !== "done" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setScheduling(step)}
                        >
                          <CalendarClock />
                          {step.date ? "Reschedule" : "Schedule"}
                        </Button>
                        {step.date && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!can("records.notes.add")}
                            onClick={() => complete(step)}
                          >
                            <Check />
                            {t("appt.drawer.markCompleted")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="shrink-0 text-small font-semibold tabular-nums text-ink">
                    {formatMoney(step.cost)}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-small text-ink-muted">{t("plans.planTotal")}</span>
            <span className="text-section tabular-nums text-ink">
              {formatMoney(summary.total)}
            </span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={t("plans.sessions")}>
            <ul className="space-y-2.5">
              {[
                [t("status.completed"), summary.completed, "text-status-completed"],
                ["Scheduled", summary.scheduled, "text-status-checkedin"],
                [t("plans.notScheduled"), summary.unscheduled, "text-status-pending"],
              ].map(([label, value, tone]) => (
                <li
                  key={label as string}
                  className="flex items-center justify-between text-small"
                >
                  <span className="text-ink-muted">{label}</span>
                  <span
                    className={cn("font-semibold tabular-nums", tone as string)}
                  >
                    {value as number}
                  </span>
                </li>
              ))}
            </ul>
            {summary.nextUnscheduled && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[0.75rem] text-ink-muted">{t("plans.nextToBook")}</p>
                <p className="mt-0.5 text-small font-medium text-ink">
                  {summary.nextUnscheduled.name}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setScheduling(summary.nextUnscheduled!)}
                >
                  <CalendarClock />
                  {t("plans.scheduleSession")}
                </Button>
              </div>
            )}
          </Panel>

          <Panel title={t("plans.costs")}>
            <ul className="space-y-2.5 text-small">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-muted">
                  <Wallet className="size-3.5" />
                  {t("plans.planValue")}
                </span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatMoney(summary.total)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-muted">
                  <FileText className="size-3.5" />
                  {t("plans.invoicedSoFar")}
                </span>
                <span className="tabular-nums text-ink">
                  {formatMoney(summary.invoiced)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-muted">
                  <Clock className="size-3.5" />
                  {t("plans.stillToInvoice")}
                </span>
                <span className="tabular-nums text-ink">
                  {formatMoney(summary.remaining)}
                </span>
              </li>
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-[0.6875rem] leading-4 text-ink-faint">
              Estimates from the service catalogue. Insurance contributions and
              agreed discounts are applied at invoicing.
            </p>
          </Panel>

          <Panel title={t("appt.form.clinician")}>
            {doctor ? (
              <div className="flex items-center gap-3">
                <Avatar src={doctor.avatar} name={doctor.name} size="md" />
                <div className="min-w-0">
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="block truncate text-small font-medium text-forest-600 hover:text-forest-800"
                  >
                    {doctor.name}
                  </Link>
                  <p className="truncate text-[0.75rem] text-ink-muted">
                    {doctor.specialty} · {doctor.room}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-small text-ink-muted">{t("plans.noClinician")}</p>
            )}
            <Tooltip content={t("hint.stepsChecked")}>
              <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[0.6875rem] text-ink-faint">
                <Stethoscope className="mt-px size-3 shrink-0" />
                {t("plans.sessionsAgainstHours")}
              </p>
            </Tooltip>
          </Panel>
        </div>
      </div>

      <Panel title={t("plans.notes")}>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("plans.notesPlaceholder")}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[0.75rem] text-ink-muted">
            <StickyNote className="size-3.5" />
            {t("plans.notesHint")}
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled={!note.trim()}
            onClick={() => {
              toast({
                tone: "info",
                title: t("patients.noteNotSaved"),
                detail: t("plans.notesNotStored"),
              });
              setNote("");
            }}
          >
            {t("patients.saveNote")}
          </Button>
        </div>
      </Panel>

      <p className="text-[0.75rem] text-ink-muted">
        Scheduling and completion are held in this browser session only — a
        reload restores the sample plan.
      </p>

      <ScheduleStepDialog
        step={scheduling}
        patientName={patient.name}
        defaultDoctorId={plan.doctorId}
        onOpenChange={(open) => !open && setScheduling(null)}
        onScheduled={schedule}
      />
    </div>
  );
}
