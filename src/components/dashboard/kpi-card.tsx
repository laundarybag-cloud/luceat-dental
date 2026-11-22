"use client";

import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn, formatDelta } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** Tiny inline area sparkline — no chart library needed at this size. */
function Sparkline({
  points,
  positive,
}: {
  points: number[];
  positive: boolean;
}) {
  const { line, area } = React.useMemo(() => {
    const w = 100;
    const h = 28;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * (h - 4) - 2;
      return [x, y] as const;
    });
    const d = coords
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    return { line: d, area: `${d} L${w},${h} L0,${h} Z` };
  }, [points]);

  const id = React.useId();

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={positive ? "var(--color-forest-400)" : "var(--color-status-cancelled)"}
            stopOpacity="0.22"
          />
          <stop
            offset="100%"
            stopColor={positive ? "var(--color-forest-400)" : "var(--color-status-cancelled)"}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={
          positive ? "var(--color-forest-500)" : "var(--color-status-cancelled)"
        }
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  sublabel,
  delta,
  icon,
  spark,
  accent,
  invertDelta,
}: {
  label: string;
  value: string;
  sublabel: string;
  /** Omit (or pass null) when no honest comparison period exists. */
  delta?: number | null;
  /** Pass rendered JSX — icon components cannot cross the server boundary. */
  icon: React.ReactNode;
  spark?: number[];
  accent?: "brand" | "gold";
  /** For metrics where a rise is bad (cancellations). */
  invertDelta?: boolean;
}) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = hasDelta && delta > 0;
  // With no delta the sparkline should not be tinted as a loss.
  const good = hasDelta ? (invertDelta ? !up : up) : true;

  return (
    <Card interactive className="group flex flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-small font-medium text-ink-muted">
            {label}
          </p>
          <p
            data-metric
            className="mt-2 text-metric text-ink"
          >
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-field transition-colors",
            "[&_svg]:size-[1.125rem]",
            accent === "gold"
              ? "bg-gold-100 text-gold-600"
              : "bg-forest-50 text-forest-600"
          )}
        >
          {icon}
        </span>
      </div>

      {spark ? (
        <div className="mt-3 -mx-1">
          <Sparkline points={spark} positive={good} />
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.75rem] font-semibold tabular-nums",
              good
                ? "bg-status-completed-bg text-status-completed"
                : "bg-status-cancelled-bg text-status-cancelled"
            )}
          >
            {up ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {formatDelta(delta)}
          </span>
        )}
        <span className="truncate text-[0.75rem] text-ink-muted">{sublabel}</span>
      </div>
    </Card>
  );
}
