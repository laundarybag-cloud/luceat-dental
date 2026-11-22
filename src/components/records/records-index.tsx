"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileSignature,
  Pill,
  Search,
  SearchX,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { patientRecords } from "@/lib/mock/patients";
import { clinicalRecords, recordFor } from "@/lib/mock/records";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, Tooltip } from "@/components/ui/primitives";
import { fmtDate } from "@/components/patients/patients-register";
import { RoleSwitcher } from "@/components/access/role-context";
import { AccessGate, EnforcementNotice } from "./access-gate";
import { useI18n } from "@/components/i18n/locale-context";

type Row = (typeof patientRecords)[number];

function Flag({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "danger" | "warning" | "info" | "brand";
}) {
  return (
    <Tooltip content={label}>
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-md [&_svg]:size-3.5",
          tone === "danger" && "bg-status-cancelled-bg text-status-cancelled",
          tone === "warning" && "bg-status-pending-bg text-status-pending",
          tone === "info" && "bg-status-checkedin-bg text-status-checkedin",
          tone === "brand" && "bg-status-progress-bg text-status-progress"
        )}
        aria-label={label}
      >
        {icon}
      </span>
    </Tooltip>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-[0.75rem] text-ink-muted">{label}</p>
      <p data-metric className="mt-0.5 text-title text-ink">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">{hint}</p>
    </div>
  );
}

export function RecordsIndex() {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return patientRecords.filter((p) => {
      const rec = recordFor(p.id);
      if (filter === "allergies" && p.allergies.length === 0) return false;
      if (filter === "suggestions" && !rec?.suggestions.length) return false;
      if (filter === "consent" && !rec?.consentOutstanding) return false;
      if (filter === "active" && !rec?.diagnoses.some((d) => d.status === "active"))
        return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.ref.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [query, filter]);

  const withAllergies = patientRecords.filter((p) => p.allergies.length).length;
  const pendingSuggestions = clinicalRecords.filter(
    (r) => r.suggestions.length
  ).length;
  const consent = clinicalRecords.filter((r) => r.consentOutstanding).length;

  const columns: Column<Row>[] = [
    {
      id: "name",
      header: t("col.patient"),
      sortBy: (p) => p.name,
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={p.avatar} name={p.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{p.name}</span>
            <span className="block truncate text-[0.75rem] tabular-nums text-ink-faint">
              {p.ref}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "flags",
      header: t("col.clinicalFlags"),
      cell: (p) => {
        const rec = recordFor(p.id);
        const flags: React.ReactNode[] = [];
        if (p.allergies.length)
          flags.push(
            <Flag
              key="al"
              tone="danger"
              icon={<AlertTriangle />}
              label={`Allergy: ${p.allergies.map((a) => a.substance).join(", ")}`}
            />
          );
        if (p.medications.length)
          flags.push(
            <Flag
              key="med"
              tone="info"
              icon={<Pill />}
              label={`${p.medications.length} current medication(s)`}
            />
          );
        if (rec?.diagnoses.some((d) => d.status === "active"))
          flags.push(
            <Flag
              key="dx"
              tone="warning"
              icon={<Stethoscope />}
              label={t("records.activeDiagnosis")}
            />
          );
        if (rec?.consentOutstanding)
          flags.push(
            <Flag
              key="cons"
              tone="warning"
              icon={<FileSignature />}
              label={t("records.consentUnsigned")}
            />
          );
        if (rec?.suggestions.length)
          flags.push(
            <Flag
              key="ai"
              tone="brand"
              icon={<Sparkles />}
              label={t("records.obsAwaitingClinician")}
            />
          );
        return flags.length ? (
          <span className="flex items-center gap-1.5">{flags}</span>
        ) : (
          <span className="text-ink-faint">{t("common.none")}</span>
        );
      },
    },
    {
      id: "diagnoses",
      header: t("records.diagnoses"),
      hideBelow: "lg",
      sortBy: (p) => recordFor(p.id)?.diagnoses.length ?? 0,
      cell: (p) => {
        const dx = recordFor(p.id)?.diagnoses ?? [];
        return dx.length ? (
          <span className="block min-w-0">
            <span className="block truncate">{dx[0].label}</span>
            {dx.length > 1 && (
              <span className="block text-[0.75rem] text-ink-faint">
                +{dx.length - 1} more
              </span>
            )}
          </span>
        ) : (
          <span className="text-ink-faint">{t("records.noneRecorded")}</span>
        );
      },
    },
    {
      id: "chart",
      header: t("col.chartFindings"),
      align: "end",
      hideBelow: "xl",
      sortBy: (p) => p.chart.filter((t) => t.condition !== "healthy").length,
      cell: (p) => (
        <span className="tabular-nums">
          {p.chart.filter((t) => t.condition !== "healthy").length}
        </span>
      ),
    },
    {
      id: "updated",
      header: t("col.lastVisit"),
      hideBelow: "md",
      sortBy: (p) => p.lastVisit ?? "",
      cell: (p) => <span className="tabular-nums">{fmtDate(p.lastVisit)}</span>,
    },
    {
      id: "open",
      header: "",
      align: "end",
      cell: (p) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/medical-records/${p.id}`)}
        >
          {t("records.open")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink">{t("records.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("records.subtitle", {
              count: fmt.number(patientRecords.length),
            })}
          </p>
        </div>
        <RoleSwitcher />
      </div>

      <EnforcementNotice />

      <AccessGate permission="records.view" what={t("records.title")}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label={t("records.short")}
              value={String(patientRecords.length)}
              hint={t("records.everyPatient")}
            />
            <Stat
              label={t("records.allergyAlerts")}
              value={String(withAllergies)}
              hint={t("records.checkedBefore")}
            />
            <Stat
              label={t("records.consentOutstanding")}
              value={String(consent)}
              hint={t("records.imagingNeedsConsent")}
            />
            <Stat
              label={t("records.awaitingReview")}
              value={String(pendingSuggestions)}
              hint={t("records.obsNotDiagnoses")}
            />
          </div>

          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("records.searchPlaceholder")}
                  className="ps-9"
                  aria-label={t("records.search")}
                />
              </div>
              <Select
                value={filter}
                onValueChange={setFilter}
                ariaLabel="Filter records"
                options={[
                  { value: "all", label: t("records.all") },
                  { value: "active", label: t("records.hasDiagnosis") },
                  { value: "allergies", label: t("records.hasAllergy") },
                  { value: "consent", label: t("records.consentOutstanding") },
                  {
                    value: "suggestions",
                    label: t("records.obsAwaitingReview"),
                  },
                ]}
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <DataTable
              rows={rows}
              columns={columns}
              getRowId={(p) => p.id}
              onRowClick={(p) => router.push(`/medical-records/${p.id}`)}
              caption={t("records.title")}
              pageSize={10}
              empty={
                <EmptyState
                  illustration={
                    <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                      <SearchX className="size-5 text-forest-400" />
                    </span>
                  }
                  title={t("records.empty.title")}
                  description={t("records.empty.body")}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setQuery("");
                        setFilter("all");
                      }}
                    >
                      {t("appt.clearFilters")}
                    </Button>
                  }
                />
              }
            />
          </Card>
        </div>
      </AccessGate>
    </div>
  );
}
