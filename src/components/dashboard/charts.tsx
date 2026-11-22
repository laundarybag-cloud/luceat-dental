"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { weekdaySeries } from "@/lib/mock/clinic";
import { revenueReport } from "@/lib/analytics";
import { cn, formatNumber } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { useI18n } from "@/components/i18n/locale-context";

const axisProps = {
  stroke: "transparent",
  tick: { fill: "var(--color-ink-muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
  formatter?: (v: number, key: string) => string;
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
              {formatter ? formatter(p.value, p.dataKey) : formatNumber(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span
          key={i.label}
          className="flex items-center gap-1.5 text-[0.75rem] text-ink-muted"
        >
          <span
            className={cn("h-0.5 w-3 rounded-full", i.dashed && "opacity-70")}
            style={{
              background: i.dashed
                ? `repeating-linear-gradient(90deg, ${i.color} 0 3px, transparent 3px 6px)`
                : i.color,
            }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

const RANGES = { "6m": 6, "12m": 12 } as const;

export function RevenueChart() {
  const { t, fmt } = useI18n();
  const [range, setRange] = React.useState<keyof typeof RANGES>("12m");

  // Invoiced against collected, from the same invoices Modules 08 and 13
  // read. The dashboard previously carried its own year of six-figure
  // months, which contradicted every other figure in the build.
  const data = React.useMemo(
    () => revenueReport("12m").trend.slice(-RANGES[range]),
    [range]
  );
  const invoiced = data.reduce((s, d) => s + d.invoiced, 0);
  const collected = data.reduce((s, d) => s + d.collected, 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle
          hint={t("dashboard.revenue.hint", {
            collected: fmt.money(collected),
            invoiced: fmt.money(invoiced),
          })}
        >
          {t("dashboard.revenue.title")}
        </CardTitle>
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as keyof typeof RANGES)}
        >
          <TabsList>
            <TabsTrigger value="6m">6M</TabsTrigger>
            <TabsTrigger value="12m">12M</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-4">
        <Legend
          items={[
            {
              label: t("dashboard.revenue.invoiced"),
              color: "var(--color-chart-2)",
              dashed: true,
            },
            { label: t("dashboard.revenue.collected"), color: "var(--color-chart-1)" },
          ]}
        />
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity="0.18"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--color-chart-grid)"
                strokeDasharray="0"
              />
              <XAxis dataKey="label" {...axisProps} dy={6} />
              <YAxis
                {...axisProps}
                width={52}
                tickMargin={8}
                tickFormatter={(v: number) => fmt.compactMoney(v)}
              />
              <RTooltip
                cursor={{
                  stroke: "var(--color-forest-200)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                content={<ChartTooltip formatter={(v) => fmt.money(v)} />}
              />
              <Area
                type="monotone"
                dataKey="collected"
                name={t("dashboard.revenue.collected")}
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#revFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: "var(--color-surface)",
                }}
                animationDuration={700}
              />
              <Line
                type="monotone"
                dataKey="invoiced"
                name={t("dashboard.revenue.invoiced")}
                stroke="var(--color-chart-2)"
                strokeWidth={1.75}
                strokeDasharray="5 5"
                dot={false}
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[0.75rem] text-ink-faint">
{t("dashboard.revenue.note")}
        </p>
      </CardBody>
    </Card>
  );
}

export function AppointmentOutcomesChart() {
  const { t, fmt } = useI18n();
  const totals = weekdaySeries.reduce(
    (acc, d) => ({
      completed: acc.completed + d.completed,
      lost: acc.lost + d.cancelled + d.noShow,
    }),
    { completed: 0, lost: 0 }
  );
  const lossRate = (
    (totals.lost / (totals.completed + totals.lost)) *
    100
  ).toFixed(1);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle
          hint={t("dashboard.outcomes.hint", {
            percent: fmt.percent(Number(lossRate), 1),
          })}
        >
          {t("dashboard.outcomes.title")}
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-1 flex-col gap-4">
        <Legend
          items={[
            { label: t("dashboard.outcomes.completed"), color: "var(--color-chart-1)" },
            { label: t("dashboard.outcomes.cancelled"), color: "var(--color-chart-3)" },
            { label: t("dashboard.outcomes.noShow"), color: "var(--color-chart-5)" },
          ]}
        />
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekdaySeries}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
              <XAxis dataKey="day" {...axisProps} dy={6} />
              <YAxis {...axisProps} width={34} tickMargin={6} />
              <RTooltip
                cursor={{ fill: "var(--color-forest-50)" }}
                content={<ChartTooltip />}
              />
              <Bar
                dataKey="completed"
                name={t("dashboard.outcomes.completed")}
                stackId="a"
                fill="var(--color-chart-1)"
                radius={[0, 0, 0, 0]}
                animationDuration={600}
              />
              <Bar
                dataKey="cancelled"
                name={t("dashboard.outcomes.cancelled")}
                stackId="a"
                fill="var(--color-chart-3)"
                animationDuration={600}
              />
              <Bar
                dataKey="noShow"
                name={t("dashboard.outcomes.noShow")}
                stackId="a"
                fill="var(--color-chart-5)"
                radius={[4, 4, 0, 0]}
                animationDuration={600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
