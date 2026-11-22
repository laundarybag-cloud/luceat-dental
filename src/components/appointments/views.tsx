"use client";

import * as React from "react";
import { CalendarOff, Plus, Moon } from "lucide-react";
import type { Appointment, Doctor } from "@/lib/types";
import {
  clinicHoursFor,
  PX_PER_MIN,
  dayKey,
  formatDayName,
  formatDayNameLong,
  formatDayNumber,
  minutesSinceMidnight,
  monthGrid,
  weekDays,
  weekdayIndex,
} from "@/lib/schedule";
import { DEFAULT_SETTINGS, gridSpan } from "@/lib/settings";
import { useSettings } from "@/components/settings/settings-context";
import { NOW, TODAY } from "@/lib/mock/schedule";
import { doctorProfileById } from "@/lib/mock/doctors";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import {
  AppointmentAgendaChip,
  AppointmentRowChip,
  TimedAppointment,
  assignLanes,
} from "./appointment-chip";
import { useI18n } from "@/components/i18n/locale-context";

/**
 * The grid spans the widest hours the clinic is ever open, read live from
 * settings. It used to be a fixed 08:00–18:00, so widening the hours in
 * Module 14 would have clipped the appointments that fell outside it.
 */
function useGrid() {
  const { hours } = useSettings();
  return React.useMemo(() => {
    const span = gridSpan({ ...DEFAULT_SETTINGS, hours });
    return {
      start: span.start,
      end: span.end,
      height: (span.end - span.start) * PX_PER_MIN,
    };
  }, [hours]);
}

function HourRail() {
  const grid = useGrid();
  // Labels are absolutely positioned on their own hour line and sit just
  // below it, so the first one is never clipped by the top of the grid.
  return (
    <div
      style={{ height: grid.height }}
      className="relative w-14 shrink-0 border-e border-line"
    >
      {Array.from({ length: (grid.end - grid.start) / 60 }, (_, i) => (
        <span
          key={i}
          style={{ top: i * 60 * PX_PER_MIN + 4 }}
          className="absolute end-2 text-[0.6875rem] leading-none tabular-nums text-ink-faint"
        >
          {String(Math.floor(grid.start / 60) + i).padStart(2, "0")}:00
        </span>
      ))}
    </div>
  );
}

function HourLines() {
  const grid = useGrid();
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: (grid.end - grid.start) / 60 + 1 }, (_, i) => (
        <div
          key={i}
          style={{ top: i * 60 * PX_PER_MIN }}
          className="absolute inset-x-0 border-t border-line"
        />
      ))}
      {Array.from({ length: (grid.end - grid.start) / 60 }, (_, i) => (
        <div
          key={`h${i}`}
          style={{ top: (i * 60 + 30) * PX_PER_MIN }}
          className="absolute inset-x-0 border-t border-dashed border-line/60"
        />
      ))}
    </div>
  );
}

function NowLine({ date }: { date: string }) {
  const grid = useGrid();
  if (date !== TODAY) return null;
  const top = (minutesSinceMidnight(NOW) - grid.start) * PX_PER_MIN;
  if (top < 0 || top > grid.height) return null;
  return (
    <div
      style={{ top }}
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      aria-hidden
    >
      <span className="size-1.5 rounded-full bg-status-cancelled" />
      <span className="h-px flex-1 bg-status-cancelled/70" />
    </div>
  );
}

/** Shown where the clinic is shut, instead of an empty grid. */
function ClosedDay({ date }: { date: string }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(135deg,transparent_0_10px,color-mix(in_oklab,var(--color-surface-sunken)_70%,transparent)_10px_20px)] text-center">
      <Moon className="size-4 text-ink-faint" />
      <p className="text-[0.75rem] text-ink-muted">
        {t("appt.closedOn", { day: formatDayNameLong(date) })}
      </p>
    </div>
  );
}

/* ================================================================ Day === */

