"use client";

import * as React from "react";
import { Info, RotateCcw } from "lucide-react";
import {
  CONDITION_META,
  CONDITION_ORDER,
  QUADRANTS,
  toothName,
  type ToothCondition,
  type ToothRecord,
} from "@/lib/dental";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { fmtDate } from "./patients-register";
import { useI18n } from "@/components/i18n/locale-context";

/**
 * Tooth glyph. Molars and premolars get a crown-and-roots silhouette,
 * incisors and canines a blade shape, so the arch reads anatomically
 * rather than as a row of identical squares.
 */
function ToothGlyph({ fdi, className }: { fdi: number; className?: string }) {
  const pos = fdi % 10;
  const molar = pos >= 6;
  const premolar = pos === 4 || pos === 5;

  return (
    <svg viewBox="0 0 24 30" className={className} aria-hidden>
      {molar ? (
        <path d="M4.2 9.4c0-3.6 2.6-6.2 7.8-6.2s7.8 2.6 7.8 6.2c0 2.3-.9 3.6-1.3 5.3-.4 1.7-.4 3.6-.8 5.8-.3 1.8-.9 3.4-2 3.4-1.3 0-1.6-1.6-2-3.6-.3-1.6-.7-3-1.7-3s-1.4 1.4-1.7 3c-.4 2-.7 3.6-2 3.6-1.1 0-1.7-1.6-2-3.4-.4-2.2-.4-4.1-.8-5.8-.4-1.7-1.3-3-1.3-5.3Z" />
      ) : premolar ? (
        <path d="M5.2 9.8c0-3.8 2.3-6.6 6.8-6.6s6.8 2.8 6.8 6.6c0 2.4-1 3.7-1.5 5.6-.5 2-.6 4-1 6-.3 1.5-.8 2.5-1.7 2.5-1 0-1.4-1.1-1.8-2.9-.3-1.4-.5-2.4-.8-2.4s-.5 1-.8 2.4c-.4 1.8-.8 2.9-1.8 2.9-.9 0-1.4-1-1.7-2.5-.4-2-.5-4-1-6-.5-1.9-1.5-3.2-1.5-5.6Z" />
      ) : (
        <path d="M6 9.2c0-3.7 2-6 6-6s6 2.3 6 6c0 2.6-1 4-1.6 6.2-.6 2.3-.8 5-1.4 7.1-.4 1.4-1.1 2-1.9 2h-2.2c-.8 0-1.5-.6-1.9-2-.6-2.1-.8-4.8-1.4-7.1C7 13.2 6 11.8 6 9.2Z" />
      )}
    </svg>
  );
}

