"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Building2,
  CalendarClock,
  CalendarDays,
  Globe,
  Mail,
  Pencil,
  Phone,
  Star,
  Clock,
  BadgeCheck,
  Info,
} from "lucide-react";
import type { Appointment } from "@/lib/types";
import {
  dayNames,
  dayShort,
  DOCTOR_STATUS_META,
  formatMinutes,
  summariseSchedule,
  weeklyHours,
  type DoctorProfile,
} from "@/lib/mock/doctors";
import { serviceById } from "@/lib/mock/schedule";
import { endOf, formatTime } from "@/lib/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import {
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { Panel } from "@/components/patients/profile-tabs";
import { fmtDate } from "@/components/patients/patients-register";
import { DoctorFormDialog } from "./doctor-form";
import { useI18n } from "@/components/i18n/locale-context";
import { pickText } from "@/lib/mock/localize";
import { DOCTOR_TITLE_AR, BRANCH_AR, LANGUAGE_AR } from "@/lib/mock/content-ar";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-[0.75rem] text-ink-muted">{label}</p>
      <p data-metric className="mt-0.5 text-title text-ink">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[0.75rem] text-ink-faint">{hint}</p>}
    </div>
  );
}

export function DoctorProfileView({
  doctor,
  appointments,
}: {
  doctor: DoctorProfile;
  appointments: Appointment[];
}) {
  const { t, fmt } = useI18n();
  const [editOpen, setEditOpen] = React.useState(false);
  const meta = DOCTOR_STATUS_META[doctor.status];

  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter(
    (a) => a.status === "cancelled" || a.status === "no_show"
  ).length;
  const upcoming = appointments
    .filter((a) => a.start > "2026-11-20T10:20" && a.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));
  const hours = weeklyHours(doctor.schedule);
  const assigned = doctor.serviceIds
    .map((id) => serviceById(id))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/doctors">
          <ArrowLeft className="rtl:rotate-180" />
          {t("doctors.all")}
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-[linear-gradient(104deg,var(--color-surface)_0%,var(--color-canvas)_60%,var(--color-forest-50)_100%)] p-5 md:flex-row md:items-center">
          <Avatar
            src={doctor.avatar}
            name={doctor.name}
            size="xl"
            className="shrink-0"
            status={doctor.status === "active" && doctor.online ? "online" : undefined}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title text-ink">{doctor.name}</h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                  meta.chip
                )}
              >
                {t(meta.labelKey)}
              </span>
            </div>
            <p className="mt-0.5 text-small text-forest-600">{pickText(doctor.title, DOCTOR_TITLE_AR)}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-ink-muted">
              <span className="tabular-nums">{doctor.ref}</span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Building2 className="size-3" />
                {pickText(doctor.branch, BRANCH_AR)}
              </span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Star className="size-3 fill-gold-300 text-gold-300" />
                {doctor.rating} rating
              </span>
              <span aria-hidden>·</span>
              <span>Joined {fmtDate(doctor.joined)}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="primary" size="md" onClick={() => setEditOpen(true)}>
              <Pencil />
              {t("common.edit")}
            </Button>
            <Button variant="secondary" size="icon" aria-label={t("doctors.call")} asChild>
              <a href={`tel:${doctor.phone.replace(/\s/g, "")}`}>
                <Phone />
              </a>
            </Button>
            <Button variant="secondary" size="icon" aria-label={t("patients.email")} asChild>
              <a href={`mailto:${doctor.email}`}>
                <Mail />
              </a>
            </Button>
          </div>
        </div>

        {doctor.status !== "active" && doctor.statusNote && (
          <p className="flex items-start gap-2 border-t border-line bg-status-pending-bg/50 px-5 py-3 text-small text-status-pending">
            <Info className="mt-px size-4 shrink-0" />
            {doctor.statusNote}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t("doctors.apptsThisWeek")}
          value={String(appointments.length)}
          hint={t("h.completedLost", {
              completed: fmt.number(completed),
              cancelled: fmt.number(cancelled),
            })}
        />
        <Stat
          label={t("doctors.chairUtilisation")}
          value={`${doctor.utilisation}%`}
          hint={t("doctors.rolling30")}
        />
        <Stat
          label={t("doctors.scheduledHours")}
          value={`${hours.toFixed(1)} h`}
          hint={t("doctors.perWeekExclBreaks")}
        />
        <Stat
          label={t("doctors.completed30")}
          value={String(doctor.completed)}
          hint={t("h.averageRating", {
              rating: fmt.decimal(doctor.rating, 1),
            })}
        />
      </div>

      <Tabs defaultValue="overview">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="overview">{t("patients.tab.overview")}</TabsTrigger>
            <TabsTrigger value="schedule">{t("doctors.workingSchedule")}</TabsTrigger>
            <TabsTrigger value="services">{t("doctors.services")}</TabsTrigger>
            <TabsTrigger value="appointments">{t("patients.tab.appointments")}</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4">
          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title={t("doctors.personalDetails")}>
                <dl className="divide-y divide-line text-small">
                  {[
                    ["Staff ID", doctor.ref],
                    [t("doctorForm.jobTitle"), doctor.title],
                    [t("doctorForm.branch"), doctor.branch],
                    ["Operatory", doctor.room],
                    ["Joined", fmtDate(doctor.joined)],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-start justify-between gap-4 py-1.5"
                    >
                      <dt className="shrink-0 text-[0.75rem] text-ink-muted">
                        {k}
                      </dt>
                      <dd className="text-end text-ink">{v}</dd>
                    </div>
                  ))}
                  <div className="flex items-start justify-between gap-4 py-1.5">
                    <dt className="shrink-0 text-[0.75rem] text-ink-muted">
                      {t("patients.email")}
                    </dt>
                    <dd className="break-all text-end text-ink">
                      {doctor.email}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-1.5">
                    <dt className="shrink-0 text-[0.75rem] text-ink-muted">
                      {t("patients.phone")}
                    </dt>
                    <dd dir="ltr" className="text-end tabular-nums text-ink">
                      {doctor.phone}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-1.5">
                    <dt className="shrink-0 text-[0.75rem] text-ink-muted">
                      {t("doctors.languages")}
                    </dt>
                    <dd className="text-end text-ink">
                      {doctor.languages
                        .map((l) => pickText(l, LANGUAGE_AR))
                        .join("، ")}
                    </dd>
                  </div>
                </dl>
              </Panel>

              <div className="space-y-4 lg:col-span-2">
                <Panel title={t("doctors.professionalProfile")}>
                  <p className="text-small leading-5 text-ink-soft">
                    {doctor.bio}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[0.75rem] text-ink-muted">
                    <BadgeCheck className="size-3.5 text-forest-500" />
                    Registration {doctor.registration}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {doctor.specialties.map((s) => (
                      <Badge key={s} tone="brand">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Panel>

                <Panel title={t("doctors.qualifications")}>
                  <ul className="space-y-3">
                    {doctor.qualifications.map((q) => (
                      <li key={q.award} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-gold-100 text-gold-600">
                          <Award className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-small font-medium text-ink">
                            {q.award}
                          </p>
                          <p className="text-[0.75rem] text-ink-muted">
                            {q.institution} · {q.year}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>
            </div>
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule">
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title={t("doctors.weeklyRota")} className="lg:col-span-2">
                <ul className="divide-y divide-line">
                  {DAY_ORDER.map((d) => {
                    const day = doctor.schedule[d];
                    return (
                      <li
                        key={d}
                        className="flex items-center gap-3 py-2.5 text-small"
                      >
                        <span className="w-24 shrink-0 font-medium text-ink">
                          {dayNames()[d]}
                        </span>
                        {day ? (
                          <>
                            <span className="tabular-nums text-ink">
                              {formatMinutes(day.start)} – {formatMinutes(day.end)}
                            </span>
                            {day.breakStart != null && day.breakEnd != null && (
                              <span className="text-[0.75rem] tabular-nums text-ink-muted">
                                break {formatMinutes(day.breakStart)}–
                                {formatMinutes(day.breakEnd)}
                              </span>
                            )}
                            <span className="ms-auto text-[0.75rem] tabular-nums text-ink-faint">
                              {(
                                (day.end -
                                  day.start -
                                  (day.breakEnd != null && day.breakStart != null
                                    ? day.breakEnd - day.breakStart
                                    : 0)) /
                                60
                              ).toFixed(1)}{" "}
                              h
                            </span>
                          </>
                        ) : (
                          <span className="text-ink-faint">{t("doctors.notWorking")}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-[0.75rem] text-ink-faint">
                  <Info className="mt-px size-3.5 shrink-0" />
                  The appointment book enforces this rota: bookings outside
                  these hours, on a non-working day or during a break are
                  rejected.
                </p>
              </Panel>

              <div className="space-y-4">
                <Panel title={t("doctors.atAGlance")}>
                  <p className="text-[0.75rem] text-ink-muted">{t("doctors.summary")}</p>
                  <p className="mt-0.5 text-small text-ink">
                    {summariseSchedule(doctor.schedule)}
                  </p>
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between text-small">
                      <span className="flex items-center gap-2 text-ink-muted">
                        <Clock className="size-3.5" />
                        {t("doctors.hoursPerWeek")}
                      </span>
                      <span className="font-semibold tabular-nums text-ink">
                        {hours.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-small">
                      <span className="flex items-center gap-2 text-ink-muted">
                        <CalendarDays className="size-3.5" />
                        {t("doctors.workingDays")}
                      </span>
                      <span className="font-semibold tabular-nums text-ink">
                        {DAY_ORDER.filter((d) => doctor.schedule[d]).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-small">
                      <span className="flex items-center gap-2 text-ink-muted">
                        <CalendarClock className="size-3.5" />
                        {t("doctors.defaultSlot")}
                      </span>
                      <span className="font-semibold tabular-nums text-ink">
                        {doctor.slotMinutes} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-small">
                      <span className="flex items-center gap-2 text-ink-muted">
                        <Globe className="size-3.5" />
                        {t("doctors.languages")}
                      </span>
                      <span className="text-ink">
                        {doctor.languages.length}
                      </span>
                    </div>
                  </div>
                </Panel>

                <Panel title={t("doctors.utilisation")}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.75rem] text-ink-muted">
                      {t("doctors.rolling30")}
                    </span>
                    <span
                      data-metric
                      className="text-title text-ink"
                    >
                      {doctor.utilisation}%
                    </span>
                  </div>
                  <Progress value={doctor.utilisation} className="mt-2" />
                </Panel>
              </div>
            </div>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services">
            <Panel
              title={`Assigned services (${assigned.length})`}
              action={
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil />
                  {t("doctors.editAssignments")}
                </Button>
              }
            >
              <ul className="divide-y divide-line">
                {assigned.map((s) =>
                  s ? (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 py-2.5 text-small"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ink">{s.name}</span>
                        <span className="block text-[0.75rem] text-ink-muted">
                          {s.category}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-muted">
                        {s.durationMin} min
                      </span>
                      <span className="w-20 shrink-0 text-end font-semibold tabular-nums text-ink">
                        {formatMoney(s.price)}
                      </span>
                    </li>
                  ) : null
                )}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-[0.75rem] text-ink-faint">
                Only these services can be booked with {doctor.name.split(" ")[1]}
                . The appointment form offers the rest to other clinicians.
              </p>
            </Panel>
          </TabsContent>

          {/* Appointments */}
          <TabsContent value="appointments">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title={`Upcoming (${upcoming.length})`}>
                {upcoming.length ? (
                  <ul className="divide-y divide-line">
                    {upcoming.slice(0, 8).map((a) => (
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
                          <p className="truncate text-small text-ink">
                            {a.patient.name}
                          </p>
                          <p className="truncate text-[0.75rem] text-ink-muted">
                            {a.service}
                          </p>
                        </div>
                        <StatusBadge status={a.status} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-small text-ink-faint">
                    {doctor.status === "active"
                      ? t("empty.nothingRestOfWeek")
                      : `${doctor.name} is not taking bookings.`}
                  </p>
                )}
              </Panel>

              <Panel title={t("doctors.thisWeekByDay")}>
                <ul className="space-y-2">
                  {DAY_ORDER.map((d) => {
                    const dayAppts = appointments.filter(
                      (a) => new Date(a.start).getUTCDay() === d
                    );
                    const max = Math.max(
                      1,
                      ...DAY_ORDER.map(
                        (x) =>
                          appointments.filter(
                            (a) => new Date(a.start).getUTCDay() === x
                          ).length
                      )
                    );
                    return (
                      <li key={d} className="flex items-center gap-3">
                        <span className="w-10 shrink-0 text-[0.75rem] text-ink-muted">
                          {dayShort()[d]}
                        </span>
                        <Progress
                          value={(dayAppts.length / max) * 100}
                          tone={dayAppts.length ? "brand" : "muted"}
                          className="flex-1"
                        />
                        <span className="w-6 shrink-0 text-end text-[0.75rem] tabular-nums text-ink-soft">
                          {dayAppts.length}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <DoctorFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        doctor={doctor}
      />
    </div>
  );
}
