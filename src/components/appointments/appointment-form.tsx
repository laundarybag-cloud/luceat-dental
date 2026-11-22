"use client";

import * as React from "react";
import { AlertTriangle, CalendarCheck, Clock } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { doctors } from "@/lib/mock/clinic";
import { patients, services, serviceById } from "@/lib/mock/schedule";
import {
  availableSlots,
  dayKey,
  findAvailabilityProblem,
  findConflict,
  findHoursProblem,
  formatDuration,
  formatTime,
} from "@/lib/schedule";
import { doctorProfileById } from "@/lib/mock/doctors";
import { catalogueById } from "@/lib/mock/catalogue";
import { cn, formatMoney } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAppointments, type Draft } from "./store";
import { useI18n, type Translator } from "@/components/i18n/locale-context";

/** Built per render: the hints are translated. */
const doctorOptions = (t: Translator) =>
  doctors.map((d) => ({
    value: d.id,
    label: d.name,
    hint: t("h.specialtyRoom", { specialty: d.specialty, room: d.room }),
  }));

/** Options narrow to what this clinician actually provides. */
/** Needs the translator passed in: it runs outside the component. */
function serviceOptionsFor(doctorId: string, t: Translator) {
  const profile = doctorProfileById(doctorId);
  return services.map((s) => {
    const entry = catalogueById(s.id);
    const offered = !profile || profile.serviceIds.includes(s.id);
    const withdrawn = entry ? !entry.active : false;
    return {
      value: s.id,
      label: s.name,
      hint: withdrawn
        ? t("svc.withdrawn")
        : !offered
          ? `${profile!.name.replace("Dr. ", "Dr ")} does not provide this`
          : `${formatDuration(s.durationMin)} · ${formatMoney(s.price)}`,
      disabled: withdrawn || !offered,
    };
  });
}

const patientOptions = (t: Translator) =>
  patients.map((p) => ({
    value: p.id,
    label: p.name,
    hint: t("h.ageAndPhone", { age: String(p.age), phone: p.phone }),
  }));

