"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Info } from "lucide-react";
import {
  ageingBuckets,
  collected,
  discountsTotal,
  invoicedTotal,
  methodMix,
  monthlyTotals,
  outstanding,
  reconciliation,
  refundedTotal,
} from "@/lib/mock/billing";
import { cn, formatCompactMoney, formatMoney } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/primitives";
import { useI18n } from "@/components/i18n/locale-context";

const axisProps = {
  stroke: "transparent",
  tick: { fill: "var(--color-ink-muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
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
            <span className="flex-1 text-ink-muted">{p.name}</span>
            <span className="font-semibold tabular-nums text-ink">
              {formatMoney(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueOverview() {
  const { t, fmt } = useI18n();
  const months = monthlyTotals();
  const mix = methodMix();
  const buckets = ageingBuckets();
  const recon = reconciliation();
  const mixTotal = mix.reduce((s, m) => s + m.amount, 0);
  const collectionRate = invoicedTotal
    ? (collected / invoicedTotal) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Headline figures */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: t("pay.collected"),
            value: formatMoney(collected),
            hint: t("pay.collectionRate", {
              percent: fmt.percent(collectionRate, 0),
            }),
          },
          {
            label: t("pay.outstanding"),
            value: formatMoney(outstanding),
            hint: t("pay.unpaidCount", {
              count: fmt.number(buckets.reduce((s, b) => s + b.count, 0)),
            }),
            tone: "pending" as const,
          },
          {
            label: t("plans.invoiced"),
            value: formatMoney(invoicedTotal),
            hint: t("pay.raisedCount", { count: fmt.number(recon.invoices) }),
          },
          {
            label: t("pay.refunded"),
            value: formatMoney(refundedTotal),
            hint: refundedTotal
              ? t("pay.returnedToPatients")
              : t("pay.noRefunds"),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-card border border-line bg-surface px-4 py-3"
          >
            <p className="text-[0.75rem] text-ink-muted">{s.label}</p>
            <p
              data-metric
              className={cn(
                "mt-0.5 text-title",
                s.tone === "pending" ? "text-status-pending" : "text-ink"
              )}
            >
              {s.value}
            </p>
            <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">
              {s.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Invoiced vs collected */}
        <Card className="flex flex-col xl:col-span-3">
          <CardHeader>
            {/* Say why November towers over the rest rather than leaving it
                to be misread as a trend. */}
            <CardTitle hint={t("pay.byMonthNote")}>
              {t("pay.invoicedAndCollected")}
            </CardTitle>
          </CardHeader>
          <CardBody className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {[
                { label: t("plans.invoiced"), color: "var(--color-chart-2)" },
                { label: t("pay.collected"), color: "var(--color-chart-1)" },
              ].map((i) => (
                <span
                  key={i.label}
                  className="flex items-center gap-1.5 text-[0.75rem] text-ink-muted"
                >
                  <span
                    className="h-0.5 w-3 rounded-full"
                    style={{ background: i.color }}
                  />
                  {i.label}
                </span>
              ))}
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={months}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  barCategoryGap="26%"
                >
                  <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
                  <XAxis dataKey="month" {...axisProps} dy={6} />
                  <YAxis
                    {...axisProps}
                    width={52}
                    tickMargin={8}
                    tickFormatter={(v: number) => formatCompactMoney(v)}
                  />
                  <RTooltip
                    cursor={{ fill: "var(--color-forest-50)" }}
                    content={<MoneyTooltip />}
                  />
                  <Bar
                    dataKey="invoiced"
                    name={t("plans.invoiced")}
                    fill="var(--color-chart-2)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={600}
                  />
                  <Bar
                    dataKey="collected"
                    name={t("pay.collected")}
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Payment methods */}
        <Card className="flex flex-col xl:col-span-2">
          <CardHeader>
            <CardTitle hint={t("pay.shareCollected")}>
              {t("pay.paymentMethods")}
            </CardTitle>
          </CardHeader>
          <CardBody className="flex flex-1 flex-col">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mix}
                    dataKey="amount"
                    nameKey="method"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={2}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                    animationDuration={600}
                  >
                    {mix.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="rounded-panel border border-line bg-surface px-3 py-2 shadow-overlay">
                          <p className="text-[0.75rem] font-semibold text-ink">
                            {payload[0].name}
                          </p>
                          <p className="text-[0.75rem] tabular-nums text-ink-muted">
                            {formatMoney(payload[0].value as number)}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    formatter={(value) => (
                      <span className="text-[0.75rem] text-ink-muted">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5 border-t border-line pt-3">
              {mix.map((m, i) => (
                <li
                  key={m.method}
                  className="flex items-center gap-2 text-[0.75rem]"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 text-ink-muted">{m.method}</span>
                  <span className="tabular-nums text-ink-soft">
                    {mixTotal ? Math.round((m.amount / mixTotal) * 100) : 0}%
                  </span>
                  <span className="w-16 text-end font-medium tabular-nums text-ink">
                    {formatMoney(m.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ageing */}
        <Card>
          <CardHeader>
            <CardTitle hint={t("pay.howLongOwed")}>
              {t("pay.outstandingByAge")}
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {buckets.map((b) => {
              const max = Math.max(...buckets.map((x) => x.amount), 1);
              return (
                <div key={b.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-small text-ink">{b.label}</span>
                    <span className="text-small font-semibold tabular-nums text-ink">
                      {formatMoney(b.amount)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Progress
                      value={(b.amount / max) * 100}
                      tone={
                        b.label === "60+ days"
                          ? "gold"
                          : b.label === "Not yet due"
                            ? "muted"
                            : "brand"
                      }
                      className="flex-1"
                    />
                    <span className="w-20 shrink-0 text-end text-[0.75rem] tabular-nums text-ink-faint">
                      {b.count} invoice{b.count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              );
            })}
            {discountsTotal > 0 && (
              <p className="border-t border-line pt-3 text-[0.75rem] text-ink-muted">
                {formatMoney(discountsTotal)} given in agreed discounts and
                insurance contributions across all invoices.
              </p>
            )}
          </CardBody>
        </Card>

        {/* Reconciliation — the claim, proven */}
        <Card>
          <CardHeader>
            <CardTitle hint={t("pay.billingAgainstRecord")}>
              {t("pay.reconciliation")}
            </CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2.5 text-small">
              <li className="flex items-center justify-between">
                <span className="text-ink-muted">{t("pay.completedAppointments")}</span>
                <span className="font-semibold tabular-nums text-ink">
                  {recon.appointments}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-muted">
                  {t("pay.completedSessions")}
                </span>
                <span className="font-semibold tabular-nums text-ink">
                  {recon.planSteps}
                </span>
              </li>
              <li className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="text-ink-muted">{t("pay.invoiceLines")}</span>
                <span className="font-semibold tabular-nums text-ink">
                  {recon.lines}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-ink-muted">{t("pay.acrossInvoices")}</span>
                <span className="font-semibold tabular-nums text-ink">
                  {recon.invoices}
                </span>
              </li>
            </ul>

            <div
              className={cn(
                "mt-3 flex items-start gap-2 rounded-field border px-3 py-2.5 text-[0.75rem] leading-[1.15rem]",
                recon.missing === 0
                  ? "border-status-completed/25 bg-status-completed-bg/60 text-status-completed"
                  : "border-status-cancelled/25 bg-status-cancelled-bg/60 text-status-cancelled"
              )}
            >
              {recon.missing === 0 ? (
                <CheckCircle2 className="mt-px size-3.5 shrink-0" />
              ) : (
                <Info className="mt-px size-3.5 shrink-0" />
              )}
              {recon.missing === 0
                ? `Every completed appointment and treatment session appears on exactly one invoice line. Nothing is unbilled.`
                : `${recon.missing} completed item${recon.missing === 1 ? " is" : "s are"} not on any invoice.`}
            </div>

            <p className="mt-3 text-[0.75rem] leading-[1.15rem] text-ink-faint">
              Invoices are generated from the calendar and treatment plans at
              catalogue prices — the figures above are not a separate ledger,
              so a price change in Services moves them too.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
