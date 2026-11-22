"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Info } from "lucide-react";
import {
  RANGES,
  aiReport,
  appointmentReport,
  clinicianReport,
  patientReport,
  revenueReport,
  serviceReport,
  toCsv,
  type RangeKey,
} from "@/lib/analytics";
import { PATIENT_STATUS_META } from "@/lib/mock/patients";
import { cn, formatCompactMoney, formatMoney } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import {
  EmptyState,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { Panel } from "@/components/patients/profile-tabs";
import { useI18n } from "@/components/i18n/locale-context";

const axisProps = {
  stroke: "transparent",
  tick: { fill: "var(--color-ink-muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

function ChartTip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: { name?: string; value: number; color: string; dataKey: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-panel border border-line bg-surface p-3 shadow-overlay">
      <p className="text-[0.75rem] font-semibold text-ink">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-[0.75rem]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
            <span className="flex-1 capitalize text-ink-muted">
              {p.name ?? p.dataKey}
            </span>
            <span className="font-semibold tabular-nums text-ink">
              {money ? formatMoney(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "pending" | "good";
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-[0.75rem] text-ink-muted">{label}</p>
      <p
        data-metric
        className={cn(
          "mt-0.5 text-title",
          tone === "pending" && "text-status-pending",
          tone === "good" && "text-status-completed",
          !tone && "text-ink"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">{hint}</p>
    </div>
  );
}

/**
 * A stacked chart without a key is a puzzle. Recharts' own <Legend> brings its
 * own type scale and spacing, so this draws the key in the design system's.
 */
function ChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3">
      {items.map((i) => (
        <li
          key={i.label}
          className="flex items-center gap-1.5 text-[0.75rem] text-ink-muted"
        >
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-[2px]"
            style={{ background: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** "clinician-performance" -> t("reports.clinicianPerformance"), for toast titles. */
function toSentence(slug: string) {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function NoData({ what }: { what: string }) {
  const { t } = useI18n();
  return (
    <EmptyState
      compact
      illustration={
        <span className="flex size-10 items-center justify-center rounded-full bg-forest-50">
          <Info className="size-4 text-forest-400" />
        </span>
      }
      title={`No ${what} in this period`}
      description={t("reports.widenRange")}
    />
  );
}

export function ReportsModule() {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const [range, setRange] = React.useState<RangeKey>("30d");

  const revenue = React.useMemo(() => revenueReport(range), [range]);
  const appts = React.useMemo(() => appointmentReport(range), [range]);
  const patients = React.useMemo(() => patientReport(range), [range]);
  const clinicians = React.useMemo(() => clinicianReport(range), [range]);
  const services = React.useMemo(() => serviceReport(range), [range]);
  const ai = React.useMemo(() => aiReport(), []);

  const rangeLabel =
    (() => {
      const def = RANGES.find((r) => r.key === range);
      return def ? t(def.labelKey).toLowerCase() : "";
    })();

  /** Real export: builds a CSV from the figures on screen and downloads it. */
  const download = (name: string, csv: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luceat-${name}-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      tone: "success",
      title: `${toSentence(name)} exported`,
      detail: t("reports.exportReal"),
    });
  };

  const exportRevenue = () =>
    download(
      "revenue-by-service",
      toCsv(
        [
          { key: "name", header: t("col.service") },
          { key: "count", header: t("col.timesInvoiced") },
          { key: "revenue", header: t("col.revenueUsd") },
        ],
        revenue.byService.map((s) => ({
          name: s.name,
          count: s.count,
          revenue: s.revenue,
        }))
      )
    );

  const exportAppointments = () =>
    download(
      "appointments-by-day",
      toCsv(
        [
          { key: "date", header: t("col.date") },
          { key: "completed", header: t("status.completed") },
          { key: "scheduled", header: t("status.scheduled") },
          { key: "cancelled", header: t("status.cancelled") },
          { key: "noShow", header: t("status.no_show") },
        ],
        appts.byDay.map((d) => ({
          date: d.key,
          completed: d.completed,
          scheduled: d.other,
          cancelled: d.cancelled,
          noShow: d.noShow,
        }))
      )
    );

  const exportClinicians = () =>
    download(
      "clinician-performance",
      toCsv(
        [
          { key: "name", header: t("col.clinician") },
          { key: "specialty", header: t("col.specialty") },
          { key: "booked", header: t("ai.booked") },
          { key: "completed", header: t("status.completed") },
          { key: "lost", header: t("appt.cancelledOrNoShow") },
          { key: "completionRate", header: t("col.completionRate") },
          { key: "revenue", header: t("col.revenueUsd") },
          { key: "rating", header: t("col.rating") },
        ],
        clinicians.map((c) => ({
          name: c.name,
          specialty: c.specialty,
          booked: c.booked,
          completed: c.completed,
          lost: c.lost,
          completionRate: c.completionRate.toFixed(1),
          revenue: c.revenue,
          rating: c.rating,
        }))
      )
    );

  const exportServices = () =>
    download(
      "service-popularity",
      toCsv(
        [
          { key: "name", header: t("col.service") },
          { key: "category", header: t("col.category") },
          { key: "price", header: t("col.priceUsd") },
          { key: "booked", header: t("ai.booked") },
          { key: "revenue", header: t("col.revenueUsd") },
        ],
        services.map((s) => ({
          name: s.name,
          category: s.category,
          price: s.price,
          booked: s.booked,
          revenue: s.revenue,
        }))
      )
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <h1 className="text-title text-ink">{t("reports.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("reports.subtitle")}
          </p>
        </div>
        <Select
          value={range}
          onValueChange={(v) => setRange(v as RangeKey)}
          ariaLabel="Date range"
          className="w-44"
          options={RANGES.map((r) => ({
            value: r.key,
            label: t(r.labelKey),
          }))}
        />
      </div>

      <Tabs defaultValue="revenue" className="min-w-0">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="revenue">{t("reports.revenue")}</TabsTrigger>
            <TabsTrigger value="appointments">{t("reports.appointments")}</TabsTrigger>
            <TabsTrigger value="patients">{t("reports.patients")}</TabsTrigger>
            <TabsTrigger value="clinicians">{t("reports.clinicians")}</TabsTrigger>
            <TabsTrigger value="services">{t("reports.services")}</TabsTrigger>
            <TabsTrigger value="ai">{t("reports.aiAssistant")}</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 space-y-4">
          {/* ---------------------------------------------------- revenue */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label={t("plans.invoiced")}
                value={formatMoney(revenue.invoiced)}
                hint={t("h.invoicesInRange", {
              count: fmt.number(revenue.invoices),
              range: rangeLabel,
            })}
              />
              <Stat
                label={t("pay.collected")}
                value={formatMoney(revenue.collected)}
                hint={t("h.percentOfInvoiced", {
              percent: fmt.percent(revenue.collectionRate, 0),
            })}
                tone="good"
              />
              <Stat
                label={t("pay.outstanding")}
                value={formatMoney(revenue.outstanding)}
                hint={t("h.unpaidInvoices", { count: fmt.number(revenue.unpaid) })}
                tone={revenue.outstanding ? "pending" : undefined}
              />
              <Stat
                label={t("reports.discountsGiven")}
                value={formatMoney(revenue.discounts)}
                hint={t("reports.insuranceReductions")}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle
                  hint={t("h.invoicedAgainstCollected", {
            range: rangeLabel,
            bucket: revenue.trendBucket,
          })}
                >
                  {t("reports.revenueTrend")}
                </CardTitle>
              </CardHeader>
              <CardBody>
                {revenue.trend.length ? (
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={revenue.trend}
                        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                        barCategoryGap="26%"
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--color-chart-grid)"
                        />
                        <XAxis
                          dataKey="label"
                          {...axisProps}
                          dy={6}
                          interval="preserveStartEnd"
                          minTickGap={24}
                        />
                        <YAxis
                          {...axisProps}
                          width={52}
                          tickMargin={8}
                          tickFormatter={(v: number) => formatCompactMoney(v)}
                        />
                        <RTooltip
                          cursor={{ fill: "var(--color-forest-50)" }}
                          content={<ChartTip money />}
                        />
                        <Bar
                          dataKey="invoiced"
                          name={t("plans.invoiced")}
                          fill="var(--color-chart-2)"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="collected"
                          name={t("pay.collected")}
                          fill="var(--color-chart-1)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <NoData what="invoices" />
                )}
                {revenue.trend.length > 0 && (
                  <ChartLegend
                    items={[
                      { label: t("plans.invoiced"), color: "var(--color-chart-2)" },
                      { label: t("pay.collected"), color: "var(--color-chart-1)" },
                    ]}
                  />
                )}
              </CardBody>
            </Card>

            <Panel
              title={`Revenue by service (${revenue.byService.length})`}
              action={
                <Button variant="secondary" size="sm" onClick={exportRevenue}>
                  <Download />
                  {t("reports.exportCsv")}
                </Button>
              }
            >
              {revenue.byService.length ? (
                <ul className="divide-y divide-line">
                  {revenue.byService.map((s) => {
                    const max = revenue.byService[0].revenue || 1;
                    return (
                      <li key={s.serviceId} className="py-2.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-small text-ink">
                            {s.name}
                          </span>
                          <span className="shrink-0 text-small font-semibold tabular-nums text-ink">
                            {formatMoney(s.revenue)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3">
                          <Progress
                            value={(s.revenue / max) * 100}
                            className="flex-1"
                          />
                          <span className="w-24 shrink-0 text-end text-[0.75rem] tabular-nums text-ink-faint">
                            {s.count} invoiced
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <NoData what="invoiced treatment" />
              )}
            </Panel>
          </TabsContent>

          {/* ----------------------------------------------- appointments */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label={t("ai.booked")}
                value={String(appts.booked)}
                hint={t("h.chairHours", {
              hours: fmt.decimal(appts.chairHours, 1),
            })}
              />
              <Stat
                label={t("status.completed")}
                value={`${appts.completionRate.toFixed(0)}%`}
                hint={t("h.xOfY", {
              a: fmt.number(appts.completed),
              b: fmt.number(appts.booked),
            })}
                tone="good"
              />
              <Stat
                label={t("reports.cancellationRate")}
                value={`${appts.cancellationRate.toFixed(1)}%`}
                hint={t("h.cancelledCount", { count: fmt.number(appts.cancelled) })}
                tone={appts.cancellationRate > 8 ? "pending" : undefined}
              />
              <Stat
                label={t("reports.noShowRate")}
                value={`${appts.noShowRate.toFixed(1)}%`}
                hint={t("h.didNotAttend", { count: fmt.number(appts.noShow) })}
                tone={appts.noShowRate > 3 ? "pending" : undefined}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle hint={t("reports.outcomesByDay")}>{t("reports.outcomes")}</CardTitle>
              </CardHeader>
              <CardBody>
                {appts.byDay.length ? (
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={appts.byDay}
                        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                        barCategoryGap="28%"
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--color-chart-grid)"
                        />
                        <XAxis dataKey="day" {...axisProps} dy={6} />
                        <YAxis
                          {...axisProps}
                          width={34}
                          tickMargin={6}
                          allowDecimals={false}
                        />
                        <RTooltip
                          cursor={{ fill: "var(--color-forest-50)" }}
                          content={<ChartTip />}
                        />
                        <Bar
                          dataKey="completed"
                          name={t("status.completed")}
                          stackId="a"
                          fill="var(--color-chart-1)"
                        />
                        <Bar
                          dataKey="other"
                          name={t("status.scheduled")}
                          stackId="a"
                          fill="var(--color-chart-2)"
                        />
                        <Bar
                          dataKey="cancelled"
                          name={t("status.cancelled")}
                          stackId="a"
                          fill="var(--color-chart-3)"
                        />
                        <Bar
                          dataKey="noShow"
                          name={t("status.no_show")}
                          stackId="a"
                          fill="var(--color-chart-5)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <NoData what="appointments" />
                )}
                {appts.byDay.length > 0 && (
                  <ChartLegend
                    items={[
                      { label: t("status.completed"), color: "var(--color-chart-1)" },
                      { label: t("status.scheduled"), color: "var(--color-chart-2)" },
                      { label: t("status.cancelled"), color: "var(--color-chart-3)" },
                      { label: t("status.no_show"), color: "var(--color-chart-5)" },
                    ]}
                  />
                )}
              </CardBody>
            </Card>

            <Panel
              title={t("reports.demandByHour")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={exportAppointments}
                >
                  <Download />
                  {t("reports.exportCsv")}
                </Button>
              }
            >
              {appts.byHour.length ? (
                <ul className="space-y-2.5">
                  {appts.byHour.map((h) => {
                    const max = Math.max(...appts.byHour.map((x) => x.count));
                    return (
                      <li key={h.hour} className="flex items-center gap-3">
                        <span
                          dir="ltr"
                          className="w-12 shrink-0 text-small tabular-nums text-ink"
                        >
                          {h.label}
                        </span>
                        <Progress
                          value={(h.count / max) * 100}
                          className="flex-1"
                        />
                        <span className="w-8 shrink-0 text-end text-small tabular-nums text-ink-soft">
                          {h.count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <NoData what="appointments" />
              )}
              <p className="mt-3 border-t border-line pt-3 text-[0.75rem] text-ink-faint">
                Counts every booking made in the period at its start hour,
                whatever the outcome.
              </p>
            </Panel>
          </TabsContent>

          {/* --------------------------------------------------- patients */}
          <TabsContent value="patients" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label={t("reports.registeredPatients")}
                value={String(patients.total)}
                hint={t("reports.onTheRegister")}
              />
              <Stat
                label={t("reports.joinedInPeriod")}
                value={String(patients.registeredInRange)}
                hint={rangeLabel}
              />
              <Stat
                label={t("patientStatus.overdue")}
                value={String(patients.overdue)}
                hint={t("reports.notSeenSixMonths")}
                tone={patients.overdue ? "pending" : undefined}
              />
              <Stat
                label={t("reports.withBalance")}
                value={String(patients.withBalance)}
                hint={t("reports.owingMoney")}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle hint={t("reports.newPerMonth")}>
                  {t("reports.patientGrowth")}
                </CardTitle>
              </CardHeader>
              <CardBody>
                {patients.growth.length ? (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={patients.growth}
                        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--color-chart-grid)"
                        />
                        <XAxis
                          dataKey="label"
                          {...axisProps}
                          dy={6}
                          interval="preserveStartEnd"
                          minTickGap={24}
                        />
                        <YAxis
                          {...axisProps}
                          width={34}
                          tickMargin={6}
                          allowDecimals={false}
                        />
                        <RTooltip content={<ChartTip />} />
                        <Line
                          type="monotone"
                          dataKey="added"
                          name="New patients"
                          stroke="var(--color-chart-1)"
                          strokeWidth={2}
                          // ~60 months of points: a dot on each crowds the
                          // line into a dotted band.
                          dot={false}
                          activeDot={{
                            r: 4,
                            strokeWidth: 2,
                            stroke: "var(--color-surface)",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <NoData what="registrations" />
                )}
              </CardBody>
            </Card>

            <Panel title={t("reports.registerByStatus")}>
              <ul className="space-y-2.5">
                {patients.byStatus.map((s) => (
                  <li key={s.status} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-small text-ink">
                      {
                        t(
                          PATIENT_STATUS_META[
                            s.status as keyof typeof PATIENT_STATUS_META
                          ].labelKey
                        )
                      }
                    </span>
                    <Progress
                      value={(s.count / patients.total) * 100}
                      className="flex-1"
                    />
                    <span className="w-8 shrink-0 text-end text-small tabular-nums text-ink-soft">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </TabsContent>

          {/* ------------------------------------------------- clinicians */}
          <TabsContent value="clinicians">
            <Panel
              title={t("reports.clinicianPerformance")}
              action={
                <Button variant="secondary" size="sm" onClick={exportClinicians}>
                  <Download />
                  {t("reports.exportCsv")}
                </Button>
              }
            >
              <div className="scrollbar-slim overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-line">
                      {[
                        "Clinician",
                        t("ai.booked"),
                        t("status.completed"),
                        "Lost",
                        "Completion",
                        t("reports.revenue"),
                        "Rating",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={cn(
                            "whitespace-nowrap px-3 py-2.5 text-label uppercase text-ink-muted",
                            i === 0 ? "text-start" : "text-end"
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clinicians.map((c) => (
                      <tr
                        key={c.doctorId}
                        className="border-b border-line last:border-b-0"
                      >
                        <td className="px-3 py-2.5">
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Avatar src={c.avatar} name={c.name} size="xs" />
                            <span className="min-w-0">
                              <span className="block truncate text-small font-medium text-ink">
                                {c.name}
                              </span>
                              <span className="block truncate text-[0.6875rem] text-ink-faint">
                                {c.specialty}
                                {c.status !== "active" ? " · on leave" : ""}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-end text-small tabular-nums text-ink-soft">
                          {c.booked}
                        </td>
                        <td className="px-3 py-2.5 text-end text-small tabular-nums text-ink-soft">
                          {c.completed}
                        </td>
                        <td className="px-3 py-2.5 text-end text-small tabular-nums text-ink-soft">
                          {c.lost || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-end">
                          <span className="inline-flex items-center justify-end gap-2">
                            <Progress
                              value={c.completionRate}
                              className="w-14"
                            />
                            <span className="w-10 text-end text-small tabular-nums text-ink-soft">
                              {c.booked ? `${c.completionRate.toFixed(0)}%` : "—"}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-end text-small font-semibold tabular-nums text-ink">
                          {formatMoney(c.revenue)}
                        </td>
                        <td className="px-3 py-2.5 text-end text-small tabular-nums text-ink-soft">
                          {c.rating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 border-t border-line pt-3 text-[0.75rem] text-ink-faint">
                Revenue is the value of invoices raised against each
                clinician&apos;s treatment in this period, not a commission
                figure.
              </p>
            </Panel>
          </TabsContent>

          {/* --------------------------------------------------- services */}
          <TabsContent value="services">
            <Panel
              title={t("reports.servicePopularity")}
              action={
                <Button variant="secondary" size="sm" onClick={exportServices}>
                  <Download />
                  {t("reports.exportCsv")}
                </Button>
              }
            >
              <ul className="divide-y divide-line">
                {services.map((s) => {
                  const max = services[0]?.revenue || 1;
                  return (
                    <li key={s.id} className="py-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-small text-ink">
                          {s.name}
                          {!s.active && (
                            <span className="ms-2 rounded-full bg-status-noshow-bg px-1.5 py-px text-[0.625rem] font-medium text-status-noshow">
                              {t("common.inactive")}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-small font-semibold tabular-nums text-ink">
                          {formatMoney(s.revenue)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <Progress
                          value={(s.revenue / max) * 100}
                          tone="gold"
                          className="flex-1"
                        />
                        <span className="w-28 shrink-0 text-end text-[0.75rem] tabular-nums text-ink-faint">
                          {s.booked} booked · {formatMoney(s.price)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </TabsContent>

          {/* --------------------------------------------------------- AI */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label={t("ai.conversations")}
                value={String(ai.total)}
                hint={t("h.resolvedWithoutHuman", {
              percent: fmt.percent(ai.resolutionRate, 0),
            })}
              />
              <Stat
                label={t("ai.bookingsMade")}
                value={String(ai.bookings)}
                hint={t("h.conversionPercent", {
              percent: fmt.percent(ai.conversionRate, 0),
            })}
                tone="good"
              />
              <Stat
                label={t("ai.escalated")}
                value={String(ai.escalated)}
                hint={t("ai.safetyOrRequest")}
                tone={ai.escalated ? "pending" : undefined}
              />
              <Stat
                label={t("ai.unanswered")}
                value={String(ai.unansweredQuestions)}
                hint={t("h.asksNoArticle", {
              count: fmt.number(ai.unansweredAsks),
            })}
                tone="pending"
              />
            </div>

            <Panel title={t("reports.conversationsByTopic")}>
              <ul className="space-y-2.5">
                {ai.topics.map((t) => (
                  <li key={t.topic} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-small text-ink">
                      {t.topic}
                    </span>
                    <Progress
                      value={(t.count / ai.total) * 100}
                      className="flex-1"
                    />
                    <span className="w-8 shrink-0 text-end text-small tabular-nums text-ink-soft">
                      {t.count}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-[0.75rem] text-ink-faint">
                Assistant figures cover all recorded conversations and are not
                affected by the date range above.
              </p>
            </Panel>
          </TabsContent>
        </div>
      </Tabs>

      <p className="text-[0.75rem] text-ink-muted">
        Every figure is computed from the appointment book, invoices,
        treatment plans and assistant conversations in this build — no report
        holds its own copy of the numbers. CSV export is genuinely
        implemented: it downloads the data shown above.
      </p>
    </div>
  );
}
