/**
 * Flattened view of every treatment plan in the clinic.
 *
 * Plans live on the patient record — this module does not copy them, it
 * indexes them with their patient and clinician so the plans screen can list
 * and filter without each view re-deriving the relationship.
 */
import { patientRecords, type PatientRecord, type TreatmentPlan } from "./patients";
import { doctorProfileById } from "./doctors";
import { summarise, type PlanSummary } from "@/lib/treatment";
import { withArabic } from "./localize";
import { PLAN_STEP_AR, PLAN_TITLE_AR } from "./content-ar";

export interface PlanIndexEntry {
  plan: TreatmentPlan;
  patient: PatientRecord;
  summary: PlanSummary;
  doctorName: string;
  doctorAvatar?: string;
}

export const planIndex: PlanIndexEntry[] = patientRecords
  .flatMap((patient) => patient.plans.map((plan) => ({ patient, plan })))
  .map(({ patient, plan }) => {
    const doctor = doctorProfileById(plan.doctorId);
    return {
      plan,
      patient,
      summary: summarise(plan),
      doctorName: doctor?.name ?? "Unassigned",
      doctorAvatar: doctor?.avatar,
    };
  });

export const planById = (id: string) => planIndex.find((e) => e.plan.id === id);

/**
 * Re-applies the language resolution to a plan that has been copied.
 *
 * Spreading a record (`{ ...plan }`) reads its localized getters and copies
 * the values they return, so a plan cloned into component state would be
 * frozen in whichever language was active at the time. Anywhere that clones
 * a plan and keeps it — the detail screen marking a session complete, for
 * instance — passes the result through here.
 */
export function relocalizePlan(plan: TreatmentPlan): TreatmentPlan {
  const steps = withArabic(
    plan.steps,
    Object.fromEntries(
      plan.steps.map((st) => [st.id, { name: PLAN_STEP_AR[st.name] }])
    )
  );
  return withArabic([{ ...plan, steps }], {
    [plan.id]: { title: PLAN_TITLE_AR[plan.title] },
  })[0];
}
