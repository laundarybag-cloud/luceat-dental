/**
 * Clinical record data: diagnoses, assistant suggestions and the access log.
 *
 * Diagnoses and assistant suggestions are deliberately *separate types*, not
 * one list with a flag. A suggestion from the AI assistant is never a
 * diagnosis: it has no code, it cannot be filed, and it only becomes part of
 * the record when a clinician confirms it — at which point a real diagnosis
 * is created with that clinician's name against it.
 */
import { patientRecords } from "./patients";
import { doctorProfiles } from "./doctors";
import { TODAY } from "./schedule";
import type { Role } from "@/lib/access";

export type DiagnosisStatus = "active" | "monitoring" | "resolved";

export interface Diagnosis {
  id: string;
  /** ICD-10 / SNODENT style code, as a real record would carry. */
  code: string;
  label: string;
  status: DiagnosisStatus;
  site?: string;
  recordedOn: string;
  /** Always a named clinician — a diagnosis has an author. */
  clinicianId: string;
  note?: string;
  /** Set when the entry began life as an assistant suggestion. */
  confirmedFromSuggestion?: boolean;
}

export interface AssistantSuggestion {
  id: string;
  /** What the assistant observed, phrased as an observation, never a finding. */
  observation: string;
  basis: string;
  raisedOn: string;
  /** Conversations the observation came from. */
  sources: string[];
  /**
   * Knowledge articles the assistant drew on, by id. Rendered through the
   * publish gate, so withdrawing an article changes what is shown here.
   */
  articleIds: string[];
  confidence: "low" | "moderate";
}

export interface AccessEntry {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
}

const DIAGNOSIS_POOL: Omit<Diagnosis, "id" | "clinicianId" | "recordedOn">[] = [
  {
    code: "K02.1",
    label: "Caries of dentine",
    status: "active",
    site: "Tooth 36, occlusal",
    note: "Confirmed on bitewing radiograph. Restoration planned.",
  },
  {
    code: "K05.31",
    label: "Chronic periodontitis, generalised",
    status: "monitoring",
    site: "Generalised",
    note: "Stage II, grade B. Three-monthly maintenance in place.",
  },
  {
    code: "K07.61",
    label: "Temporomandibular joint disorder",
    status: "monitoring",
    site: "Left TMJ",
    note: "Clicking on opening, no locking. Night guard issued.",
  },
  {
    code: "K03.0",
    label: "Excessive attrition of teeth",
    status: "active",
    site: "Anterior maxilla",
    note: "Consistent with reported bruxism.",
  },
  {
    code: "K04.7",
    label: "Periapical abscess without sinus",
    status: "resolved",
    site: "Tooth 46",
    note: "Resolved following endodontic treatment.",
  },
  {
    code: "K08.1",
    label: "Complete loss of teeth, traumatic",
    status: "resolved",
    site: "Tooth 21",
    note: "Implant placed and restored.",
  },
];

const SUGGESTION_POOL: Omit<AssistantSuggestion, "id" | "raisedOn">[] = [
  {
    observation:
      "Patient described “sharp pain on cold drinks, upper left” in a chat on 14 November.",
    basis: "Patient's own words in an assistant conversation.",
    sources: ["Assistant conversation #2284"],
    articleIds: ["kb-3"],
    confidence: "moderate",
  },
  {
    observation:
      "Patient asked twice about bleeding gums when brushing, three weeks apart.",
    basis: "Repeated question pattern in assistant conversations.",
    sources: ["Assistant conversation #2190", "Assistant conversation #2246"],
    articleIds: ["kb-12"],
    confidence: "moderate",
  },
  {
    observation:
      "Patient reported grinding their teeth at night when rescheduling an appointment.",
    basis: "Free-text note captured during rescheduling.",
    sources: ["Assistant conversation #2301"],
    articleIds: ["kb-3", "kb-1"],
    confidence: "low",
  },
];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export interface ClinicalRecord {
  patientId: string;
  diagnoses: Diagnosis[];
  suggestions: AssistantSuggestion[];
  access: AccessEntry[];
  /** Consent forms that still need a signature before imaging can be billed. */
  consentOutstanding: boolean;
}

const STAFF: { actor: string; role: Role; action: string }[] = [
  { actor: "Dr. Mariam El-Nephely", role: "clinic_owner", action: "Opened the record" },
  { actor: "Reception — front desk", role: "receptionist", action: "Viewed contact details" },
  { actor: "Luceat Assistant", role: "ai_manager", action: "Read published knowledge only" },
];

export const clinicalRecords: ClinicalRecord[] = patientRecords.map((p, i) => {
  const rand = rng(50500 + i * 17);
  const lastVisit = p.lastVisit ?? TODAY;

  const diagnosisCount = p.conditions.length ? 2 : 1;
  const diagnoses: Diagnosis[] = Array.from({ length: diagnosisCount }, (_, n) => {
    const base = DIAGNOSIS_POOL[(i + n * 2) % DIAGNOSIS_POOL.length];
    return {
      ...base,
      id: `dx-${p.id}-${n}`,
      clinicianId:
        doctorProfiles[Math.floor(rand() * doctorProfiles.length)].id,
      recordedOn: shiftDate(lastVisit, -(n * 90 + Math.floor(rand() * 60))),
    };
  });

  const suggestions: AssistantSuggestion[] =
    rand() < 0.45
      ? [
          {
            ...SUGGESTION_POOL[i % SUGGESTION_POOL.length],
            id: `sg-${p.id}`,
            raisedOn: shiftDate(TODAY, -Math.floor(rand() * 12)),
          },
        ]
      : [];

  const access: AccessEntry[] = STAFF.map((s, n) => ({
    ...s,
    id: `ac-${p.id}-${n}`,
    at: shiftDate(TODAY, -(n * 3 + Math.floor(rand() * 4))),
  }));

  return {
    patientId: p.id,
    diagnoses,
    suggestions,
    access,
    consentOutstanding: rand() < 0.25,
  };
});

export const recordFor = (patientId: string) =>
  clinicalRecords.find((r) => r.patientId === patientId);

export const DIAGNOSIS_STATUS_META: Record<
  DiagnosisStatus,
  { label: string; chip: string }
> = {
  active: {
    label: "Active",
    chip: "bg-status-cancelled-bg text-status-cancelled",
  },
  monitoring: {
    label: "Monitoring",
    chip: "bg-status-pending-bg text-status-pending",
  },
  resolved: {
    label: "Resolved",
    chip: "bg-status-completed-bg text-status-completed",
  },
};
