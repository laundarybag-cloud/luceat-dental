"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  Mail,
  Phone,
  Printer,
  AlertTriangle,
} from "lucide-react";
import type { Appointment } from "@/lib/types";
import type { PatientRecord } from "@/lib/mock/patients";
import { PATIENT_STATUS_META } from "@/lib/mock/patients";
import type { ToothRecord } from "@/lib/dental";
import { doctorById } from "@/lib/mock/clinic";
import { patientBalance } from "@/lib/mock/billing";
import { cn, formatMoney } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { DentalChart } from "./dental-chart";
import { fmtDate } from "./patients-register";
import {
  AppointmentsTab,
  DocumentsTab,
  MedicalHistoryTab,
  NotesTab,
  OverviewTab,
  PaymentsTab,
  Panel,
  PrescriptionsTab,
  TreatmentPlansTab,
} from "./profile-tabs";
import { useI18n } from "@/components/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n";

const TABS: { value: string; labelKey: MessageKey }[] = [
  { value: "overview", labelKey: "patients.tab.overview" },
  { value: "history", labelKey: "patients.tab.history" },
  { value: "appointments", labelKey: "patients.tab.appointments" },
  { value: "chart", labelKey: "patients.tab.chart" },
  { value: "plans", labelKey: "patients.tab.plans" },
  { value: "prescriptions", labelKey: "patients.tab.prescriptions" },
  { value: "documents", labelKey: "patients.tab.documents" },
  { value: "payments", labelKey: "patients.tab.payments" },
  { value: "notes", labelKey: "patients.tab.notes" },
];

export function PatientProfile({
  patient,
  appointments,
}: {
  patient: PatientRecord;
  appointments: Appointment[];
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [chart, setChart] = React.useState<ToothRecord[]>(patient.chart);
  const doctor = doctorById(patient.primaryDoctorId);
  const meta = PATIENT_STATUS_META[patient.status];
  // Must match what the Clinical alerts panel actually lists, medications
  // included — a header saying "0 alerts" above a listed drug is a lie.
  const alerts =
    patient.allergies.length +
    patient.conditions.length +
    patient.medications.length;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/patients">
          <ArrowLeft className="rtl:rotate-180" />
          {t("patients.all")}
        </Link>
      </Button>

      {/* Patient header */}
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
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                  meta.chip
                )}
              >
                {t(meta.labelKey)}
              </span>
              {patient.allergies.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-status-cancelled-bg px-2 py-0.5 text-[0.75rem] font-medium text-status-cancelled">
                  <AlertTriangle className="size-3" />
                  {t("patients.allergyOnFile")}
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
              <span dir="ltr" className="tabular-nums">
                {patient.phone}
              </span>
              <span aria-hidden className="hidden sm:inline">
                ·
              </span>
              <span className="hidden truncate sm:inline">{patient.email}</span>
            </p>
            <p className="mt-1 text-[0.75rem] text-ink-faint">
              Last visit {fmtDate(patient.lastVisit)} · Primary clinician{" "}
              {doctor?.name} · {alerts} clinical alert
              {alerts === 1 ? "" : "s"}
              {patientBalance(patient.id) > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-status-pending">
                    {formatMoney(patientBalance(patient.id))} outstanding
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="primary" size="md" asChild>
              <Link href="/appointments">
                <CalendarPlus />
                {t("patients.book")}
              </Link>
            </Button>
            <Button variant="secondary" size="icon" aria-label={t("patients.callPatient")} asChild>
              <a href={`tel:${patient.phone.replace(/\s/g, "")}`}>
                <Phone />
              </a>
            </Button>
            <Button variant="secondary" size="icon" aria-label={t("patients.emailPatient")} asChild>
              <a href={`mailto:${patient.email}`}>
                <Mail />
              </a>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label={t("patients.printRecord")}
              onClick={() =>
                toast({
                  tone: "info",
                  title: t("patients.printNeedsBackend"),
                  detail: t("patients.printNeedsBackendBody"),
                })
              }
            >
              <Printer />
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="overview">
            <OverviewTab patient={patient} appointments={appointments} />
          </TabsContent>
          <TabsContent value="history">
            <MedicalHistoryTab patient={patient} />
          </TabsContent>
          <TabsContent value="appointments">
            <AppointmentsTab appointments={appointments} />
          </TabsContent>
          <TabsContent value="chart">
            <Panel title={t("patients.tab.chart")}>
              <DentalChart chart={chart} onChange={setChart} />
            </Panel>
          </TabsContent>
          <TabsContent value="plans">
            <TreatmentPlansTab patient={patient} />
          </TabsContent>
          <TabsContent value="prescriptions">
            <PrescriptionsTab patient={patient} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab patient={patient} />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsTab patient={patient} />
          </TabsContent>
          <TabsContent value="notes">
            <NotesTab patient={patient} />
          </TabsContent>
        </div>
      </Tabs>

      <p className="text-[0.75rem] text-ink-muted">
        Sample clinical record held in this browser session. Nothing is stored
        or transmitted, and no entry here constitutes a diagnosis.
      </p>
    </div>
  );
}