export function DayView({
  date,
  doctors,
  appointments,
  onSelect,
  onCreateAt,
}: {
  date: string;
  doctors: Doctor[];
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
  onCreateAt: (doctorId: string, start: string) => void;
}) {
  const { t, fmt } = useI18n();
  const grid = useGrid();
  const hours = clinicHoursFor(date);
  const forDay = appointments.filter((a) => dayKey(a.start) === date);

  if (!hours) {
    return (
      <div className="h-80">
        <ClosedDay date={date} />
      </div>
    );
  }

  return (
    <div className="scrollbar-slim overflow-x-auto">
      <div className="min-w-[52rem]">
        {/* Doctor header */}
        <div className="sticky top-0 z-20 flex border-b border-line bg-surface/95 backdrop-blur-sm">
          <div className="w-14 shrink-0 border-e border-line" />
          {doctors.map((d) => {
            const count = forDay.filter((a) => a.doctorId === d.id).length;
            return (
              <div
                key={d.id}
                className="flex min-w-0 flex-1 items-center gap-2 border-e border-line px-3 py-2.5 last:border-e-0"
              >
                <Avatar
                  src={d.avatar}
                  name={d.name}
                  size="sm"
                  status={d.online ? "online" : "offline"}
                />
                <div className="min-w-0">
                  <p className="truncate text-[0.75rem] font-semibold text-ink">
                    {d.name.replace("Dr. ", "Dr ")}
                  </p>
                  <p className="truncate text-[0.6875rem] text-ink-faint">
                    {t("appt.bookedInRoom", {
                      count: fmt.number(count),
                      room: d.room,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="flex">
          <HourRail />
          {doctors.map((d) => {
            const list = forDay.filter((a) => a.doctorId === d.id);
            const lanes = assignLanes(list);
            const profile = doctorProfileById(d.id);
            const offToday =
              profile &&
              (profile.status !== "active" ||
                !profile.schedule[weekdayIndex(date)]);
            return (
              <div
                key={d.id}
                style={{ height: grid.height }}
                className="relative min-w-0 flex-1 border-e border-line last:border-e-0"
              >
                <HourLines />
                <NowLine date={date} />
                {offToday && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center bg-[repeating-linear-gradient(135deg,transparent_0_10px,color-mix(in_oklab,var(--color-surface-sunken)_75%,transparent)_10px_20px)] pt-10">
                    <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.6875rem] font-medium text-ink-muted shadow-card">
                      {profile!.status === "leave"
                        ? "On leave"
                        : profile!.status === "inactive"
                          ? "Inactive"
                          : "Not working today"}
                    </span>
                  </div>
                )}
                {/* Click an empty strip to book that hour. */}
                {Array.from(
                  { length: (grid.end - grid.start) / 30 },
                  (_, i) => {
                    const min = grid.start + i * 30;
                    const open =
                      min >= hours.open * 60 && min < hours.close * 60;
                    if (!open) return null;
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          onCreateAt(
                            d.id,
                            `${date}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(
                              min % 60
                            ).padStart(2, "0")}:00.000Z`
                          )
                        }
                        style={{
                          top: (min - grid.start) * PX_PER_MIN,
                          height: 30 * PX_PER_MIN,
                        }}
                        className="group absolute inset-x-0 transition-colors hover:bg-forest-50/70"
                        aria-label={`Book ${d.name} at ${String(
                          Math.floor(min / 60)
                        ).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`}
                      >
                        <Plus className="mx-auto size-3.5 text-forest-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    );
                  }
                )}
                {list.map((a) => {
                  const l = lanes.get(a.id);
                  return (
                    <TimedAppointment
                      key={a.id}
                      appt={a}
                      gridStartMin={grid.start}
                      onSelect={onSelect}
                      lane={l?.lane}
                      lanes={l?.lanes}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =============================================================== Week === */

export function WeekView({
  date,
  appointments,
  doctorsById,
  onSelect,
  /** A time grid only reads well for one clinician; six overlap into slivers. */
  timeline,
}: {
  date: string;
  appointments: Appointment[];
  doctorsById: Map<string, Doctor>;
  onSelect: (a: Appointment) => void;
  timeline: boolean;
}) {
  const grid = useGrid();
  const days = weekDays(date);

  if (!timeline) {
    return (
      <WeekAgenda
        days={days}
        appointments={appointments}
        doctorsById={doctorsById}
        onSelect={onSelect}
      />
    );
  }

  return (
    <div className="scrollbar-slim overflow-x-auto">
      <div className="min-w-[56rem]">
        <div className="sticky top-0 z-20 flex border-b border-line bg-surface/95 backdrop-blur-sm">
          <div className="w-14 shrink-0 border-e border-line" />
          {days.map((d) => {
            const isToday = d === TODAY;
            const count = appointments.filter(
              (a) => dayKey(a.start) === d
            ).length;
            return (
              <div
                key={d}
                className={cn(
                  "min-w-0 flex-1 border-e border-line px-2 py-2.5 text-center last:border-e-0",
                  isToday && "bg-forest-50/70"
                )}
              >
                <p className="text-label uppercase text-ink-faint">
                  {formatDayName(d)}
                </p>
                <p
                  className={cn(
                    "mx-auto mt-1 flex size-7 items-center justify-center rounded-full text-small font-semibold tabular-nums",
                    isToday ? "bg-forest-800 text-white" : "text-ink"
                  )}
                >
                  {formatDayNumber(d)}
                </p>
                <p className="mt-1 text-[0.6875rem] text-ink-faint">
                  {count ? `${count} appts` : "—"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex">
          <HourRail />
          {days.map((d) => {
            const hours = clinicHoursFor(d);
            const list = appointments.filter((a) => dayKey(a.start) === d);
            const lanes = assignLanes(list);
            return (
              <div
                key={d}
                style={{ height: grid.height }}
                className={cn(
                  "relative min-w-0 flex-1 border-e border-line last:border-e-0",
                  d === TODAY && "bg-forest-50/30"
                )}
              >
                {hours ? (
                  <>
                    <HourLines />
                    <NowLine date={d} />
                    {list.map((a) => {
                      const l = lanes.get(a.id);
                      return (
                        <TimedAppointment
                          key={a.id}
                          appt={a}
                          gridStartMin={grid.start}
                          onSelect={onSelect}
                          lane={l?.lane}
                          lanes={l?.lanes}
                          showDoctor
                          doctorName={doctorsById
                            .get(a.doctorId)
                            ?.name.replace("Dr. ", "Dr ")}
                        />
                      );
                    })}
                  </>
                ) : (
                  <ClosedDay date={d} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Whole-clinic week: a column of chips per day instead of a time grid.
 * Six clinicians' appointments cannot share one time axis legibly, so the
 * week shows what is booked and when, and the day view shows the chairs.
 */
function WeekAgenda({
  days,
  appointments,
  doctorsById,
  onSelect,
}: {
  days: string[];
  appointments: Appointment[];
  doctorsById: Map<string, Doctor>;
  onSelect: (a: Appointment) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="scrollbar-slim overflow-x-auto">
      <div className="grid min-w-[60rem] grid-cols-7">
        {days.map((d) => {
          const list = appointments
            .filter((a) => dayKey(a.start) === d)
            .sort((a, b) => a.start.localeCompare(b.start));
          const closed = !clinicHoursFor(d);
          const isToday = d === TODAY;

          return (
            <div
              key={d}
              className="flex min-h-[32rem] flex-col border-e border-line last:border-e-0"
            >
              <div
                className={cn(
                  "sticky top-0 z-10 border-b border-line bg-surface/95 px-2 py-2.5 text-center backdrop-blur-sm",
                  isToday && "bg-forest-50/80"
                )}
              >
                <p className="text-label uppercase text-ink-faint">
                  {formatDayName(d)}
                </p>
                <p
                  className={cn(
                    "mx-auto mt-1 flex size-7 items-center justify-center rounded-full text-small font-semibold tabular-nums",
                    isToday ? "bg-forest-800 text-white" : "text-ink"
                  )}
                >
                  {formatDayNumber(d)}
                </p>
                <p className="mt-1 text-[0.6875rem] tabular-nums text-ink-faint">
                  {closed ? "Closed" : list.length ? `${list.length} appts` : "Free"}
                </p>
              </div>

              <div
                className={cn(
                  "scrollbar-slim max-h-[30rem] flex-1 space-y-1 overflow-y-auto p-1.5",
                  closed &&
                    "bg-[repeating-linear-gradient(135deg,transparent_0_10px,color-mix(in_oklab,var(--color-surface-sunken)_70%,transparent)_10px_20px)]"
                )}
              >
                {closed ? (
                  <p className="pt-10 text-center text-[0.75rem] text-ink-muted">
                    Closed on {formatDayNameLong(d)}s
                  </p>
                ) : list.length ? (
                  list.map((a) => (
                    <AppointmentAgendaChip
                      key={a.id}
                      appt={a}
                      onSelect={onSelect}
                      doctorName={doctorsById
                        .get(a.doctorId)
                        ?.name.replace("Dr. ", "Dr ")}
                    />
                  ))
                ) : (
                  <p className="pt-10 text-center text-[0.75rem] text-ink-faint">
                    {t("appt.empty.nothingBooked")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================== Month === */

export function MonthView({
  date,
  appointments,
  onSelect,
  onPickDay,
}: {
  date: string;
  appointments: Appointment[];
  onSelect: (a: Appointment) => void;
  onPickDay: (date: string) => void;
}) {
  const cells = monthGrid(date);
  const month = date.slice(0, 7);

  const byDay = React.useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const k = dayKey(a.start);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return map;
  }, [appointments]);

  return (
    <div className="scrollbar-slim overflow-x-auto">
      <div className="min-w-[48rem]">
        <div className="grid grid-cols-7 border-b border-line">
          {weekDays(cells[0]).map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-center text-label uppercase text-ink-faint"
            >
              {formatDayName(d)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d) => {
            const inMonth = d.startsWith(month);
            const list = (byDay.get(d) ?? []).slice(0, 3);
            const total = byDay.get(d)?.length ?? 0;
            const closed = !clinicHoursFor(d);
            const isToday = d === TODAY;

            return (
              <div
                key={d}
                className={cn(
                  "min-h-28 border-b border-e border-line p-1.5 [&:nth-child(7n)]:border-e-0",
                  !inMonth && "bg-canvas/60",
                  closed && inMonth && "bg-surface-sunken/40"
                )}
              >
                <div className="mb-1 flex items-center justify-between px-0.5">
                  <button
                    onClick={() => onPickDay(d)}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-[0.75rem] font-semibold tabular-nums transition-colors",
                      isToday
                        ? "bg-forest-800 text-white"
                        : inMonth
                          ? "text-ink hover:bg-forest-50"
                          : "text-ink-faint hover:bg-forest-50"
                    )}
                  >
                    {formatDayNumber(d)}
                  </button>
                  {total > 0 && (
                    <span className="text-[0.625rem] tabular-nums text-ink-faint">
                      {total}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {list.map((a) => (
                    <AppointmentRowChip
                      key={a.id}
                      appt={a}
                      onSelect={onSelect}
                    />
                  ))}
                  {total > list.length && (
                    <button
                      onClick={() => onPickDay(d)}
                      className="w-full rounded px-2 py-0.5 text-start text-[0.6875rem] font-medium text-forest-600 hover:bg-forest-50"
                    >
                      +{total - list.length} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================== Empty === */

export function NoResults({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();
  return (
    <EmptyState
      illustration={
        <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
          <CalendarOff className="size-5 text-forest-400" />
        </span>
      }
      title={t("appt.empty.title")}
      description={t("appt.empty.body")}
      action={
        <Button variant="secondary" size="sm" onClick={onReset}>
          {t("appt.clearFilters")}
        </Button>
      }
    />
  );
}
