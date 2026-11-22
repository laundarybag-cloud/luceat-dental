"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClock,
  CalendarX2,
  Check,
  Clock,
  FileHeart,
  LogIn,
  Pencil,
  Phone,
  Stethoscope,
  StickyNote,
  User,
} from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";
import { doctorById } from "@/lib/mock/clinic";
import { doctorProfileById } from "@/lib/mock/doctors";
import { serviceById } from "@/lib/mock/schedule";
import {
  availableSlots,
  dayKey,
  endOf,
  formatDuration,
  formatLongDate,
  formatTime,
} from "@/lib/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/overlay";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useAppointments } from "./store";
import { useI18n } from "@/components/i18n/locale-context";

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-600 [&_svg]:size-3.5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-label uppercase text-ink-faint">{label}</p>
        <div className="mt-0.5 text-small text-ink">{children}</div>
      </div>
    </div>
  );
}

/** Which status move makes sense next, given where the appointment is. */
const NEXT_STATUS: Partial<
  Record<
    AppointmentStatus,
    { to: AppointmentStatus; labelKey: MessageKey; icon: React.ReactNode }
  >
> = {
  pending: { to: "confirmed", labelKey: "common.confirm", icon: <Check /> },
  confirmed: {
    to: "checked_in",
    labelKey: "appt.drawer.checkIn",
    icon: <LogIn />,
  },
  checked_in: {
    to: "in_progress",
    labelKey: "appt.drawer.startTreatment",
    icon: <Stethoscope />,
  },
  in_progress: {
    to: "completed",
    labelKey: "appt.drawer.markCompleted",
    icon: <Check />,
  },
};

