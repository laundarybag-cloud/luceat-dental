"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileSignature,
  History,
  Lock,
  Pill,
  Printer,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import type { PatientRecord } from "@/lib/mock/patients";
import type { ClinicalRecord } from "@/lib/mock/records";
import { DIAGNOSIS_STATUS_META } from "@/lib/mock/records";
import { ROLE_META } from "@/lib/access";
import { doctorProfileById } from "@/lib/mock/doctors";
import type { ToothRecord } from "@/lib/dental";
import type { Appointment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole, RoleChip, RoleSwitcher } from "@/components/access/role-context";
import { DentalChart } from "@/components/patients/dental-chart";
import { Panel } from "@/components/patients/profile-tabs";
import {
  AppointmentsTab,
  DocumentsTab,
  MedicalHistoryTab,
  NotesTab,
} from "@/components/patients/profile-tabs";
import { fmtDate } from "@/components/patients/patients-register";
import { AccessGate, EnforcementNotice } from "./access-gate";
import { AssistantObservations } from "./assistant-observations";
import { useI18n } from "@/components/i18n/locale-context";

function SafetyRail({ patient }: { patient: PatientRecord }) {
  const { t } = useI18n();
  const items: { icon: React.ReactNode; title: string; detail: string; tone: string }[] =
    [];

  for (const a of patient.allergies) {
    items.push({
      icon: <AlertTriangle />,
      title: `Allergy — ${a.substance}`,
      detail: t("h.allergyDetail", {
      severity: a.severity,
      reaction: a.reaction,
    }),
      tone: "border-status-cancelled/25 bg-status-cancelled-bg/60 text-status-cancelled",
    });
  }
  for (const m of patient.medications) {
    items.push({
      icon: <Pill />,
      title: m.name,
      detail: t("h.medicationDetail", { dose: m.dose, reason: m.reason }),
      tone: "border-line bg-canvas text-ink-muted",
    });
  }
  for (const c of patient.conditions) {
    items.push({
      icon: <Stethoscope />,
      title: c.name,
      detail: c.note ?? `Since ${c.since}`,
      tone: "border-line bg-canvas text-ink-muted",
    });
  }

  return (
    <Panel title={t("records.checkBeforeTreating")}>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-small text-ink-muted">
          <ShieldCheck className="size-4 text-status-completed" />
          {t("records.noHistory")}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((i, n) => (
            <li
              key={n}
              className={cn(
                "flex items-start gap-2.5 rounded-field border px-3 py-2.5",
                i.tone
              )}
            >
              <span className="mt-px [&_svg]:size-4">{i.icon}</span>
              <span className="min-w-0">
                <span className="block text-small font-medium text-ink">
                  {i.title}
                </span>
                <span className="block text-[0.75rem] leading-[1.15rem]">
                  {i.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DiagnosesTab({
  record,
  patient,
}: {
  record: ClinicalRecord;
  patient: PatientRecord;
}) {
  const { t } = useI18n();
  const { can } = useRole();
  const toast = useToast();

  return (
    <div className="space-y-4">
      <Panel
        title={`Recorded diagnoses (${record.diagnoses.length})`}
        action={
          <Button
            variant="secondary"
            size="sm"
            disabled={!can("records.diagnosis.confirm")}
            onClick={() =>
              toast({
                tone: "info",
                title: t("records.diagnosisNotSaved"),
                detail: t("records.entriesNeedServer"),
              })
            }
          >
            <Stethoscope />
            {t("records.recordDiagnosis")}
          </Button>
        }
      >
        {record.diagnoses.length === 0 ? (
          <p className="py-6 text-center text-small text-ink-faint">
            {t("records.noDiagnoses")}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {record.diagnoses.map((d) => {
              const clinician = doctorProfileById(d.clinicianId);
              const meta = DIAGNOSIS_STATUS_META[d.status];
              return (
                <li key={d.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-ink-soft">
                      {d.code}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-small font-medium text-ink">
                      {d.label}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                        meta.chip
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {d.site && (
                    <p className="mt-1 text-[0.75rem] text-ink-muted">{d.site}</p>
                  )}
                  {d.note && (
                    <p className="mt-1 text-[0.75rem] leading-[1.15rem] text-ink-soft">
                      {d.note}
                    </p>
                  )}
                  <p className="mt-1.5 flex items-center gap-1.5 text-[0.6875rem] text-ink-faint">
                    <UserRound className="size-3" />
                    Recorded by {clinician?.name ?? "a clinician"} on{" "}
                    {fmtDate(d.recordedOn)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <AssistantObservations
        suggestions={record.suggestions}
        patientName={patient.name}
      />
    </div>
  );
}

function AccessLogTab({ record }: { record: ClinicalRecord }) {
  const { t } = useI18n();
  const { can } = useRole();
  if (!can("records.audit.view")) {
    return (
      <Panel title={t("records.accessLog")}>
        <p className="flex items-center justify-center gap-2 py-6 text-small text-ink-muted">
          <Lock className="size-4" />
          {t("records.noLogAccess")}
        </p>
      </Panel>
    );
  }
  return (
    <Panel title={t("records.whoOpened")}>
      <ul className="divide-y divide-line">
        {record.access.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-muted">
              <History className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-small text-ink">
                {a.actor}
              </span>
              <span className="block truncate text-[0.75rem] text-ink-muted">
                {a.action}
              </span>
            </span>
            <RoleChip role={a.role} />
            <span className="w-24 shrink-0 text-end text-[0.75rem] tabular-nums text-ink-faint">
              {fmtDate(a.at)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-[0.75rem] text-ink-faint">
        Every access to a clinical record is logged. This sample log is
        illustrative; real entries are written server-side.
      </p>
    </Panel>
  );
}

export function RecordWorkspace({
  patient,
  record,
  appointments,
}: {
  patient: PatientRecord;
  record: ClinicalRecord;
  appointments: Appointment[];
}) {
  const { t } = useI18n();
  const { role, can } = useRole();
  const toast = useToast();
  const [chart, setChart] = React.useState<ToothRecord[]>(patient.chart);

  const findings = chart.filter((t) => t.condition !== "healthy").length;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/medical-records">
          <ArrowLeft className="rtl:rotate-180" />
          {t("records.all")}
        </Link>
      </Button>

      <EnforcementNotice />

      <AccessGate permission="records.view" what={t("records.title")}>
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-4 bg-[linear-gradient(104deg,var(--color-surface)_0%,var(--color-canvas)_60%,var(--color-forest-50)_100%)] p-5 md:flex-row md:items-center">
              <Avatar
                src={patient.avatar}
                name={patient.name}
                size="xl"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-title text-ink">{patient.name}</h1>
                  {patient.allergies.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-status-cancelled-bg px-2 py-0.5 text-[0.75rem] font-medium text-status-cancelled">
                      <AlertTriangle className="size-3" />
                      {t("records.allergyOnFile")}
                    </span>
                  )}
                  {record.consentOutstanding && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-status-pending-bg px-2 py-0.5 text-[0.75rem] font-medium text-status-pending">
                      <FileSignature className="size-3" />
                      {t("records.consentUnsignedShort")}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
                  <span className="tabular-nums">{patient.ref}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {patient.gender}, {patient.age}
                  </span>
                  <span aria-hidden>·</span>
                  <span>Last visit {fmtDate(patient.lastVisit)}</span>
                </p>
                <p className="mt-1 text-[0.75rem] text-ink-faint">
                  {record.diagnoses.length} diagnosis
                  {record.diagnoses.length === 1 ? "" : "es"} · {findings} chart
                  finding{findings === 1 ? "" : "s"} ·{" "}
                  {patient.documents.length} document
                  {patient.documents.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <RoleSwitcher />
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={t("records.exportRecord")}
                  disabled={!can("records.export")}
                  onClick={() =>
                    toast({
                      tone: "info",
                      title: t("records.exportNeedsBackend"),
                      detail: t("records.exportBody"),
                    })
                  }
                >
                  <Download />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={t("patients.printRecord")}
                  disabled={!can("records.export")}
                  onClick={() =>
                    toast({
                      tone: "info",
                      title: t("patients.printNeedsBackend"),
                      detail: t("records.nothingProduced"),
                    })
                  }
                >
                  <Printer />
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
            <div className="space-y-4">
              <SafetyRail patient={patient} />
              <Panel title={t("records.yourAccess")}>
                <p className="text-small text-ink">{t(ROLE_META[role].labelKey)}</p>
                <p className="mt-1 text-[0.75rem] leading-[1.15rem] text-ink-muted">
                  {t(ROLE_META[role].descriptionKey)}
                </p>
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {[
                    ["records.chart.edit", "Record chart findings"],
                    ["records.notes.add", "Write clinical notes"],
                    ["records.diagnosis.confirm", "Record diagnoses"],
                    ["records.export", t("records.exportTheRecord")],
                    ["records.audit.view", t("records.viewAccessLog")],
                  ].map(([perm, label]) => {
                    const allowed = can(perm as never);
                    return (
                      <li
                        key={perm}
                        className="flex items-center gap-2 text-[0.75rem]"
                      >
                        <span
                          className={cn(
                            "flex size-4 items-center justify-center rounded-full",
                            allowed
                              ? "bg-status-completed-bg text-status-completed"
                              : "bg-surface-sunken text-ink-faint"
                          )}
                        >
                          {allowed ? (
                            <ShieldCheck className="size-2.5" />
                          ) : (
                            <Lock className="size-2.5" />
                          )}
                        </span>
                        <span
                          className={allowed ? "text-ink-soft" : "text-ink-faint"}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>

            {/* min-w-0: as a grid child this would otherwise size to the
                widest tab strip and push the whole page sideways. */}
            <Tabs defaultValue="diagnoses" className="min-w-0">
              <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
                <TabsList className="w-max">
                  <TabsTrigger value="diagnoses">{t("records.diagnoses")}</TabsTrigger>
                  <TabsTrigger value="chart">{t("patients.tab.chart")}</TabsTrigger>
                  <TabsTrigger value="history">{t("patients.tab.history")}</TabsTrigger>
                  <TabsTrigger value="notes">{t("records.clinicalNotes")}</TabsTrigger>
                  <TabsTrigger value="imaging">{t("records.imaging")}</TabsTrigger>
                  <TabsTrigger value="treatment">{t("patients.treatmentHistory")}</TabsTrigger>
                  <TabsTrigger value="access">{t("records.accessLog")}</TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-4">
                <TabsContent value="diagnoses">
                  <DiagnosesTab record={record} patient={patient} />
                </TabsContent>

                <TabsContent value="chart">
                  <Panel title={t("patients.tab.chart")}>
                    {!can("records.chart.edit") && (
                      <p className="mb-3 flex items-center gap-2 rounded-field border border-line bg-canvas px-3 py-2 text-[0.75rem] text-ink-muted">
                        <Lock className="size-3.5" />
                        {t("records.readOnly")}
                      </p>
                    )}
                    <DentalChart
                      chart={chart}
                      onChange={setChart}
                      readOnly={!can("records.chart.edit")}
                    />
                  </Panel>
                </TabsContent>

                <TabsContent value="history">
                  <MedicalHistoryTab patient={patient} />
                </TabsContent>

                <TabsContent value="notes">
                  {can("records.notes.add") ? (
                    <NotesTab patient={patient} />
                  ) : (
                    <Panel title={t("records.clinicalNotes")}>
                      <p className="flex items-center justify-center gap-2 py-6 text-small text-ink-muted">
                        <Lock className="size-4" />
                        {t("records.noNotesAccess")}
                      </p>
                    </Panel>
                  )}
                </TabsContent>

                <TabsContent value="imaging">
                  {can("records.documents.view") ? (
                    <DocumentsTab patient={patient} />
                  ) : (
                    <Panel title={t("records.imaging")}>
                      <p className="flex items-center justify-center gap-2 py-6 text-small text-ink-muted">
                        <Lock className="size-4" />
                        {t("records.noImagingAccess")}
                      </p>
                    </Panel>
                  )}
                </TabsContent>

                <TabsContent value="treatment">
                  <AppointmentsTab appointments={appointments} />
                </TabsContent>

                <TabsContent value="access">
                  <AccessLogTab record={record} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </AccessGate>
    </div>
  );
}
