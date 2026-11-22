/**
 * Clinic settings.
 *
 * A settings page is where fake toggles go to die, so this holds only
 * settings that genuinely change how the application behaves. Each one is
 * read by real code: the opening hours drive booking validation and the
 * schedule grid, the slot length drives the list of free times the booking
 * form offers, the clinic's contact details appear in the messages patients
 * receive.
 *
 * It is a tiny external store rather than React context because the pure
 * scheduling functions in `schedule.ts` read it too, and those are called
 * from outside the component tree. `useSettings()` subscribes the UI.
 */

import { getLocale, LOCALE_META } from "./i18n/locale";

export interface DayHours {
  /** Hour of day, 0–23. */
  open: number;
  close: number;
}

export interface ClinicSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
  /** Keyed by `Date#getUTCDay()`. `null` means closed. */
  hours: Record<number, DayHours | null>;
  /** Granularity of offered appointment start times, in minutes. */
  slotMinutes: number;
}

export const DEFAULT_SETTINGS: ClinicSettings = {
  name: "Luceat Dental",
  phone: "+1 415 555 0100",
  email: "hello@luceatdental.com",
  address: "218 Ridgeway Street, Suite 400, San Francisco, CA 94107",
  hours: {
    0: null, // Sunday
    1: { open: 8, close: 18 },
    2: { open: 8, close: 18 },
    3: { open: 8, close: 18 },
    4: { open: 8, close: 18 },
    5: { open: 8, close: 18 },
    6: { open: 9, close: 14 }, // Saturday
  },
  slotMinutes: 15,
};

/** Weekday names in the active language, Sunday-first. */
export const dayNames = () => {
  const f = new Intl.DateTimeFormat(LOCALE_META[getLocale()].intlTag, {
    timeZone: "UTC",
    weekday: "long",
  });
  // 2024-01-07 was a Sunday, so index 0 is Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    f.format(new Date(Date.UTC(2024, 0, 7 + i)))
  );
};

export const SLOT_OPTIONS = [10, 15, 20, 30, 60];

const clone = (s: ClinicSettings): ClinicSettings => ({
  ...s,
  hours: { ...s.hours },
});

let current: ClinicSettings = clone(DEFAULT_SETTINGS);
const listeners = new Set<() => void>();

export const getSettings = () => current;

/** Stable snapshot for server rendering — the shipped defaults. */
export const getServerSettings = () => DEFAULT_SETTINGS;

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateSettings(patch: Partial<ClinicSettings>) {
  current = { ...current, ...patch, hours: { ...current.hours, ...patch.hours } };
  listeners.forEach((l) => l());
}

export function setDayHours(day: number, hours: DayHours | null) {
  current = { ...current, hours: { ...current.hours, [day]: hours } };
  listeners.forEach((l) => l());
}

export function resetSettings() {
  current = clone(DEFAULT_SETTINGS);
  listeners.forEach((l) => l());
}

/** True while anything differs from the shipped defaults. */
export function settingsEdited() {
  const d = DEFAULT_SETTINGS;
  if (
    current.name !== d.name ||
    current.phone !== d.phone ||
    current.email !== d.email ||
    current.address !== d.address ||
    current.slotMinutes !== d.slotMinutes
  )
    return true;
  return Object.keys(d.hours).some((k) => {
    const day = Number(k);
    const a = current.hours[day];
    const b = d.hours[day];
    if (!a || !b) return a !== b;
    return a.open !== b.open || a.close !== b.close;
  });
}

/* ------------------------------------------------------------- derived */

/** The widest span the clinic is ever open, which the day grid must cover. */
export function gridSpan(settings: ClinicSettings = current) {
  const days = Object.values(settings.hours).filter(
    (h): h is DayHours => !!h
  );
  if (!days.length) return { start: 8 * 60, end: 18 * 60 };
  return {
    start: Math.min(...days.map((h) => h.open)) * 60,
    end: Math.max(...days.map((h) => h.close)) * 60,
  };
}

export const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** "Mon–Fri 08:00–18:00 · Sat 09:00–14:00 · Sun closed" */
export function describeHours(settings: ClinicSettings = current) {
  const parts: string[] = [];
  let runStart: number | null = null;

  const sameAs = (a: number, b: number) => {
    const x = settings.hours[a];
    const y = settings.hours[b];
    if (!x || !y) return x === y;
    return x.open === y.open && x.close === y.close;
  };

  const names = dayNames();
  const label = (day: number) => names[day].slice(0, 3);
  const describe = (day: number) => {
    const h = settings.hours[day];
    return h ? `${formatHour(h.open)}–${formatHour(h.close)}` : "closed";
  };

  // Collapse only *consecutive* days with identical hours, so a midweek
  // closure can never hide inside a "Mon–Fri".
  for (let day = 0; day < 7; day++) {
    if (runStart === null) runStart = day;
    const last = day === 6 || !sameAs(day, day + 1);
    if (last) {
      parts.push(
        runStart === day
          ? `${label(day)} ${describe(day)}`
          : `${label(runStart)}–${label(day)} ${describe(day)}`
      );
      runStart = null;
    }
  }
  return parts.join(" · ");
}