export function AppointmentDrawer({
  appointment,
  onOpenChange,
  onEdit,
}: {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (a: Appointment) => void;
}) {
  const { t } = useI18n();
  const { appointments, setStatus, reschedule, restore } = useAppointments();
  const toast = useToast();
  const [rescheduling, setRescheduling] = React.useState(false);

  React.useEffect(() => {
    if (!appointment) setRescheduling(false);
  }, [appointment]);

  // Always read the live record so the drawer reflects the latest change.
  const appt = appointment
    ? (appointments.find((a) => a.id === appointment.id) ?? appointment)
    : null;

  const slots = React.useMemo(() => {
    if (!appt || !rescheduling) return [];
    const profile = doctorProfileById(appt.doctorId);
    return availableSlots(
      appointments,
      appt.doctorId,
      dayKey(appt.start),
      appt.durationMin,
      appt.id,
      profile?.schedule,
      profile?.name
    );
  }, [appointments, appt, rescheduling]);

  if (!appt) return null;

  const doctor = doctorById(appt.doctorId);
  const service = appt.serviceId ? serviceById(appt.serviceId) : undefined;
  const next = NEXT_STATUS[appt.status];

  const advance = () => {
    if (!next) return;
    const before = appt;
    const r = setStatus(appt.id, next.to);
    if (!r.ok) {
      toast({ tone: "warning", title: t("appt.drawer.couldNotUpdate"), detail: r.error });
      return;
    }
    toast({
      tone: "success",
      title: `${appt.patient.name} — ${t(next.labelKey).toLowerCase()}`,
      detail: t("appt.drawer.sessionOnly"),
      action: { label: t("common.undo"), onClick: () => restore(before) },
    });
  };

  const cancel = () => {
    const before = appt;
    const r = setStatus(appt.id, "cancelled");
    if (!r.ok) {
      toast({ tone: "warning", title: t("appt.drawer.couldNotCancel"), detail: r.error });
      return;
    }
    toast({
      tone: "info",
      title: t("appt.drawer.cancelled"),
      detail: `${appt.patient.name}'s ${formatTime(appt.start)} slot is free again.`,
      action: { label: t("common.undo"), onClick: () => restore(before) },
    });
    onOpenChange(false);
  };

  const moveTo = (start: string) => {
    const before = appt;
    const r = reschedule(appt.id, start);
    if (!r.ok) {
      toast({ tone: "warning", title: t("appt.drawer.couldNotReschedule"), detail: r.error });
      return;
    }
    setRescheduling(false);
    toast({
      tone: "success",
      title: `Moved to ${formatTime(start)}`,
      detail: t("appt.drawer.sessionOnly"),
      action: { label: t("common.undo"), onClick: () => restore(before) },
    });
  };

  return (
    <Drawer open={!!appointment} onOpenChange={onOpenChange}>
      <DrawerContent
        title={t("appt.drawer.title")}
        description={`${formatLongDate(dayKey(appt.start))}`}
        footer={
          <>
            {next && (
              <Button variant="primary" onClick={advance}>
                {next.icon}
                {t(next.labelKey)}
              </Button>
            )}
            <Button variant="secondary" onClick={() => onEdit(appt)}>
              <Pencil />
              {t("common.edit")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRescheduling((v) => !v)}
              className={cn(rescheduling && "border-forest-300 bg-forest-50")}
            >
              <CalendarClock />
              {t("appt.drawer.reschedule")}
            </Button>
            {appt.status !== "cancelled" && (
              <Button variant="danger" onClick={cancel}>
                <CalendarX2 />
                {t("common.cancel")}
              </Button>
            )}
          </>
        }
      >
        {/* Patient header */}
        <div className="flex items-center gap-3.5 border-b border-line bg-canvas px-5 py-4">
          <Avatar
            src={appt.patient.avatar}
            name={appt.patient.name}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-section text-ink">
              {appt.patient.name}
            </p>
            <p dir="ltr" className="truncate text-start text-small text-ink-muted">
              Age {appt.patient.age} · {appt.patient.phone}
            </p>
            <div className="mt-2">
              <StatusBadge status={appt.status} />
            </div>
          </div>
        </div>

        <div className="divide-y divide-line">
          <Row icon={<Clock />} label={t("appt.drawer.when")}>
            {/* dir="ltr": an Arabic shell must not reverse a time range
                into "08:20 – 08:00" or "min 30". */}
            <span dir="ltr" className="block text-start">
              <span className="tabular-nums">
                {formatTime(appt.start)} – {formatTime(endOf(appt))}
              </span>
              <span className="text-ink-muted">
                {" "}
                · {formatDuration(appt.durationMin)}
              </span>
            </span>
          </Row>

          <Row icon={<Stethoscope />} label={t("appt.form.clinician")}>
            <span className="flex items-center gap-2">
              {doctor && (
                <Avatar src={doctor.avatar} name={doctor.name} size="xs" />
              )}
              {doctor?.name}
              <span className="text-ink-muted">· {doctor?.room}</span>
            </span>
          </Row>

          <Row icon={<FileHeart />} label={t("appt.form.service")}>
            {appt.service}
            {service && (
              <span className="text-ink-muted">
                {" "}
                · {formatMoney(service.price)}
              </span>
            )}
          </Row>

          {appt.notes && (
            <Row icon={<StickyNote />} label={t("appt.form.note")}>
              <p className="leading-5 text-ink-soft">{appt.notes}</p>
            </Row>
          )}

          <Row icon={<Phone />} label={t("appt.drawer.contact")}>
            <a
              dir="ltr"
              href={`tel:${appt.patient.phone.replace(/\s/g, "")}`}
              className="inline-block text-forest-600 hover:text-forest-800"
            >
              {appt.patient.phone}
            </a>
          </Row>

          <Row icon={<User />} label={t("appt.drawer.patientRecord")}>
            <Link
              href="/patients"
              className="text-forest-600 hover:text-forest-800"
            >
              {t("appt.drawer.openChart")}
            </Link>
          </Row>
        </div>

        {rescheduling && (
          <div className="border-t border-line bg-canvas px-5 py-4">
            <p className="text-card text-ink">
              Move to another time on {formatLongDate(dayKey(appt.start))}
            </p>
            <p className="mt-0.5 text-[0.75rem] text-ink-muted">
              Only slots where {doctor?.name}&apos;s chair is free for{" "}
              {formatDuration(appt.durationMin)} are shown.
            </p>
            <Separator className="my-3" />
            {slots.length ? (
              <div className="flex flex-wrap gap-1.5">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => moveTo(s)}
                    className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.75rem] font-medium tabular-nums text-ink-soft transition-colors hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700"
                  >
                    {formatTime(s)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-small text-ink-muted">
                That day is fully booked for this clinician. Edit the
                appointment to pick another date or doctor.
              </p>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
