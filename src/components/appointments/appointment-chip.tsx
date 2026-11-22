"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";
import { formatTime, endOf, PX_PER_MIN, minutesSinceMidnight } from "@/lib/schedule";
import { Avatar } from "@/components/ui/avatar";

/** Per-status chip skin. Left bar carries the colour; fills stay quiet. */
export const CHIP_SKIN: Record<Appointment["status"], string> = {
  pending:
    "bg-status-pending-bg/70 border-status-pending/25 before:bg-status-pending",
  confirmed:
    "bg-status-confirmed-bg/70 border-status-confirmed/25 before:bg-status-confirmed",
  checked_in:
    "bg-status-checkedin-bg/70 border-status-checkedin/25 before:bg-status-checkedin",
  in_progress:
    "bg-status-progress-bg/80 border-status-progress/30 before:bg-status-progress",
  completed:
    "bg-status-completed-bg/55 border-status-completed/20 before:bg-status-completed",
  cancelled:
    "bg-surface border-line before:bg-status-cancelled/50 opacity-70",
  no_show: "bg-surface-sunken border-line before:bg-status-noshow",
};

/**
 * Absolutely positioned block inside a time grid.
 * `lane`/`lanes` spread simultaneous appointments side by side.
 */
export function TimedAppointment({
  appt,
  gridStartMin,
  onSelect,
  lane = 0,
  lanes = 1,
  showDoctor,
  doctorName,
}: {
  appt: Appointment;
  gridStartMin: number;
  onSelect: (a: Appointment) => void;
  lane?: number;
  lanes?: number;
  showDoctor?: boolean;
  doctorName?: string;
}) {
  const top = (minutesSinceMidnight(appt.start) - gridStartMin) * PX_PER_MIN;
  const height = Math.max(appt.durationMin * PX_PER_MIN, 26);
  const width = `calc((100% - 0.5rem) / ${lanes})`;
  const compact = height < 54;

  return (
    <button
      onClick={() => onSelect(appt)}
      style={{
        top,
        height: height - 3,
        width,
        insetInlineStart: `calc(${lane} * ${width} + 0.25rem)`,
      }}
      className={cn(
        "absolute overflow-hidden rounded-md border ps-2.5 pe-1.5 py-1 text-start transition-all duration-150",
        "before:absolute before:inset-y-0 before:start-0 before:w-[3px]",
        "hover:z-20 hover:shadow-raised focus-visible:z-20",
        CHIP_SKIN[appt.status]
      )}
      title={`${formatTime(appt.start)}–${formatTime(endOf(appt))} · ${
        appt.patient.name
      } · ${appt.service}`}
    >
      <p
        className={cn(
          "truncate text-[0.75rem] font-semibold leading-4 text-ink",
          appt.status === "cancelled" && "line-through decoration-ink-faint"
        )}
      >
        {appt.patient.name}
      </p>
      {!compact && (
        <>
          <p className="truncate text-[0.6875rem] leading-4 text-ink-muted">
            {appt.service}
          </p>
          <p className="truncate text-[0.6875rem] leading-4 tabular-nums text-ink-faint">
            {formatTime(appt.start)}–{formatTime(endOf(appt))}
            {showDoctor && doctorName ? ` · ${doctorName}` : ""}
          </p>
        </>
      )}
    </button>
  );
}

/**
 * Compact row for month cells: one line, patient name given the room.
 * The doctor is deliberately left out — at ~130px a column cannot carry both,
 * and the patient is what a receptionist scans for.
 */
