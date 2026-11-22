/**
 * Scheduling domain logic.
 *
 * Pure functions, no React, no data source — so the slot and conflict rules
 * can move to the server unchanged when the API arrives. Everything works in
 * UTC: the clinic has one timezone, and fixing it keeps server and client
 * rendering byte-identical.
 */
import { getSettings } from "./settings";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { getLocale, LOCALE_META } from "./i18n/locale";

/**
 * Opening hours and slot granularity now live in clinic settings, so Module
 * 14 can change them and booking validation, the free-slot list and the
 * schedule grid all follow. These read the live store on every call rather
 * than capturing it once at import.
 */
export const clinicHoursFor = (date: string) =>
  getSettings().hours[weekdayIndex(date)] ?? null;

export const slotMinutes = () => getSettings().slotMinutes;
/** Pixels per minute in the day/week grids. */
export const PX_PER_MIN = 1.5;

/** Statuses that still occupy a chair — a cancelled slot is free again. */
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
];

export const isBlocking = (a: Appointment) =>
  BLOCKING_STATUSES.includes(a.status);

/* ------------------------------------------------------------ date utils */

export const dayKey = (iso: string) => iso.slice(0, 10);

export const startOfWeek = (isoDate: string) => {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  // Week starts Monday.
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
};

export const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const addMonths = (isoDate: string, months: number) => {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  const target = d.getUTCMonth() + months;
  d.setUTCDate(1);
  d.setUTCMonth(target);
  return d.toISOString().slice(0, 10);
};

export const weekDays = (isoDate: string) =>
  Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(isoDate), i));

