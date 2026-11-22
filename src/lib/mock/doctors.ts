/**
 * Clinician profiles.
 *
 * This is the source of truth for who works when. The appointment fixture is
 * generated from these schedules and the booking form validates against them,
 * so a doctor's working days are real constraints rather than decoration.
 */
import type { Doctor } from "@/lib/types";
import { doctors as baseDoctors } from "./clinic";
import { getLocale, LOCALE_META } from "../i18n/locale";
import type { MessageKey } from "../i18n";

export interface DaySchedule {
  /** Minutes from midnight, UTC (the clinic runs in one timezone). */
  start: number;
  end: number;
  /** Lunch or admin block, closed for booking. */
  breakStart?: number;
  breakEnd?: number;
}

/** Keyed by JS day index: 0 Sunday … 6 Saturday. null means not working. */
export type WeekSchedule = Record<number, DaySchedule | null>;

export type DoctorStatus = "active" | "leave" | "inactive";

export interface DoctorProfile extends Doctor {
  ref: string;
  email: string;
  phone: string;
  title: string;
  branch: string;
  joined: string;
  status: DoctorStatus;
  statusNote?: string;
  bio: string;
  languages: string[];
  registration: string;
  qualifications: { award: string; institution: string; year: string }[];
  specialties: string[];
  /** Default appointment length this clinician books in, minutes. */
  slotMinutes: number;
  serviceIds: string[];
  schedule: WeekSchedule;
}

const h = (hour: number, minute = 0) => hour * 60 + minute;

/** Mon–Fri with the same hours, plus optional Saturday. */
const weekdays = (
  start: number,
  end: number,
  opts: {
    off?: number[];
    breakStart?: number;
    breakEnd?: number;
    saturday?: [number, number];
  } = {}
): WeekSchedule => {
  const day = {
    start,
    end,
    breakStart: opts.breakStart,
    breakEnd: opts.breakEnd,
  };
  const week: WeekSchedule = { 0: null, 1: day, 2: day, 3: day, 4: day, 5: day, 6: null };
  for (const d of opts.off ?? []) week[d] = null;
  if (opts.saturday) {
    week[6] = { start: opts.saturday[0], end: opts.saturday[1] };
  }
  return week;
};

const BIOS: Record<string, string> = {
  d1: "Prosthodontist with a focus on full-mouth rehabilitation and ceramic restorations. Leads the clinic's digital workflow for crowns and veneers.",
  d2: "Oral surgeon specialising in implantology and third-molar surgery, with a particular interest in sedation for anxious patients.",
  d3: "Orthodontist working primarily with clear aligners and early interceptive treatment for children and teenagers.",
  d4: "Endodontist handling complex root canal retreatment and microscope-assisted procedures referred from across the city.",
  d5: "Paediatric dentist. Runs the clinic's school outreach programme and its behaviour-management training for new staff.",
  d6: "Periodontist leading the clinic's gum health programme, from non-surgical therapy to soft-tissue grafting.",
};

const PROFILE_DATA: Record<
  string,
  {
    title: string;
    email: string;
    phone: string;
    branch: string;
    joined: string;
    status: DoctorStatus;
    statusNote?: string;
    languages: string[];
    registration: string;
    qualifications: { award: string; institution: string; year: string }[];
    specialties: string[];
    slotMinutes: number;
    serviceIds: string[];
    schedule: WeekSchedule;
  }
