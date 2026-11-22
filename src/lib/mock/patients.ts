/**
 * Patient register fixture.
 *
 * Built deterministically from the same seeded generator style as the
 * appointment book, so every render — server or client — is identical.
 * Shaped like the API the backend will expose: one list endpoint and one
 * record endpoint per patient.
 */
import type { ToothCondition, ToothRecord } from "@/lib/dental";
import { ALL_TEETH } from "@/lib/dental";
import {
  patients as basePatients,
  weekAppointments,
  serviceById,
  TODAY,
} from "./schedule";
import { doctors } from "./clinic";
import type { Appointment } from "@/lib/types";
import type { MessageKey } from "../i18n";
import { withArabic } from "./localize";
import { PLAN_STEP_AR, PLAN_TITLE_AR } from "./content-ar";

export type PatientStatus = "active" | "new" | "treatment" | "overdue" | "inactive";

export interface Allergy {
  substance: string;
  severity: "mild" | "moderate" | "severe";
  reaction: string;
}

export interface Medication {
  name: string;
  dose: string;
  reason: string;
}

export interface Condition {
  name: string;
  since: string;
  note?: string;
}

export interface TreatmentStep {
  id: string;
  name: string;
  /** The catalogue service this step books. Cost and duration come from it. */
  serviceId: string;
  status: "done" | "active" | "planned";
  /** Set once the step has an appointment. */
  date?: string;
  appointmentId?: string;
  /** Normally the catalogue price; overridden only for an agreed discount. */
  cost: number;
  note?: string;
}

export interface TreatmentPlan {
  id: string;
  title: string;
  doctorId: string;
  created: string;
  steps: TreatmentStep[];
}

export interface Prescription {
  id: string;
  drug: string;
  dose: string;
  course: string;
  issued: string;
  doctorId: string;
}

export interface PatientDocument {
  id: string;
  name: string;
  kind: "xray" | "scan" | "consent" | "referral" | "photo";
  added: string;
  sizeKb: number;
  preview?: string;
}

export interface LedgerEntry {
  id: string;
  description: string;
  date: string;
  amount: number;
  status: "paid" | "due" | "refunded";
  method?: string;
}

export interface ClinicalNote {
  id: string;
  at: string;
  doctorId: string;
  body: string;
}

export interface PatientRecord {
  id: string;
  ref: string;
  name: string;
  avatar: string;
  age: number;
  phone: string;
  email: string;
  gender: "Female" | "Male";
  address: string;
  insurer: string;
  registered: string;
  status: PatientStatus;
  lastVisit?: string;
  nextAppointment?: string;
  primaryDoctorId: string;
  balance: number;
  allergies: Allergy[];
  conditions: Condition[];
  medications: Medication[];
  chart: ToothRecord[];
  plans: TreatmentPlan[];
  prescriptions: Prescription[];
  documents: PatientDocument[];
  ledger: LedgerEntry[];
  notes: ClinicalNote[];
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rand: () => number, list: T[]) =>
  list[Math.floor(rand() * list.length)];

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const ALLERGY_POOL: Allergy[] = [
  { substance: "Penicillin", severity: "severe", reaction: "Anaphylaxis — adrenaline on file" },
  { substance: "Latex", severity: "moderate", reaction: "Contact dermatitis" },
  { substance: "Articaine", severity: "mild", reaction: "Localised swelling" },
  { substance: "Ibuprofen", severity: "moderate", reaction: "Gastric irritation" },
  { substance: "Chlorhexidine", severity: "mild", reaction: "Oral mucosal irritation" },
];

const CONDITION_POOL: Condition[] = [
  { name: "Type 2 diabetes", since: "2019", note: "HbA1c reviewed six-monthly; delayed healing expected." },
  { name: "Hypertension", since: "2021", note: "Avoid adrenaline-heavy anaesthetic." },
  { name: "Bruxism", since: "2023", note: "Night guard issued." },
  { name: "Asthma", since: "2012", note: "Inhaler carried to appointments." },
  { name: "Periodontitis (stage II)", since: "2024", note: "Three-monthly maintenance." },
  { name: "Pregnancy — second trimester", since: "2026", note: "Defer elective radiographs." },
];

const MEDICATION_POOL: Medication[] = [
  { name: "Metformin", dose: "500 mg twice daily", reason: "Type 2 diabetes" },
  { name: "Amlodipine", dose: "5 mg daily", reason: "Hypertension" },
  { name: "Salbutamol", dose: "As required", reason: "Asthma" },
  { name: "Warfarin", dose: "3 mg daily", reason: "Atrial fibrillation — INR check before extraction" },
  { name: "Levothyroxine", dose: "75 mcg daily", reason: "Hypothyroidism" },
];