/** Six-row month grid, Monday-first, including leading/trailing days. */
export const monthGrid = (isoDate: string) => {
  const first = `${isoDate.slice(0, 7)}-01`;
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

export const weekdayIndex = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();

export const minutesSinceMidnight = (iso: string) => {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

export const atMinutes = (isoDate: string, minutes: number) => {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCMinutes(minutes);
  return d.toISOString();
};

export const endOf = (a: Appointment) =>
  new Date(new Date(a.start).getTime() + a.durationMin * 60_000).toISOString();

/* ------------------------------------------------------------ formatting */

/**
 * These labels are read by staff, so they follow the active language. The
 * formatter is built per call rather than cached at module load, because the
 * locale can change while the page is open.
 */
const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE_META[getLocale()].intlTag, {
    timeZone: "UTC",
    ...opts,
  });

const timeFmt = () => fmt({ hour: "2-digit", minute: "2-digit" });
const dayNameFmt = () => fmt({ weekday: "short" });
const dayNameLongFmt = () => fmt({ weekday: "long" });
const dayNumFmt = () => fmt({ day: "numeric" });
const longDateFmt = () =>
  fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const monthYearFmt = () => fmt({ month: "long", year: "numeric" });
const rangeFmt = () => fmt({ day: "numeric", month: "short" });

export const formatTime = (iso: string) => timeFmt().format(new Date(iso));
export const formatDayName = (isoDate: string) =>
  dayNameFmt().format(new Date(`${isoDate}T00:00:00.000Z`));
export const formatDayNameLong = (isoDate: string) =>
  dayNameLongFmt().format(new Date(`${isoDate}T00:00:00.000Z`));
export const formatDayNumber = (isoDate: string) =>
  dayNumFmt().format(new Date(`${isoDate}T00:00:00.000Z`));
export const formatLongDate = (isoDate: string) =>
  longDateFmt().format(new Date(`${isoDate}T00:00:00.000Z`));
export const formatMonthYear = (isoDate: string) =>
  monthYearFmt().format(new Date(`${isoDate}T00:00:00.000Z`));
export const formatWeekRange = (isoDate: string) => {
  const days = weekDays(isoDate);
  return `${rangeFmt().format(new Date(`${days[0]}T00:00:00.000Z`))} – ${rangeFmt().format(
    new Date(`${days[6]}T00:00:00.000Z`)
  )}`;
};
export const formatDuration = (min: number) =>
  min >= 60
    ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`
    : `${min} min`;

/* ------------------------------------------------------- conflict rules */

export interface Conflict {
  with: Appointment;
  reason: string;
}

const overlaps = (
  startA: number,
  endA: number,
  startB: number,
  endB: number
) => startA < endB && startB < endA;

/**
 * The single source of truth for double-booking. A chair is taken if any
 * blocking appointment for the same doctor overlaps the proposed window.
 */
export function findConflict(
  appointments: Appointment[],
  candidate: { id?: string; doctorId: string; start: string; durationMin: number }
): Conflict | null {
  const s = new Date(candidate.start).getTime();
  const e = s + candidate.durationMin * 60_000;

  for (const a of appointments) {
    if (a.id === candidate.id) continue;
    if (a.doctorId !== candidate.doctorId) continue;
    if (!isBlocking(a)) continue;
    const as = new Date(a.start).getTime();
    const ae = as + a.durationMin * 60_000;
    if (overlaps(s, e, as, ae)) {
      return {
        with: a,
        reason: `${a.patient.name} is already booked ${formatTime(
          a.start
        )}–${formatTime(endOf(a))}`,
      };
    }
  }
  return null;
}

export interface HoursProblem {
  reason: string;
}

/** Validates the window against clinic opening hours. */
export function findHoursProblem(candidate: {
  start: string;
  durationMin: number;
}): HoursProblem | null {
  const date = dayKey(candidate.start);
  const hours = clinicHoursFor(date);
  if (!hours) {
    return { reason: `The clinic is closed on ${formatDayName(date)}s.` };
  }
  const startMin = minutesSinceMidnight(candidate.start);
  const endMin = startMin + candidate.durationMin;
  if (startMin < hours.open * 60) {
    return {
      reason: `The clinic opens at ${String(hours.open).padStart(2, "0")}:00 that day.`,
    };
  }
  if (endMin > hours.close * 60) {
    return {
      reason: `That would run past closing at ${String(hours.close).padStart(2, "0")}:00.`,
    };
  }
  return null;
}

/* ------------------------------------------------- clinician availability */

export interface WorkingDay {
  start: number;
  end: number;
  breakStart?: number;
  breakEnd?: number;
}
export type WorkingWeek = Record<number, WorkingDay | null>;

/**
 * Validates the window against the clinician's own rota — their working days,
 * their hours and their lunch break — on top of the clinic's opening hours.
 */
export function findAvailabilityProblem(
  week: WorkingWeek | undefined,
  doctorName: string,
  candidate: { start: string; durationMin: number }
): { reason: string } | null {
  if (!week) return null;
  const date = dayKey(candidate.start);
  const day = week[weekdayIndex(date)];
  if (!day) {
    // Long form: "Wed" + "s" reads as "Weds".
    return { reason: `${doctorName} does not work ${formatDayNameLong(date)}s.` };
  }
  const startMin = minutesSinceMidnight(candidate.start);
  const endMin = startMin + candidate.durationMin;
  const hhmm = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  if (startMin < day.start || endMin > day.end) {
    return {
      reason: `${doctorName} works ${hhmm(day.start)}–${hhmm(day.end)} that day.`,
    };
  }
  if (
    day.breakStart != null &&
    day.breakEnd != null &&
    startMin < day.breakEnd &&
    day.breakStart < endMin
  ) {
    return {
      reason: `That runs into ${doctorName}'s break (${hhmm(day.breakStart)}–${hhmm(day.breakEnd)}).`,
    };
  }
  return null;
}

/**
 * Free start times for a doctor on a date, at the configured granularity.
 * Respects the clinic's hours, the clinician's rota and existing bookings.
 */
export function availableSlots(
  appointments: Appointment[],
  doctorId: string,
  date: string,
  durationMin: number,
  ignoreId?: string,
  week?: WorkingWeek,
  doctorName = "This clinician"
): string[] {
  const hours = clinicHoursFor(date);
  if (!hours) return [];

  const slots: string[] = [];
  for (
    let m = hours.open * 60;
    m + durationMin <= hours.close * 60;
    m += slotMinutes()
  ) {
    const start = atMinutes(date, m);
    if (findAvailabilityProblem(week, doctorName, { start, durationMin })) continue;
    if (!findConflict(appointments, { id: ignoreId, doctorId, start, durationMin })) {
      slots.push(start);
    }
  }
  return slots;
}
