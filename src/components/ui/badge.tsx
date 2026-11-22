"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types";
import { useI18n } from "@/components/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n";

const STATUS_STYLE: Record<
  AppointmentStatus,
  { labelKey: MessageKey; dot: string; chip: string }
> = {
  pending: {
    labelKey: "status.pending",
    dot: "bg-status-pending",
    chip: "bg-status-pending-bg text-status-pending",
  },
  confirmed: {
    labelKey: "status.confirmed",
    dot: "bg-status-confirmed",
    chip: "bg-status-confirmed-bg text-status-confirmed",
  },
  checked_in: {
    labelKey: "status.checked_in",
    dot: "bg-status-checkedin",
    chip: "bg-status-checkedin-bg text-status-checkedin",
  },
  in_progress: {
    labelKey: "status.in_progress",
    dot: "bg-status-progress",
    chip: "bg-status-progress-bg text-status-progress",
  },
  completed: {
    labelKey: "status.completed",
    dot: "bg-status-completed",
    chip: "bg-status-completed-bg text-status-completed",
  },
  cancelled: {
    labelKey: "status.cancelled",
    dot: "bg-status-cancelled",
    chip: "bg-status-cancelled-bg text-status-cancelled",
  },
  no_show: {
    labelKey: "status.no_show",
    dot: "bg-status-noshow",
    chip: "bg-status-noshow-bg text-status-noshow",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const { t } = useI18n();
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-5",
        s.chip,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {t(s.labelKey)}
    </span>
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "brand" | "gold" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-5",
        tone === "neutral" && "bg-surface-sunken text-ink-soft",
        tone === "brand" && "bg-forest-50 text-forest-700",
        tone === "gold" && "bg-gold-100 text-gold-600",
        tone === "danger" && "bg-status-cancelled-bg text-status-cancelled",
        className
      )}
      {...props}
    />
  );
}

export { STATUS_STYLE };