export function AppointmentRowChip({
  appt,
  onSelect,
}: {
  appt: Appointment;
  onSelect: (a: Appointment) => void;
}) {
  return (
    <button
      onClick={() => onSelect(appt)}
      className={cn(
        "relative flex w-full items-center gap-1.5 overflow-hidden rounded border ps-2 pe-1 py-0.5 text-start transition-colors",
        "before:absolute before:inset-y-0 before:start-0 before:w-[2px]",
        "hover:shadow-card",
        CHIP_SKIN[appt.status]
      )}
      title={`${formatTime(appt.start)} · ${appt.patient.name} · ${appt.service}`}
    >
      <span className="shrink-0 text-[0.6875rem] font-semibold tabular-nums text-ink-soft">
        {formatTime(appt.start)}
      </span>
      <span
        className={cn(
          "truncate text-[0.6875rem] text-ink",
          appt.status === "cancelled" && "line-through decoration-ink-faint"
        )}
      >
        {appt.patient.name}
      </span>
    </button>
  );
}

/** Two-line chip for the whole-clinic week agenda, where the doctor matters. */
export function AppointmentAgendaChip({
  appt,
  onSelect,
  doctorName,
}: {
  appt: Appointment;
  onSelect: (a: Appointment) => void;
  doctorName?: string;
}) {
  return (
    <button
      onClick={() => onSelect(appt)}
      className={cn(
        "relative w-full overflow-hidden rounded-md border ps-2.5 pe-1.5 py-1 text-start transition-all",
        "before:absolute before:inset-y-0 before:start-0 before:w-[3px]",
        "hover:shadow-card",
        CHIP_SKIN[appt.status]
      )}
      title={`${formatTime(appt.start)}–${formatTime(endOf(appt))} · ${
        appt.patient.name
      } · ${appt.service}`}
    >
      <span className="flex items-baseline gap-1.5">
        <span className="shrink-0 text-[0.6875rem] font-semibold tabular-nums text-ink-soft">
          {formatTime(appt.start)}
        </span>
        <span
          className={cn(
            "truncate text-[0.75rem] font-medium text-ink",
            appt.status === "cancelled" && "line-through decoration-ink-faint"
          )}
        >
          {appt.patient.name}
        </span>
      </span>
      <span className="mt-0.5 block truncate text-[0.625rem] leading-3 text-ink-muted">
        {appt.service}
      </span>
      {doctorName ? (
        <span className="mt-0.5 block truncate text-[0.625rem] leading-3 text-ink-faint">
          {doctorName}
        </span>
      ) : null}
    </button>
  );
}

/** Avatar + name + service, used in the drawer and agenda. */
export function PatientLine({ appt }: { appt: Appointment }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar src={appt.patient.avatar} name={appt.patient.name} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-small font-medium text-ink">
          {appt.patient.name}
        </span>
        <span className="block truncate text-[0.75rem] text-ink-muted">
          {appt.service}
        </span>
      </span>
    </span>
  );
}

/**
 * Lays overlapping appointments into side-by-side lanes.
 * Returns the lane index and total lane count for each appointment.
 */
export function assignLanes(list: Appointment[]) {
  const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
  const result = new Map<string, { lane: number; lanes: number }>();
  let cluster: Appointment[] = [];
  let clusterEnd = 0;

  const flush = () => {
    if (!cluster.length) return;
    const laneEnds: number[] = [];
    const laneOf = new Map<string, number>();
    for (const a of cluster) {
      const s = new Date(a.start).getTime();
      const e = s + a.durationMin * 60_000;
      let lane = laneEnds.findIndex((end) => end <= s);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(e);
      } else {
        laneEnds[lane] = e;
      }
      laneOf.set(a.id, lane);
    }
    for (const a of cluster) {
      result.set(a.id, {
        lane: laneOf.get(a.id) ?? 0,
        lanes: laneEnds.length,
      });
    }
    cluster = [];
  };

  for (const a of sorted) {
    const s = new Date(a.start).getTime();
    const e = s + a.durationMin * 60_000;
    if (cluster.length && s >= clusterEnd) {
      flush();
      clusterEnd = 0;
    }
    cluster.push(a);
    clusterEnd = Math.max(clusterEnd, e);
  }
  flush();

  return result;
}
