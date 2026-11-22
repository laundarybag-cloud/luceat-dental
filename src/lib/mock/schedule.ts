/**
 * Mock appointment book for the week of 16–22 November 2026.
 *
 * Generated deterministically from a fixed seed so server and client render
 * the same bytes, and so the fixture can be regenerated without hand-editing
 * sixty records. The generator respects clinic hours and never double-books a
 * doctor — the same invariant the UI enforces.
 */
import type { Appointment, AppointmentStatus, Patient } from "@/lib/types";
import { doctorProfiles } from "./doctors";
import {
  clinicHoursFor,
  atMinutes,
  findConflict,
  weekDays,
  weekdayIndex,
} from "@/lib/schedule";
import { withArabic } from "./localize";
import { APPOINTMENT_SERVICE_AR, SERVICE_AR } from "./content-ar";

/** The clinic "now" every view is rendered against. */
export const NOW = "2026-11-20T10:20:00.000Z";
export const TODAY = NOW.slice(0, 10);

export interface Service {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  price: number;
}

const SERVICES_EN: Service[] = [
  { id: "sv1", name: "Routine check-up & clean", category: "Preventive", durationMin: 30, price: 120 },
  { id: "sv2", name: "Teeth whitening", category: "Cosmetic", durationMin: 60, price: 300 },
  { id: "sv3", name: "Composite filling", category: "Restorative", durationMin: 45, price: 180 },
  { id: "sv4", name: "Root canal therapy", category: "Endodontics", durationMin: 90, price: 650 },
  { id: "sv5", name: "Crown fitting", category: "Prosthodontics", durationMin: 45, price: 820 },
  { id: "sv6", name: "Implant placement", category: "Oral Surgery", durationMin: 90, price: 1900 },
  { id: "sv7", name: "Aligner review", category: "Orthodontics", durationMin: 30, price: 140 },
  { id: "sv8", name: "Deep cleaning", category: "Periodontics", durationMin: 60, price: 260 },
  { id: "sv9", name: "Paediatric check-up", category: "Paediatric", durationMin: 30, price: 95 },
  { id: "sv10", name: "Digital X-ray & imaging", category: "Diagnostics", durationMin: 20, price: 110 },
  // Catalogue-only entries: no clinician is assigned to either, so the
  // generator never books them and the catalogue can show both edge states.
  { id: "sv11", name: "IV sedation", category: "Oral Surgery", durationMin: 60, price: 450 },
  { id: "sv12", name: "Night guard fitting", category: "Prosthodontics", durationMin: 30, price: 220 },
];

/**
 * The catalogue the rest of the application reads. `name` and `category`
 * resolve against the active language when they are read — see
 * ./localize.ts — so every screen that shows a service follows the
 * interface without any of them having to know about it.
 */
export const services: Service[] = withArabic(SERVICES_EN, SERVICE_AR);

export const serviceById = (id: string) => services.find((s) => s.id === id);

const AVATARS = Array.from(
  { length: 8 },
  (_, i) => `/images/patients/p0${i + 1}.jpg`
);

const NAMES = [
  "Clara Whitfield", "Daniel Okafor", "Ingrid Larsen", "Marco Bianchi",
  "Priya Raman", "Thomas Alvarez", "Hannah Voss", "Jonas Pettersen",
  "Rosa Delgado", "Felix Brandt", "Amira Haddad", "Noah Lindqvist",
  "Sofia Marchetti", "Elias Wagner", "Leila Mansour", "Oscar Dupont",
  "Mina Takahashi", "Ruben Castillo", "Nora Eriksen", "Adam Rashid",
];

export const patients: Patient[] = NAMES.map((name, i) => ({
  id: `pt${i + 1}`,
  name,
  avatar: AVATARS[i % AVATARS.length],
  age: 22 + ((i * 7) % 45),
  phone: `+1 415 ${String(200 + i * 13).padStart(3, "0")} ${String(
    1000 + i * 377
  ).slice(0, 4)}`,
}));

/* --------------------------------------------------------- generator --- */

/** Small deterministic PRNG (mulberry32) — same sequence everywhere. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildWeek(): Appointment[] {
  const rand = rng(20261120);
  const out: Appointment[] = [];
  let seq = 0;
  const nowMs = new Date(NOW).getTime();

  for (const date of weekDays(TODAY)) {
    const hours = clinicHoursFor(date);
    if (!hours) continue;

    for (const doctor of doctorProfiles) {
      // A clinician on leave takes no bookings at all.
      if (doctor.status !== "active") continue;

      // Their own rota, clamped to the clinic's opening hours.
      const rota = doctor.schedule[weekdayIndex(date)];
      if (!rota) continue;
      const dayOpen = Math.max(hours.open * 60, rota.start);
      const dayClose = Math.min(hours.close * 60, rota.end);

      let minute = dayOpen + Math.floor(rand() * 3) * 15;

      while (minute < dayClose - 20) {
        // Occasional admin gap.
        if (rand() < 0.22) {
          minute += 30;
          continue;
        }

        // Only services this clinician is assigned to.
        const offered = services.filter((sv) => doctor.serviceIds.includes(sv.id));
        const service = offered[Math.floor(rand() * offered.length)];
        if (minute + service.durationMin > dayClose) break;

        // Skip their break rather than booking through it.
        if (
          rota.breakStart != null &&
          rota.breakEnd != null &&
          minute < rota.breakEnd &&
          rota.breakStart < minute + service.durationMin
        ) {
          minute = rota.breakEnd;
          continue;
        }

        const start = atMinutes(date, minute);
        const startMs = new Date(start).getTime();

        let status: AppointmentStatus;
        if (startMs + service.durationMin * 60_000 <= nowMs) {
          const r = rand();
          status = r < 0.86 ? "completed" : r < 0.94 ? "cancelled" : "no_show";
        } else if (startMs <= nowMs) {
          status = "in_progress";
        } else if (startMs - nowMs < 75 * 60_000) {
          status = "checked_in";
        } else {
          const r = rand();
          status = r < 0.72 ? "confirmed" : r < 0.92 ? "pending" : "cancelled";
        }

        const patient = patients[Math.floor(rand() * patients.length)];
        const candidate = {
          doctorId: doctor.id,
          start,
          durationMin: service.durationMin,
        };

        // Belt and braces: the fixture obeys the same rule as the UI.
        if (!findConflict(out, candidate)) {
          out.push({
            id: `ap${++seq}`,
            patient,
            doctorId: doctor.id,
            service: service.name,
            serviceId: service.id,
            start,
            durationMin: service.durationMin,
            status,
            isNewPatient: rand() < 0.12,
            notes:
              rand() < 0.25
                ? "Patient reports mild sensitivity on the upper left quadrant."
                : undefined,
          });
        }

        minute += service.durationMin + (rand() < 0.5 ? 15 : 0);
      }
    }
  }

  return out.sort((a, b) => a.start.localeCompare(b.start));
}

const WEEK_EN: Appointment[] = buildWeek();

/** Same treatment: the label resolves against the active language. */
export const weekAppointments: Appointment[] = withArabic(
  WEEK_EN,
  Object.fromEntries(
    WEEK_EN.map((a) => [a.id, { service: APPOINTMENT_SERVICE_AR[a.service] }])
  )
);