function Tooth({
  record,
  selected,
  onSelect,
}: {
  record: ToothRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = CONDITION_META[record.condition];
  const missing = record.condition === "missing";

  return (
    <Tooltip
      content={
        <span className="block">
          <span className="block font-semibold">
            {record.fdi} · {toothName(record.fdi)}
          </span>
          <span className="block opacity-80">{meta.label}</span>
        </span>
      }
    >
      <button
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Tooth ${record.fdi}, ${toothName(record.fdi)}, ${meta.label}`}
        className={cn(
          "group flex w-8 flex-col items-center gap-1 rounded-md py-1.5 transition-colors sm:w-10",
          selected ? "bg-forest-100" : "hover:bg-forest-50"
        )}
      >
        <span
          className={cn(
            "flex h-10 w-7 items-center justify-center rounded transition-colors sm:h-12 sm:w-8",
            missing ? "border border-dashed" : "border",
            meta.swatch,
            selected && "ring-2 ring-forest-500 ring-offset-1"
          )}
        >
          {missing ? (
            <span className="h-px w-4 rotate-45 bg-ink-faint" aria-hidden />
          ) : (
            <ToothGlyph
              fdi={record.fdi}
              className={cn(
                "h-7 w-5 sm:h-9 sm:w-6",
                record.condition === "healthy"
                  ? "fill-forest-100"
                  : "fill-white/60"
              )}
            />
          )}
        </span>
        <span
          className={cn(
            "text-[0.625rem] tabular-nums leading-none",
            selected ? "font-semibold text-forest-800" : "text-ink-faint"
          )}
        >
          {record.fdi}
        </span>
      </button>
    </Tooltip>
  );
}

export function DentalChart({
  chart,
  onChange,
  readOnly,
}: {
  chart: ToothRecord[];
  onChange: (next: ToothRecord[]) => void;
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [selected, setSelected] = React.useState<number | null>(null);
  const byFdi = React.useMemo(
    () => new Map(chart.map((t) => [t.fdi, t])),
    [chart]
  );
  const record = selected ? byFdi.get(selected) : undefined;

  const counts = React.useMemo(() => {
    const map = new Map<ToothCondition, number>();
    for (const t of chart) map.set(t.condition, (map.get(t.condition) ?? 0) + 1);
    return map;
  }, [chart]);

  const setCondition = (condition: ToothCondition) => {
    if (!record) return;
    onChange(
      chart.map((t) =>
        t.fdi === record.fdi
          ? { ...t, condition, updated: new Date().toISOString().slice(0, 10) }
          : t
      )
    );
    toast({
      tone: "success",
      title: `Tooth ${record.fdi} marked ${CONDITION_META[condition].label.toLowerCase()}`,
      detail: t("chart.sessionOnly"),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
      {/* Arch. min-w-0 lets the 1fr track shrink so the arch scrolls inside
          its own card instead of pushing the detail panel off the page. */}
      <div className="min-w-0 rounded-card border border-line bg-surface p-4">
        <div className="space-y-4">
          {[
            [QUADRANTS[0], QUADRANTS[1]],
            [QUADRANTS[2], QUADRANTS[3]],
          ].map(([left, right], rowIndex) => (
            <div key={left.id}>
              {rowIndex === 1 && (
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-label uppercase text-ink-faint">
                    {t("chart.mandible")}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
              {rowIndex === 0 && (
                <p className="mb-2 text-center text-label uppercase text-ink-faint">
                  {t("chart.maxilla")}
                </p>
              )}
              <div className="scrollbar-slim overflow-x-auto">
                <div className="mx-auto flex w-max items-start gap-3">
                  <div className="flex gap-px">
                    {left.teeth.map((fdi) => {
                      const t = byFdi.get(fdi);
                      return t ? (
                        <Tooth
                          key={fdi}
                          record={t}
                          selected={selected === fdi}
                          onSelect={() => setSelected(fdi)}
                        />
                      ) : null;
                    })}
                  </div>
                  <span className="mt-1 h-12 w-px bg-line-strong" aria-hidden />
                  <div className="flex gap-px">
                    {right.teeth.map((fdi) => {
                      const t = byFdi.get(fdi);
                      return t ? (
                        <Tooth
                          key={fdi}
                          record={t}
                          selected={selected === fdi}
                          onSelect={() => setSelected(fdi)}
                        />
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
          {CONDITION_ORDER.map((c) => (
            <span
              key={c}
              className="flex items-center gap-1.5 text-[0.75rem] text-ink-muted"
            >
              <span
                className={cn(
                  "size-2.5 rounded-sm border",
                  CONDITION_META[c].swatch
                )}
              />
              {CONDITION_META[c].label}
              {counts.get(c) ? (
                <span className="tabular-nums text-ink-faint">
                  ({counts.get(c)})
                </span>
              ) : null}
            </span>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[0.75rem] text-ink-faint">
          <Info className="mt-px size-3.5 shrink-0" />
          FDI two-digit notation (ISO 3950), viewed from the clinician&apos;s
          side.
        </p>
      </div>

      {/* Selected tooth */}
      <div className="rounded-card border border-line bg-canvas p-4">
        {record ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-section text-ink">Tooth {record.fdi}</p>
                <p className="text-small text-ink-muted">
                  {toothName(record.fdi)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("chart.clearSelection")}
                onClick={() => setSelected(null)}
              >
                <RotateCcw />
              </Button>
            </div>

            <span
              className={cn(
                "mt-3 inline-flex rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                CONDITION_META[record.condition].chip
              )}
            >
              {CONDITION_META[record.condition].label}
            </span>
            <p className="mt-2 text-[0.75rem] leading-[1.15rem] text-ink-muted">
              {CONDITION_META[record.condition].description}
            </p>
            {record.note && (
              <p className="mt-2 rounded-field border border-line bg-surface p-2.5 text-[0.75rem] leading-[1.15rem] text-ink-soft">
                {record.note}
              </p>
            )}
            {record.updated && (
              <p className="mt-2 text-[0.6875rem] tabular-nums text-ink-faint">
                Last recorded {fmtDate(record.updated)}
              </p>
            )}

            {!readOnly && (
              <>
                <p className="mt-4 text-label uppercase text-ink-faint">
                  {t("chart.recordFinding")}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {CONDITION_ORDER.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-field border px-2 py-1.5 text-[0.75rem] font-medium transition-colors",
                        record.condition === c
                          ? "border-forest-400 bg-forest-50 text-forest-800"
                          : "border-line bg-surface text-ink-soft hover:border-line-strong"
                      )}
                    >
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-sm border",
                          CONDITION_META[c].swatch
                        )}
                      />
                      <span className="truncate">{CONDITION_META[c].short}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-forest-50">
              <ToothGlyph fdi={16} className="h-5 w-4 fill-forest-400" />
            </span>
            <p className="mt-2.5 text-card text-ink">{t("chart.selectTooth")}</p>
            <p className="mt-1 max-w-[13rem] text-[0.75rem] text-ink-muted">
              Pick any tooth in the arch to see its history and record a
              finding.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
