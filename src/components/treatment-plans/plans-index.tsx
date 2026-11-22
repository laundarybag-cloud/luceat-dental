"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, SearchX } from "lucide-react";
import { planIndex, type PlanIndexEntry } from "@/lib/mock/treatment-plans";
import { doctorProfiles } from "@/lib/mock/doctors";
import { PLAN_STATUS_META } from "@/lib/treatment";
import { cn, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, Progress } from "@/components/ui/primitives";
import { fmtDate } from "@/components/patients/patients-register";
import { PlanBuilderDialog } from "./plan-builder";
import { useI18n } from "@/components/i18n/locale-context";

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

export function PlansIndex() {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [doctor, setDoctor] = React.useState("all");
  const [builderOpen, setBuilderOpen] = React.useState(false);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return planIndex.filter((e) => {
      if (status !== "all" && e.summary.status !== status) return false;
      if (doctor !== "all" && e.plan.doctorId !== doctor) return false;
      if (
        q &&
        !e.patient.name.toLowerCase().includes(q) &&
        !e.plan.title.toLowerCase().includes(q) &&
        !e.patient.ref.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, status, doctor]);

  const value = planIndex.reduce((sum, e) => sum + e.summary.total, 0);
  const outstanding = planIndex.reduce((sum, e) => sum + e.summary.remaining, 0);
  const stalled = planIndex.filter((e) => e.summary.status === "stalled").length;
  const unscheduled = planIndex.reduce(
    (sum, e) => sum + e.summary.unscheduled,
    0
  );

  const columns: Column<PlanIndexEntry>[] = [
    {
      id: "patient",
      header: t("col.patientAndPlan"),
      sortBy: (e) => e.patient.name,
      cell: (e) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={e.patient.avatar} name={e.patient.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {e.patient.name}
            </span>
            <span className="block truncate text-[0.75rem] text-ink-faint">
              {e.plan.title}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "doctor",
      header: t("appt.form.clinician"),
      hideBelow: "lg",
      sortBy: (e) => e.doctorName,
      cell: (e) => (
        <span className="flex items-center gap-2">
          <Avatar src={e.doctorAvatar} name={e.doctorName} size="xs" />
          <span className="truncate">
            {e.doctorName.replace("Dr. ", "Dr ")}
          </span>
        </span>
      ),
    },
    {
      id: "progress",
      header: t("col.progress"),
      sortBy: (e) => e.summary.progress,
      cell: (e) => (
        <span className="flex items-center gap-2">
          <Progress value={e.summary.progress} className="w-16" />
          <span className="w-16 shrink-0 text-[0.75rem] tabular-nums text-ink-muted">
            {e.summary.completed}/{e.summary.sessions}
          </span>
        </span>
      ),
    },
    {
      id: "unscheduled",
      header: t("col.toBook"),
      align: "end",
      hideBelow: "md",
      sortBy: (e) => e.summary.unscheduled,
      cell: (e) => (
        <span
          className={cn(
            "tabular-nums",
            e.summary.unscheduled ? "font-semibold text-status-pending" : "text-ink-faint"
          )}
        >
          {e.summary.unscheduled || "—"}
        </span>
      ),
    },
    {
      id: "value",
      header: t("col.value"),
      align: "end",
      hideBelow: "sm",
      sortBy: (e) => e.summary.total,
      cell: (e) => (
        <span className="font-semibold tabular-nums text-ink">
          {formatMoney(e.summary.total)}
        </span>
      ),
    },
    {
      id: "remaining",
      header: t("col.toInvoice"),
      align: "end",
      hideBelow: "xl",
      sortBy: (e) => e.summary.remaining,
      cell: (e) => (
        <span className="tabular-nums text-ink-muted">
          {formatMoney(e.summary.remaining)}
        </span>
      ),
    },
    {
      id: "created",
      header: t("col.created"),
      hideBelow: "xl",
      sortBy: (e) => e.plan.created,
      cell: (e) => (
        <span className="tabular-nums">{fmtDate(e.plan.created)}</span>
      ),
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (e) => e.summary.status,
      cell: (e) => {
        const meta = PLAN_STATUS_META[e.summary.status];
        return (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-5",
              meta.chip
            )}
          >
            {t(meta.labelKey)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink">{t("plans.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("plans.subtitle", {
              count: fmt.number(planIndex.length),
              clinicians: fmt.number(
                new Set(planIndex.map((e) => e.plan.doctorId)).size
              ),
            })}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setBuilderOpen(true)}>
          <Plus />
          {t("plans.new")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t("plans.planValue")}
          value={formatMoney(value)}
          hint={t("plans.agreedAcross")}
        />
        <Stat
          label={t("plans.stillToInvoice")}
          value={formatMoney(outstanding)}
          hint={t("plans.sessionsNotDelivered")}
        />
        <Stat
          label={t("plans.needsScheduling")}
          value={String(stalled)}
          hint={
            stalled
              ? t("plans.startedNothingNext")
              : t("empty.everyPlanHasNext")
          }
        />
        <Stat
          label={t("plans.sessionsToBook")}
          value={String(unscheduled)}
          hint={t("plans.acrossEvery")}
        />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("plans.searchPlaceholder")}
              className="ps-9"
              aria-label={t("plans.search")}
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              { value: "not_started", label: t("plans.notStarted") },
              { value: "in_progress", label: t("plans.inProgress") },
              { value: "stalled", label: t("plans.needsScheduling") },
              { value: "completed", label: t("status.completed") },
            ]}
          />
          <Select
            value={doctor}
            onValueChange={setDoctor}
            ariaLabel="Filter by clinician"
            options={[
              { value: "all", label: t("appt.allClinicians") },
              ...doctorProfiles.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(e) => e.plan.id}
          onRowClick={(e) => router.push(`/treatment-plans/${e.plan.id}`)}
          caption={t("plans.title")}
          pageSize={10}
          empty={
            <EmptyState
              illustration={
                <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                  <SearchX className="size-5 text-forest-400" />
                </span>
              }
              title={t("plans.empty.title")}
              description={t("plans.empty.body")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setDoctor("all");
                  }}
                >
                  {t("appt.clearFilters")}
                </Button>
              }
            />
          }
        />
      </Card>

      <p className="text-[0.75rem] text-ink-muted">
        Plan values are the sum of catalogue prices for each sequenced service,
        so a price change in Services is reflected here.
      </p>

      <PlanBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} />
    </div>
  );
}
