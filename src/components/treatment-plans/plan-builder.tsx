"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { patientRecords } from "@/lib/mock/patients";
import { doctorProfiles } from "@/lib/mock/doctors";
import { catalogue, isBookable } from "@/lib/mock/catalogue";
import { formatDuration } from "@/lib/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/locale-context";

interface DraftStep {
  key: number;
  serviceId: string;
}

export function PlanBuilderDialog({
  open,
  onOpenChange,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: string;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [title, setTitle] = React.useState("");
  const [patient, setPatient] = React.useState(patientId ?? "");
  const [doctorId, setDoctorId] = React.useState("");
  const [steps, setSteps] = React.useState<DraftStep[]>([]);
  const [touched, setTouched] = React.useState(false);
  const nextKey = React.useRef(1);

  React.useEffect(() => {
    if (!open) return;
    setTitle("");
    setPatient(patientId ?? "");
    setDoctorId("");
    setSteps([]);
    setTouched(false);
  }, [open, patientId]);

  const doctor = doctorProfiles.find((d) => d.id === doctorId);

  // Only services this clinician provides can be sequenced into their plan.
  const available = React.useMemo(
    () =>
      catalogue.filter(
        (s) => isBookable(s) && (!doctor || doctor.serviceIds.includes(s.id))
      ),
    [doctor]
  );

  const resolved = steps.map((s) => ({
    ...s,
    service: catalogue.find((c) => c.id === s.serviceId)!,
  }));
  const total = resolved.reduce((sum, s) => sum + (s.service?.price ?? 0), 0);
  const chairTime = resolved.reduce(
    (sum, s) => sum + (s.service?.durationMin ?? 0),
    0
  );

  const missing = {
    title: !title.trim(),
    patient: !patient,
    doctor: !doctorId,
    steps: steps.length === 0,
  };
  const blocked = Object.values(missing).some(Boolean);

  // Changing clinician can strand services they do not provide.
  const stranded = doctor
    ? steps.filter((s) => !doctor.serviceIds.includes(s.serviceId))
    : [];

  const addStep = (serviceId: string) =>
    setSteps((all) => [...all, { key: nextKey.current++, serviceId }]);

  const move = (index: number, dir: -1 | 1) =>
    setSteps((all) => {
      const next = [...all];
      const target = index + dir;
      if (target < 0 || target >= next.length) return all;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    toast({
      tone: "info",
      title: t("plans.notSaved"),
      detail: t("plans.notSavedBody"),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={t("plans.newTitle")}
        description={t("plans.sequenceHint")}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Save />
              {t("plans.create")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("plans.planTitle")}
              required
              htmlFor="tp-title"
              className="sm:col-span-2"
              error={touched && missing.title ? t("v.planTitle") : undefined}
            >
              <Input
                id="tp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("plans.titlePlaceholder")}
                invalid={touched && missing.title}
              />
            </Field>
            <Field
              label={t("col.patient")}
              required
              error={touched && missing.patient ? t("v.choosePatient") : undefined}
            >
              <Select
                value={patient}
                onValueChange={setPatient}
                ariaLabel={t("col.patient")}
                placeholder={t("plans.selectPatient")}
                invalid={touched && missing.patient}
                options={patientRecords.map((p) => ({
                  value: p.id,
                  label: p.name,
                  hint: p.ref,
                }))}
              />
            </Field>
            <Field
              label={t("plans.treatingClinician")}
              required
              hint={
                doctor
                  ? `Provides ${doctor.serviceIds.length} services`
                  : t("hint.limitsProcedures")
              }
              error={touched && missing.doctor ? t("v.chooseClinician") : undefined}
            >
              <Select
                value={doctorId}
                onValueChange={setDoctorId}
                ariaLabel={t("plans.treatingClinician")}
                placeholder={t("plans.selectClinician")}
                invalid={touched && missing.doctor}
                options={doctorProfiles.map((d) => ({
                  value: d.id,
                  label: d.name,
                  hint:
                    d.status === "active"
                      ? d.specialty
                      : `${d.specialty} · on leave`,
                  disabled: d.status !== "active",
                }))}
              />
            </Field>
          </div>

          {/* Sequence */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-label uppercase text-ink-faint">
                {t("plans.sequence")}
              </p>
              <span className="text-[0.75rem] tabular-nums text-ink-muted">
                {steps.length} session{steps.length === 1 ? "" : "s"}
              </span>
            </div>

            {steps.length === 0 ? (
              <p
                className={cn(
                  "mt-2 rounded-field border border-dashed px-3 py-4 text-center text-small",
                  touched && missing.steps
                    ? "border-status-cancelled/50 text-status-cancelled"
                    : "border-line text-ink-muted"
                )}
              >
                {touched && missing.steps
                  ? "Add at least one procedure."
                  : t("empty.addProcedures")}
              </p>
            ) : (
              <ol className="mt-2 space-y-1.5">
                {resolved.map((s, i) => (
                  <li
                    key={s.key}
                    className={cn(
                      "flex items-center gap-2.5 rounded-field border bg-surface px-2.5 py-2",
                      doctor && !doctor.serviceIds.includes(s.serviceId)
                        ? "border-status-pending/40"
                        : "border-line"
                    )}
                  >
                    <span className="w-5 shrink-0 text-center text-[0.75rem] font-semibold tabular-nums text-ink-faint">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small font-medium text-ink">
                        {s.service?.name}
                      </span>
                      <span className="block truncate text-[0.6875rem] text-ink-muted">
                        {s.service?.category} ·{" "}
                        {formatDuration(s.service?.durationMin ?? 0)}
                      </span>
                    </span>
                    <span className="shrink-0 text-small font-semibold tabular-nums text-ink">
                      {formatMoney(s.service?.price ?? 0)}
                    </span>
                    <span className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("plans.moveEarlier")}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("plans.moveLater")}
                        disabled={i === steps.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${s.service?.name}`}
                        onClick={() =>
                          setSteps((all) => all.filter((x) => x.key !== s.key))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {stranded.length > 0 && (
              <p className="mt-2 flex items-start gap-1.5 rounded-field border border-status-pending/30 bg-status-pending-bg/70 px-2.5 py-2 text-[0.75rem] text-status-pending">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                {doctor?.name} does not provide{" "}
                {stranded
                  .map((s) => catalogue.find((c) => c.id === s.serviceId)?.name)
                  .join(", ")}
                . Those sessions will need another clinician when booked.
              </p>
            )}
          </div>

          {/* Add procedures */}
          <div>
            <p className="text-label uppercase text-ink-faint">
              {t("plans.addProcedure")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {available.map((s) => (
                <button
                  key={s.id}
                  onClick={() => addStep(s.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.75rem] font-medium text-ink-soft transition-colors hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700"
                  title={`${formatDuration(s.durationMin)} · ${formatMoney(s.price)}`}
                >
                  <Plus className="size-3" />
                  {s.name}
                </button>
              ))}
            </div>
            {doctor && available.length === 0 && (
              <p className="mt-2 text-[0.75rem] text-ink-muted">
                {doctor.name} has no bookable services assigned.
              </p>
            )}
          </div>

          {/* Live total */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-field border border-line bg-canvas px-3.5 py-3">
            <span className="flex items-center gap-2 text-[0.75rem] text-ink-muted">
              <Clock className="size-3.5" />
              {formatDuration(chairTime)} of chair time across {steps.length}{" "}
              session{steps.length === 1 ? "" : "s"}
            </span>
            <span className="text-section tabular-nums text-ink">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