const EMAIL_HOSTS = ["gmail.com", "outlook.com", "fastmail.com", "proton.me"];
const INSURERS = ["Meridian Health", "BlueCare Dental", "Self-funded", "Axis Mutual", "Clinic plan"];
const STREETS = ["Harbour View", "Lindendal", "Cypress Row", "Marlowe Street", "Ashgrove Lane", "Quay Terrace"];

const DOC_POOL: Omit<PatientDocument, "id" | "added">[] = [
  { name: "Panoramic radiograph", kind: "xray", sizeKb: 1840, preview: "/images/scenes/xray-panoramic.jpg" },
  { name: "Bitewing series", kind: "xray", sizeKb: 920, preview: "/images/scenes/xray-review.jpg" },
  { name: "Intraoral scan", kind: "scan", sizeKb: 5120, preview: "/images/scenes/tooth-model.jpg" },
  { name: "Treatment consent form", kind: "consent", sizeKb: 148 },
  { name: "Referral — oral surgery", kind: "referral", sizeKb: 96 },
  { name: "Pre-treatment photograph", kind: "photo", sizeKb: 760, preview: "/images/scenes/smile.jpg" },
];

const NOTE_POOL = [
  "Reviewed oral hygiene technique; interdental brushing demonstrated. Plaque score improved since last visit.",
  "Patient reports intermittent sensitivity to cold on the upper left quadrant. No visible fracture line.",
  "Local anaesthetic 2% lidocaine with adrenaline, 1.8 ml. Uneventful. Post-op instructions given verbally and in writing.",
  "Discussed treatment options and costs. Patient elected to proceed in two stages for affordability.",
  "Healing satisfactory at one-week review. Sutures removed. No sign of infection.",
];

const CHART_SEEDS: ToothCondition[] = [
  "caries",
  "filled",
  "filled",
  "crown",
  "root_canal",
  "planned",
  "missing",
  "implant",
];

function buildChart(rand: () => number): ToothRecord[] {
  const chart: ToothRecord[] = ALL_TEETH.map((fdi) => ({
    fdi,
    condition: "healthy" as ToothCondition,
  }));
  const findings = 2 + Math.floor(rand() * 7);
  for (let i = 0; i < findings; i++) {
    const idx = Math.floor(rand() * chart.length);
    const condition = pick(rand, CHART_SEEDS);
    chart[idx] = {
      fdi: chart[idx].fdi,
      condition,
      updated: shiftDate(TODAY, -Math.floor(rand() * 500)),
      note:
        condition === "caries"
          ? "Occlusal decay noted on radiograph."
          : condition === "planned"
            ? "Included in the active treatment plan."
            : undefined,
    };
  }
  return chart;
}

/** Realistic plan shapes. Each sequences real catalogue services. */
const PLAN_ARCHETYPES: {
  title: string;
  services: string[];
  names: string[];
}[] = [
  {
    title: "Implant and crown — 36",
    services: ["sv10", "sv6", "sv5", "sv1"],
    names: [
      "Diagnostics and imaging",
      "Implant placement",
      "Crown fitting",
      "Review appointment",
    ],
  },
  {
    title: "Full-mouth rehabilitation",
    services: ["sv10", "sv1", "sv8", "sv3", "sv5", "sv1"],
    names: [
      "Diagnostics and imaging",
      "Scale and polish",
      "Periodontal therapy",
      "Composite restoration",
      "Crown fitting",
      "Review appointment",
    ],
  },
  {
    title: "Periodontal stabilisation",
    services: ["sv10", "sv8", "sv8", "sv1"],
    names: [
      "Baseline charting and imaging",
      "Deep cleaning — upper quadrants",
      "Deep cleaning — lower quadrants",
      "Maintenance review",
    ],
  },
  {
    title: "Clear aligner course",
    services: ["sv10", "sv7", "sv7", "sv7", "sv1"],
    names: [
      "Records and intraoral scan",
      "Aligner fitting",
      "Progress review — stage 2",
      "Progress review — stage 3",
      "Retention review",
    ],
  },
  {
    title: "Upper-left quadrant restoration",
    services: ["sv10", "sv3", "sv4", "sv5"],
    names: [
      "Diagnostics and imaging",
      "Composite filling",
      "Root canal therapy",
      "Crown fitting",
    ],
  },
];