export interface FormSeed {
  appointment?: Appointment;
  doctorId?: string;
  start?: string;
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  seed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed: FormSeed;
}) {
  const { t } = useI18n();
  const { appointments, save } = useAppointments();
  const toast = useToast();
  const editing = seed.appointment;

  const [patientId, setPatientId] = React.useState("");
  const [doctorId, setDoctorId] = React.useState("");
  const [serviceId, setServiceId] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  // Reset the form each time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    const a = seed.appointment;
    setPatientId(a?.patient.id ?? "");
    setDoctorId(a?.doctorId ?? seed.doctorId ?? "");
    setServiceId(a?.serviceId ?? "");
    const iso = a?.start ?? seed.start ?? "";
    setDate(iso ? dayKey(iso) : "");
    setTime(iso ? iso.slice(11, 16) : "");
    setNotes(a?.notes ?? "");
    setTouched(false);
  }, [open, seed]);

  const service = serviceById(serviceId);
  const durationMin = service?.durationMin ?? 30;
  const start = date && time ? `${date}T${time}:00.000Z` : "";

  const missing = {
    patientId: !patientId,
    doctorId: !doctorId,
    serviceId: !serviceId,
    date: !date,
    time: !time,
  };
  const hasMissing = Object.values(missing).some(Boolean);

  // Live availability check — the same rules the store enforces on save.
  const availability = React.useMemo(() => {
    if (hasMissing || !start) return null;
    const candidate = { id: editing?.id, doctorId, start, durationMin };
    const hours = findHoursProblem(candidate);
    if (hours) return { ok: false as const, kind: "hours" as const, message: hours.reason };
    const profile = doctorProfileById(doctorId);
    if (profile && profile.status !== "active") {
      return {
        ok: false as const,
        kind: "unavailable" as const,
        message: `${profile.name} is ${profile.status === "leave" ? "on leave" : "inactive"} and is not taking bookings.`,
      };
    }
    const rota = findAvailabilityProblem(
      profile?.schedule,
      profile?.name ?? "This clinician",
      candidate
    );
    if (rota) return { ok: false as const, kind: "unavailable" as const, message: rota.reason };
    const clash = findConflict(appointments, candidate);
    if (clash)
      return { ok: false as const, kind: "clash" as const, message: clash.reason };
    return { ok: true as const, kind: "free" as const, message: t("hint.chairFree") };
  }, [appointments, doctorId, durationMin, editing?.id, hasMissing, start, t]);

  // Suggestions when the chosen time will not work.
  const suggestions = React.useMemo(() => {
    if (!doctorId || !date || !service || availability?.ok !== false) return [];
    const profile = doctorProfileById(doctorId);
    return availableSlots(
      appointments,
      doctorId,
      date,
      durationMin,
      editing?.id,
      profile?.schedule,
      profile?.name
    ).slice(0, 6);
  }, [
    appointments,
    availability?.ok,
    date,
    doctorId,
    durationMin,
    editing?.id,
    service,
  ]);

  const submit = () => {
    setTouched(true);
    if (hasMissing) return;

    const draft: Draft = {
      id: editing?.id,
      patientId,
      doctorId,
      serviceId,
      start,
      durationMin,
      notes: notes.trim() || undefined,
      status: editing?.status ?? "pending",
    };

    const result = save(draft);
    if (!result.ok) {
      toast({
        tone: "warning",
        title: t("appt.form.slotTaken"),
        detail: result.error,
      });
      return;
    }

    toast({
      tone: "success",
      title: editing ? "Appointment updated" : "Appointment booked",
      detail: `${result.appointment.patient.name} · ${formatTime(
        result.appointment.start
      )} with ${doctors.find((d) => d.id === doctorId)?.name}. Saved in this session only — no backend connected.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={editing ? "Edit appointment" : "New appointment"}
        description={
          editing
            ? t("hint.changesChecked")
            : t("hint.pickAndCheck")
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={availability?.ok === false}
            >
              <CalendarCheck />
              {editing ? "Save changes" : "Book appointment"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("appt.form.patient")}
            required
            className="sm:col-span-2"
            error={touched && missing.patientId ? t("v.choosePatient") : undefined}
          >
            <Select
              value={patientId}
              onValueChange={setPatientId}
              options={patientOptions(t)}
              placeholder={t("appt.form.patientPlaceholder")}
              invalid={touched && missing.patientId}
              ariaLabel="Patient"
            />
          </Field>

          <Field
            label={t("appt.form.clinician")}
            required
            error={touched && missing.doctorId ? t("v.chooseClinician") : undefined}
          >
            <Select
              value={doctorId}
              onValueChange={setDoctorId}
              options={doctorOptions(t)}
              placeholder={t("appt.form.clinicianPlaceholder")}
              invalid={touched && missing.doctorId}
              ariaLabel="Clinician"
            />
          </Field>

          <Field
            label={t("appt.form.service")}
            required
            hint={
              service
                ? `${formatDuration(service.durationMin)} · ${formatMoney(service.price)}`
                : t("hint.durationFollows")
            }
            error={touched && missing.serviceId ? t("v.chooseService") : undefined}
          >
            <Select
              value={serviceId}
              onValueChange={setServiceId}
              options={serviceOptionsFor(doctorId, t)}
              placeholder={t("appt.form.servicePlaceholder")}
              invalid={touched && missing.serviceId}
              ariaLabel="Service"
            />
          </Field>

          <Field
            label={t("appt.form.date")}
            required
            htmlFor="appt-date"
            error={touched && missing.date ? t("v.pickDate") : undefined}
          >
            <Input
              id="appt-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              invalid={touched && missing.date}
            />
          </Field>

          <Field
            label={t("appt.form.startTime")}
            required
            htmlFor="appt-time"
            hint={service ? `Ends after ${formatDuration(durationMin)}` : undefined}
            error={touched && missing.time ? t("v.pickStartTime") : undefined}
          >
            <Input
              id="appt-time"
              type="time"
              step={900}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              invalid={touched && missing.time}
            />
          </Field>

          {availability ? (
            <div
              className={cn(
                "sm:col-span-2 rounded-field border px-3 py-2.5 text-small",
                availability.ok
                  ? "border-status-completed/25 bg-status-completed-bg/60 text-status-completed"
                  : "border-status-pending/30 bg-status-pending-bg/70 text-status-pending"
              )}
            >
              <p className="flex items-start gap-2 font-medium">
                {availability.ok ? (
                  <CalendarCheck className="mt-px size-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-px size-4 shrink-0" />
                )}
                {availability.message}
              </p>

              {availability.ok === false &&
                availability.kind === "clash" &&
                suggestions.length === 0 && (
                <p className="mt-2 text-[0.75rem] leading-[1.15rem] text-ink-muted">
                  There is no {formatDuration(durationMin)} gap left in that
                  clinician&apos;s day. Try another date, a shorter service, or
                  a different clinician.
                </p>
                )}

              {suggestions.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[0.75rem] text-ink-muted">
                    Next free starts that day:
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setTime(s.slice(11, 16))}
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[0.75rem] font-medium tabular-nums text-ink-soft transition-colors hover:border-forest-300 hover:text-forest-700"
                      >
                        <Clock className="size-3" />
                        {formatTime(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <Field
            label={t("appt.form.note")}
            className="sm:col-span-2"
            hint={t("appt.form.noteHint")}
          >
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("appt.form.notePlaceholder")}
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
