import type { MessageKey } from "./i18n";
/**
 * Treatment plan domain logic.
 *
 * Pure functions over a plan, so totals and progress are computed in one
 * place rather than recalculated differently in each view.
 */
import type { TreatmentPlan, TreatmentStep } from "@/lib/mock/patients";

export type PlanStatus = "not_started" | "in_progress" | "completed" | "stalled";

export interface PlanSummary {
  total: number;
  invoiced: number;
  remaining: number;
  sessions: number;
  completed: number;
  scheduled: number;
  unscheduled: number;
  progress: number;
  status: PlanStatus;
  /** The next step that still needs an appointment. */
  nextUnscheduled?: TreatmentStep;
}

export function summarise(plan: TreatmentPlan): PlanSummary {
  const steps = plan.steps;
  const completed = steps.filter((s) => s.status === "done");
  const scheduled = steps.filter((s) => s.status !== "done" && s.date);
  const unscheduled = steps.filter((s) => s.status !== "done" && !s.date);

  const total = steps.reduce((sum, s) => sum + s.cost, 0);
  const invoiced = completed.reduce((sum, s) => sum + s.cost, 0);

  const status: PlanStatus =
    completed.length === steps.length
      ? "completed"
      : completed.length === 0
        ? "not_started"
        : // Work has started but nothing is booked to continue it.
          scheduled.length === 0
          ? "stalled"
          : "in_progress";

  return {
    total,
    invoiced,
    remaining: total - invoiced,
    sessions: steps.length,
    completed: completed.length,
    scheduled: scheduled.length,
    unscheduled: unscheduled.length,
    progress: steps.length ? (completed.length / steps.length) * 100 : 0,
    status,
    nextUnscheduled: unscheduled[0],
  };
}

export const PLAN_STATUS_META: Record<
  PlanStatus,
  { labelKey: MessageKey; chip: string; hintKey: MessageKey }
> = {
  not_started: {
    labelKey: "plans.notStarted",
    chip: "bg-surface-sunken text-ink-soft",
    hintKey: "planStatus.not_started.hint",
  },
  in_progress: {
    labelKey: "plans.inProgress",
    chip: "bg-status-progress-bg text-status-progress",
    hintKey: "planStatus.in_progress.hint",
  },
  stalled: {
    labelKey: "plans.needsScheduling",
    chip: "bg-status-pending-bg text-status-pending",
    hintKey: "planStatus.stalled.hint",
  },
  completed: {
    labelKey: "status.completed",
    chip: "bg-status-completed-bg text-status-completed",
    hintKey: "planStatus.completed.hint",
  },
};

export const STEP_STATUS_META = {
  done: {
    labelKey: "stepStatus.done",
    chip: "bg-status-completed-bg text-status-completed",
  },
  active: {
    labelKey: "stepStatus.active",
    chip: "bg-status-checkedin-bg text-status-checkedin",
  },
  planned: {
    labelKey: "stepStatus.planned",
    chip: "bg-surface-sunken text-ink-soft",
  },
} as const;
