"use client";

import * as React from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  Clock,
  Info,
} from "lucide-react";
import type { TreatmentStep } from "@/lib/mock/patients";
import { doctorProfileById, doctorProfiles } from "@/lib/mock/doctors";
import { serviceById, weekAppointments } from "@/lib/mock/schedule";
import { catalogueById } from "@/lib/mock/catalogue";
import {
  availableSlots,
  findAvailabilityProblem,
  findConflict,
  findHoursProblem,
  formatDuration,
  formatLongDate,
  formatTime,
} from "@/lib/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/locale-context";

/**
 * Books a plan step as an appointment.
 *
 * It does not invent its own availability rules: the same clinic-hours,
 * clinician-rota and double-booking checks the appointment book uses are
 * applied here, so a step can never be scheduled into a slot the calendar
 * would reject.
 */
export function ScheduleStepDialog({
  step,
  patientName,
  defaultDoctorId,
  onOpenChange,
  onScheduled,
}: {
  step: TreatmentStep | null;
  patientName: string;
  defaultDoctorId: string;
  onOpenChange: (open: boolean) => void;
  onScheduled: (stepId: string, startISO: string, doctorId: string) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [doctorId, setDoctorId] = React.useState(defaultDoctorId);
  const [date, setDate] = React.useState("2026-11-23");
  const [time, setTime] = React.useState("");

  React.useEffect(() => {
    if (!step) return;
    // The plan's own clinician may not provide this particular treatment —
    // fall back to one who does rather than preselecting an invalid option.
    const planDoctor = doctorProfileById(defaultDoctorId);
    const providesIt =
      planDoctor?.status === "active" &&
      planDoctor.serviceIds.includes(step.serviceId);
    const fallback = doctorProfiles.find(
      (d) => d.status === "active" && d.serviceIds.includes(step.serviceId)
    );
    setDoctorId(providesIt ? defaultDoctorId : (fallback?.id ?? ""));
    setDate("2026-11-23");
    setTime("");
  }, [step, defaultDoctorId]);

  const service = step ? serviceById(step.serviceId) : undefined;
  const entry = step ? catalogueById(step.serviceId) : undefined;
  const durationMin = service?.durationMin ?? 30;
  const profile = doctorProfileById(doctorId);

  // Only clinicians who actually provide this treatment.
  const eligible = React.useMemo(
    () =>
      doctorProfiles.filter(
        (d) => !step || d.serviceIds.includes(step.serviceId)
      ),
    [step]
  );

  const slots = React.useMemo(() => {
    if (!step || !date || !doctorId) return [];
    return availableSlots(
      weekAppointments,
      doctorId,
      date,
      durationMin,
      undefined,
      profile?.schedule,
      profile?.name
    );
  }, [step, date, doctorId, durationMin, profile]);

  const start = date && time ? `${date}T${time}:00.000Z` : "";

  const problem = React.useMemo(() => {
    if (!start || !step) return null;
    const candidate = { doctorId, start, durationMin };
    if (profile && profile.status !== "active")
      return `${profile.name} is not taking bookings.`;
    const hours = findHoursProblem(candidate);
    if (hours) return hours.reason;
    const rota = findAvailabilityProblem(
      profile?.schedule,
      profile?.name ?? "This clinician",
      candidate
    );
    if (rota) return rota.reason;
    const clash = findConflict(weekAppointments, candidate);
    if (clash) return clash.reason;
    return null;
  }, [start, step, doctorId, durationMin, profile]);

  if (!step) return null;

  const confirm = () => {
    if (!start || problem) return;
    onScheduled(step.id, start, doctorId);
    toast({
      tone: "success",
      title: `${step.name} booked`,
      detail: `${patientName} · ${formatTime(start)} on ${formatLongDate(date)} with ${profile?.name}. Held in this session only — no backend connected.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={!!step} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={`Schedule — ${step.name}`}
        description={`${patientName} · ${service?.name ?? "Treatment"} · ${formatDuration(durationMin)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={confirm}
              disabled={!start || !!problem}
            >
              <CalendarCheck />
              {t("plans.bookThisSession")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-field border border-line bg-canvas px-3 py-2.5 text-[0.75rem] leading-[1.15rem] text-ink-muted">
            <Info className="mt-px size-3.5 shrink-0 text-forest-500" />
            <span>
              This books a real appointment slot. The clinic&apos;s hours, the
              clinician&apos;s rota and existing bookings are all checked —
              exactly as they are in the appointment book.
              {entry && !entry.active && (
                <span className="mt-1 block font-medium text-status-pending">
                  Note: {entry.name} is withdrawn from the catalogue.
                </span>
              )}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t("appt.form.clinician")}
              hint={
                eligible.length < doctorProfiles.length
                  ? t("plans.providesThis", {
                      eligible: String(eligible.length),
                      total: String(doctorProfiles.length),
                    })
                  : undefined
              }
            >
              <Select
                value={doctorId}
                onValueChange={(v) => {
                  setDoctorId(v);
                  setTime("");
                }}
                ariaLabel={t("appt.form.clinician")}
                options={eligible.map((d) => ({
                  value: d.id,
                  label: d.name,
                  hint:
                    d.status === "active"
                      ? d.specialty
                      : `${d.specialty} · on leave`,
                  disabled: d.status !== "active",
                }))}
              />
            </Field>
            <Field label={t("col.date")} htmlFor="st-date">
              <Input
                id="st-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
              />
            </Field>
            <Field
              label={t("appt.form.startTime")}
              htmlFor="st-time"
              hint={service ? `Runs ${formatDuration(durationMin)}` : undefined}
            >
              <Input
                id="st-time"
                type="time"
                step={900}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </Field>
          </div>

          {problem && (
            <p className="flex items-start gap-2 rounded-field border border-status-pending/30 bg-status-pending-bg/70 px-3 py-2.5 text-small font-medium text-status-pending">
              <AlertTriangle className="mt-px size-4 shrink-0" />
              {problem}
            </p>
          )}

          {start && !problem && (
            <p className="flex items-start gap-2 rounded-field border border-status-completed/25 bg-status-completed-bg/60 px-3 py-2.5 text-small font-medium text-status-completed">
              <CalendarCheck className="mt-px size-4 shrink-0" />
              {formatTime(start)} on {formatLongDate(date)} is free.
            </p>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-label uppercase text-ink-faint">
              <CalendarClock className="size-3.5" />
              Free {formatDuration(durationMin)} slots on{" "}
              {date ? formatLongDate(date) : "that day"}
            </p>
            {slots.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {slots.slice(0, 18).map((s) => {
                  const hhmm = s.slice(11, 16);
                  return (
                    <button
                      key={s}
                      onClick={() => setTime(hhmm)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.75rem] font-medium tabular-nums transition-colors",
                        time === hhmm
                          ? "border-forest-500 bg-forest-50 text-forest-800"
                          : "border-line bg-surface text-ink-soft hover:border-forest-300 hover:text-forest-700"
                      )}
                    >
                      <Clock className="size-3" />
                      {formatTime(s)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-small text-ink-muted">
                No free slot that long for {profile?.name} that day. Try another
                date or clinician.
              </p>
            )}
          </div>

          {service && (
            <p className="border-t border-line pt-3 text-[0.75rem] text-ink-muted">
              This session invoices at{" "}
              <span className="font-semibold tabular-nums text-ink">
                {formatMoney(step.cost)}
              </span>
              {step.cost !== service.price && (
                <>
                  {" "}
                  (catalogue price {formatMoney(service.price)})
                </>
              )}
              .
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