> = {
  d1: {
    title: "Lead Prosthodontist",
    email: "amelia.hart@luceatdental.com",
    phone: "+1 415 555 0121",
    branch: "Harbour Street",
    joined: "2019-03-04",
    status: "active",
    languages: ["English", "French"],
    registration: "GDC 184 220",
    qualifications: [
      { award: "DDS, Doctor of Dental Surgery", institution: "University of California, San Francisco", year: "2012" },
      { award: "MSc Prosthodontics", institution: "King's College London", year: "2016" },
    ],
    specialties: ["Prosthodontics", "Cosmetic dentistry", "Digital workflows"],
    slotMinutes: 45,
    serviceIds: ["sv1", "sv2", "sv3", "sv5", "sv10"],
    schedule: weekdays(h(8), h(18), { breakStart: h(13), breakEnd: h(13, 45) }),
  },
  d2: {
    title: "Consultant Oral Surgeon",
    email: "omar.khalid@luceatdental.com",
    phone: "+1 415 555 0132",
    branch: "Harbour Street",
    joined: "2017-09-18",
    status: "active",
    languages: ["English", "Arabic", "French"],
    registration: "GDC 170 884",
    qualifications: [
      { award: "BDS, Bachelor of Dental Surgery", institution: "Cairo University", year: "2008" },
      { award: "MFDS RCS", institution: "Royal College of Surgeons of England", year: "2013" },
      { award: "Diploma in Implant Dentistry", institution: "ITI", year: "2018" },
    ],
    specialties: ["Oral surgery", "Implantology", "Conscious sedation"],
    slotMinutes: 60,
    serviceIds: ["sv4", "sv6", "sv10"],
    schedule: weekdays(h(8), h(17), { off: [3], saturday: [h(9), h(14)] }),
  },
  d3: {
    title: "Orthodontist",
    email: "lena.moreau@luceatdental.com",
    phone: "+1 415 555 0144",
    branch: "Lindendal Clinic",
    joined: "2021-01-11",
    status: "active",
    languages: ["English", "German"],
    registration: "GDC 206 471",
    qualifications: [
      { award: "DMD", institution: "University of Zürich", year: "2014" },
      { award: "MSc Orthodontics", institution: "University of Bern", year: "2019" },
    ],
    specialties: ["Orthodontics", "Clear aligners", "Interceptive treatment"],
    slotMinutes: 30,
    serviceIds: ["sv1", "sv7", "sv10"],
    schedule: weekdays(h(9), h(18), { breakStart: h(12, 30), breakEnd: h(13, 15) }),
  },
  d4: {
    title: "Endodontist",
    email: "samuel.reed@luceatdental.com",
    phone: "+1 415 555 0156",
    branch: "Harbour Street",
    joined: "2020-06-22",
    status: "leave",
    statusNote: "On parental leave until 12 January 2027. Bookings paused.",
    languages: ["English"],
    registration: "GDC 198 302",
    qualifications: [
      { award: "DDS", institution: "University of Michigan", year: "2011" },
      { award: "Certificate in Endodontics", institution: "University of Pennsylvania", year: "2015" },
    ],
    specialties: ["Endodontics", "Microscope dentistry", "Retreatment"],
    slotMinutes: 90,
    serviceIds: ["sv3", "sv4", "sv10"],
    schedule: weekdays(h(8), h(16), { off: [5] }),
  },
  d5: {
    title: "Paediatric Dentist",
    email: "yasmin.haddad@luceatdental.com",
    phone: "+1 415 555 0168",
    branch: "Lindendal Clinic",
    joined: "2022-04-05",
    status: "active",
    languages: ["English", "Arabic"],
    registration: "GDC 221 905",
    qualifications: [
      { award: "BDS", institution: "University of Jordan", year: "2013" },
      { award: "MSc Paediatric Dentistry", institution: "University of Leeds", year: "2018" },
    ],
    specialties: ["Paediatric dentistry", "Preventive care", "Behaviour management"],
    slotMinutes: 30,
    serviceIds: ["sv1", "sv9", "sv10"],
    schedule: weekdays(h(8, 30), h(16, 30), { saturday: [h(9), h(13)] }),
  },
  d6: {
    title: "Periodontist",
    email: "david.chen@luceatdental.com",
    phone: "+1 415 555 0179",
    branch: "Harbour Street",
    joined: "2023-02-13",
    status: "active",
    languages: ["English", "Mandarin"],
    registration: "GDC 234 118",
    qualifications: [
      { award: "BDS", institution: "National University of Singapore", year: "2015" },
      { award: "MClinDent Periodontology", institution: "Queen Mary University of London", year: "2021" },
    ],
    specialties: ["Periodontics", "Soft-tissue grafting", "Maintenance therapy"],
    slotMinutes: 60,
    serviceIds: ["sv1", "sv8", "sv10"],
    schedule: weekdays(h(10), h(18), { off: [1] }),
  },
};

export const doctorProfiles: DoctorProfile[] = baseDoctors.map((d, i) => ({
  ...d,
  ref: `DR-${String(201 + i).padStart(3, "0")}`,
  bio: BIOS[d.id],
  ...PROFILE_DATA[d.id],
}));

export const doctorProfileById = (id: string) =>
  doctorProfiles.find((d) => d.id === id);

export const DOCTOR_STATUS_META: Record<
  DoctorStatus,
  { labelKey: MessageKey; chip: string }
> = {
  active: {
    labelKey: "doctorStatus.active",
    chip: "bg-status-confirmed-bg text-status-confirmed",
  },
  leave: {
    labelKey: "doctorStatus.leave",
    chip: "bg-status-pending-bg text-status-pending",
  },
  inactive: {
    labelKey: "doctorStatus.inactive",
    chip: "bg-status-noshow-bg text-status-noshow",
  },
};

/**
 * Weekday names in the active language, indexed Sunday-first to match
 * `Date.getUTCDay()` and the `WeekSchedule` keys. Derived from `Intl` rather
 * than written out, so Arabic gets real weekday names instead of
 * transliterated English ones.
 */
const weekdayNames = (style: "long" | "short") => {
  const f = new Intl.DateTimeFormat(LOCALE_META[getLocale()].intlTag, {
    timeZone: "UTC",
    weekday: style,
  });
  // 2024-01-07 was a Sunday, so day 0 lands on index 0.
  return Array.from({ length: 7 }, (_, i) =>
    f.format(new Date(Date.UTC(2024, 0, 7 + i)))
  );
};

export const dayNames = () => weekdayNames("long");
export const dayShort = () => weekdayNames("short");


export const formatMinutes = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Human summary of a week, collapsing identical consecutive days. */
export function summariseSchedule(schedule: WeekSchedule): string {
  const working = [1, 2, 3, 4, 5, 6, 0].filter((d) => schedule[d]);
  const short = dayShort();
  if (!working.length) return "";
  const groups: { days: number[]; label: string }[] = [];
  for (const d of working) {
    const s = schedule[d]!;
    const label = `${formatMinutes(s.start)}–${formatMinutes(s.end)}`;
    const last = groups[groups.length - 1];
    const prev = last?.days[last.days.length - 1];
    // Only collapse into a range when the days are genuinely consecutive —
    // otherwise a mid-week day off disappears behind "Mon–Fri".
    const consecutive = prev !== undefined && d === prev + 1;
    if (last && last.label === label && consecutive) last.days.push(d);
    else groups.push({ days: [d], label });
  }
  return groups
    .map((g) =>
      g.days.length > 2
        ? `${short[g.days[0]]}–${short[g.days[g.days.length - 1]]} ${g.label}`
        : g.days.map((d) => short[d]).join(", ") + ` ${g.label}`
    )
    .join(" · ");
}

export const weeklyHours = (schedule: WeekSchedule) =>
  Object.values(schedule).reduce((total, day) => {
    if (!day) return total;
    const lunch =
      day.breakStart != null && day.breakEnd != null
        ? day.breakEnd - day.breakStart
        : 0;
    return total + (day.end - day.start - lunch);
  }, 0) / 60;