function buildPatient(
  base: (typeof basePatients)[number],
  index: number
): PatientRecord {
  const rand = rng(90210 + index * 31);
  const first = base.name.split(" ")[0].toLowerCase();
  const last = base.name.split(" ")[1]?.toLowerCase() ?? "patient";

  const appts = weekAppointments.filter((a) => a.patient.id === base.id);
  const past = appts
    .filter((a) => a.start.slice(0, 10) <= TODAY && a.status === "completed")
    .sort((a, b) => b.start.localeCompare(a.start));
  const future = appts
    .filter((a) => a.start > `${TODAY}T23:59` && a.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));

  // The appointment book only covers the current week. If last visit were
  // always taken from it, every patient would show the same two dates and
  // "recall overdue" could never occur — so most patients carry a longer
  // history and only recent attenders are dated from the book.
  const attendedThisWeek = rand() < 0.4 && past.length > 0;
  const registered = shiftDate(
    TODAY,
    -(rand() < 0.12 ? 8 + Math.floor(rand() * 50) : 120 + Math.floor(rand() * 1700))
  );
  const historicalVisit = shiftDate(
    TODAY,
    -(14 + Math.floor(rand() * 520))
  );
  const lastVisit = attendedThisWeek
    ? past[0].start.slice(0, 10)
    : historicalVisit > registered
      ? historicalVisit
      : registered;
  const daysSince = Math.round(
    (new Date(`${TODAY}T00:00:00Z`).getTime() -
      new Date(`${lastVisit}T00:00:00Z`).getTime()) /
      86_400_000
  );

  // A patient who has not attended for over six months should not have plan
  // steps dated after their last visit, nor a step scheduled for next week.
  const lapsed = daysSince > 180;
  const archetype = PLAN_ARCHETYPES[index % PLAN_ARCHETYPES.length];
  const plansEn: TreatmentPlan[] =
    rand() < (lapsed ? 0.25 : 0.6)
      ? [
          {
            id: `tp-${base.id}`,
            title: archetype.title,
            doctorId: pick(rand, doctors).id,
            created: shiftDate(lastVisit, -(70 + Math.floor(rand() * 60))),
            // Drawn once for the whole plan: a per-step draw would let a
            // later session be booked while an earlier one is unscheduled.
            steps: ((doneCount: number) =>
            archetype.services.map((serviceId, n) => {
              const service = serviceById(serviceId)!;
              const isDone = n < doneCount;
              const isNext = n === doneCount && !lapsed;
              return {
                id: `st-${base.id}-${n + 1}`,
                name: archetype.names[n],
                serviceId,
                status: isDone
                  ? ("done" as const)
                  : isNext
                    ? ("active" as const)
                    : ("planned" as const),
                date: isDone
                  ? shiftDate(lastVisit, -((doneCount - n) * 28))
                  : isNext
                    ? shiftDate(TODAY, 4 + n)
                    : undefined,
                cost: service.price,
              };
            }))(
              Math.min(
                archetype.services.length - 1,
                Math.floor(rand() * archetype.services.length)
              )
            ),
          },
        ]
      : [];

  /**
   * Plan titles and session names are generated from a handful of English
   * archetypes, so they resolve against the active language here — the
   * labels are matched on their English text, since the archetypes carry
   * no ids of their own.
   */
  /**
   * Plan titles and session names are generated from a handful of English
   * archetypes, so they resolve against the active language here — matched
   * on their English text, since the archetypes carry no ids of their own.
   *
   * Order matters: spreading a record copies the current value of any
   * localized getter on it, so the steps are rebuilt first and the title
   * getters are attached last, to the object that is actually handed out.
   */
  const withSteps = plansEn.map((plan) => ({
    ...plan,
    steps: withArabic(
      plan.steps,
      Object.fromEntries(
        plan.steps.map((st) => [st.id, { name: PLAN_STEP_AR[st.name] }])
      )
    ),
  }));

  const plans: TreatmentPlan[] = withArabic(
    withSteps,
    Object.fromEntries(
      withSteps.map((p) => [p.id, { title: PLAN_TITLE_AR[p.title] }])
    )
  );

  // Order matters: a brand-new registration outranks everything, and a
  // patient long overdue for recall should not read as simply "active".
  const status: PatientStatus =
    registered > shiftDate(TODAY, -60)
      ? "new"
      : daysSince > 400
        ? "inactive"
        : daysSince > 180
          ? "overdue"
          : plans.length && future.length
            ? "treatment"
            : "active";

  const ledger: LedgerEntry[] = Array.from(
    { length: 2 + Math.floor(rand() * 4) },
    (_, i) => {
      const paid = rand() < 0.72;
      return {
        id: `le-${base.id}-${i}`,
        description: pick(rand, [
          "Routine check-up & clean",
          "Composite filling",
          "Digital X-ray & imaging",
          "Crown fitting — stage 1",
          "Deep cleaning",
        ]),
        date: shiftDate(lastVisit, -Math.floor(rand() * 420)),
        amount: [95, 120, 180, 260, 420, 650][Math.floor(rand() * 6)],
        status: paid ? "paid" : rand() < 0.12 ? "refunded" : "due",
        method: paid ? pick(rand, ["Visa ••4417", "Mastercard ••8820", "Bank transfer", "Cash"]) : undefined,
      };
    }
  );

  return {
    id: base.id,
    ref: `LD-${String(4100 + index).padStart(4, "0")}`,
    name: base.name,
    avatar: base.avatar,
    age: base.age,
    phone: base.phone,
    email: `${first}.${last}@${pick(rand, EMAIL_HOSTS)}`,
    gender: index % 2 === 0 ? "Female" : "Male",
    address: `${10 + Math.floor(rand() * 90)} ${pick(rand, STREETS)}, San Francisco`,
    insurer: pick(rand, INSURERS),
    registered,
    status,
    lastVisit,
    nextAppointment: future[0]?.start,
    primaryDoctorId: pick(rand, doctors).id,
    balance: ledger
      .filter((l) => l.status === "due")
      .reduce((sum, l) => sum + l.amount, 0),
    allergies: rand() < 0.45 ? [pick(rand, ALLERGY_POOL)] : [],
    conditions:
      rand() < 0.6
        ? [pick(rand, CONDITION_POOL)].concat(
            rand() < 0.3 ? [pick(rand, CONDITION_POOL)] : []
          )
        : [],
    medications: rand() < 0.5 ? [pick(rand, MEDICATION_POOL)] : [],
    chart: buildChart(rand),
    plans,
    prescriptions:
      rand() < 0.5
        ? [
            {
              id: `rx-${base.id}`,
              drug: pick(rand, ["Amoxicillin", "Metronidazole", "Chlorhexidine 0.2% rinse", "Ibuprofen"]),
              dose: pick(rand, ["500 mg", "400 mg", "10 ml", "200 mg"]),
              course: pick(rand, ["Three times daily for 5 days", "Twice daily for 7 days", "Rinse twice daily for 14 days"]),
              issued: shiftDate(lastVisit, -Math.floor(rand() * 120)),
              doctorId: pick(rand, doctors).id,
            },
          ]
        : [],
    ledger,
    documents: DOC_POOL.slice(0, 2 + Math.floor(rand() * 4)).map((d, i) => ({
      ...d,
      id: `doc-${base.id}-${i}`,
      added: shiftDate(lastVisit, -Math.floor(rand() * 300)),
    })),
    notes: Array.from({ length: 1 + Math.floor(rand() * 3) }, (_, i) => ({
      id: `note-${base.id}-${i}`,
      at: shiftDate(lastVisit, -(i * 34 + Math.floor(rand() * 10))),
      doctorId: pick(rand, doctors).id,
      body: NOTE_POOL[(index + i) % NOTE_POOL.length],
    })),
  };
}

export const patientRecords: PatientRecord[] = basePatients.map(buildPatient);

export const patientById = (id: string) =>
  patientRecords.find((p) => p.id === id);

/** Every appointment belonging to a patient, newest first. */
export const appointmentsForPatient = (id: string): Appointment[] =>
  weekAppointments
    .filter((a) => a.patient.id === id)
    .sort((a, b) => b.start.localeCompare(a.start));

export const PATIENT_STATUS_META: Record<
  PatientStatus,
  { labelKey: MessageKey; chip: string }
> = {
  active: {
    labelKey: "patientStatus.active",
    chip: "bg-status-confirmed-bg text-status-confirmed",
  },
  new: { labelKey: "patientStatus.new", chip: "bg-gold-100 text-gold-600" },
  treatment: {
    labelKey: "patientStatus.treatment",
    chip: "bg-status-progress-bg text-status-progress",
  },
  overdue: {
    labelKey: "patientStatus.overdue",
    chip: "bg-status-pending-bg text-status-pending",
  },
  inactive: {
    labelKey: "patientStatus.inactive",
    chip: "bg-status-noshow-bg text-status-noshow",
  },
};
