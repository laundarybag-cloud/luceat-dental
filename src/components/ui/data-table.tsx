"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/locale-context";
import { Button } from "./button";

/**
 * Shared table for every register in the app (patients, doctors, services,
 * invoices, users). Sorting and pagination are handled here so each module
 * only describes its columns.
 */

export interface Column<T> {
  id: string;
  header: string;
  /** Rendered cell. */
  cell: (row: T) => React.ReactNode;
  /** Return a comparable value to make the column sortable. */
  sortBy?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
  /** Hide below a breakpoint to keep narrow screens readable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  align?: "start" | "end";
}

const HIDE: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  pageSize = 10,
  empty,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  empty?: React.ReactNode;
  caption?: string;
}) {
  const { t, fmt } = useI18n();
  const [sort, setSort] = React.useState<{ id: string; dir: "asc" | "desc" } | null>(
    null
  );
  const [page, setPage] = React.useState(0);

  // Any change to the underlying rows (a filter, a search) resets paging —
  // otherwise you land on an empty page 4 of 2.
  React.useEffect(() => setPage(0), [rows]);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortBy) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortBy!(a);
      const bv = col.sortBy!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const slice = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (id: string) =>
    setSort((s) =>
      s?.id !== id
        ? { id, dir: "asc" }
        : s.dir === "asc"
          ? { id, dir: "desc" }
          : null
    );

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div>
      <div className="scrollbar-slim overflow-x-auto">
        <table className="w-full border-collapse text-start">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => {
                const active = sort?.id === c.id;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={
                      active
                        ? sort!.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                    className={cn(
                      "whitespace-nowrap px-4 py-2.5 text-label uppercase text-ink-muted",
                      c.align === "end" ? "text-end" : "text-start",
                      c.hideBelow && HIDE[c.hideBelow],
                      c.headerClassName
                    )}
                  >
                    {c.sortBy ? (
                      <button
                        onClick={() => toggleSort(c.id)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded transition-colors hover:text-ink",
                          active && "text-ink"
                        )}
                      >
                        {c.header}
                        {active ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-45" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={
                  onRowClick
                    ? (e) => {
                        // Radix portals menus and dialogs outside the row, but
                        // React still bubbles their clicks through the tree —
                        // which would fire the row action behind them. Only
                        // accept clicks that really happened inside the row.
                        if (!e.currentTarget.contains(e.target as Node)) return;
                        onRowClick(row);
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter") onRowClick(row);
                      }
                    : undefined
                }
                className={cn(
                  "border-b border-line last:border-b-0",
                  onRowClick &&
                    "cursor-pointer transition-colors hover:bg-canvas focus-visible:bg-canvas"
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={cn(
                      "px-4 py-2.5 align-middle text-small text-ink-soft",
                      c.align === "end" && "text-end",
                      c.hideBelow && HIDE[c.hideBelow],
                      c.className
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="text-[0.75rem] tabular-nums text-ink-muted">
            {t("table.range", {
              from: fmt.number(current * pageSize + 1),
              to: fmt.number(
                Math.min((current + 1) * pageSize, sorted.length)
              ),
              total: fmt.number(sorted.length),
            })}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="icon-sm"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              aria-label={t("table.previousPage")}
            >
              <ChevronLeft className="rtl:rotate-180" />
            </Button>
            <span className="px-1 text-[0.75rem] tabular-nums text-ink-soft">
              {t("table.pageOf", {
                current: fmt.number(current + 1),
                total: fmt.number(pageCount),
              })}
            </span>
            <Button
              variant="secondary"
              size="icon-sm"
              disabled={current >= pageCount - 1}
              onClick={() => setPage(current + 1)}
              aria-label={t("table.nextPage")}
            >
              <ChevronRight className="rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
