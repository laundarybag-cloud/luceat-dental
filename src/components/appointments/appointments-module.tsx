"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { doctors } from "@/lib/mock/clinic";
import { TODAY, patients, services } from "@/lib/mock/schedule";
import {
  addDays,
  addMonths,
  dayKey,
  formatLongDate,
  formatMonthYear,
  formatWeekRange,
  weekDays,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Input } from "@/components/ui/field";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { AppointmentsProvider, useAppointments } from "./store";
import { DayView, MonthView, NoResults, WeekView } from "./views";
import { AppointmentDrawer } from "./detail-drawer";
import { AppointmentFormDialog, type FormSeed } from "./appointment-form";
import { useI18n } from "@/components/i18n/locale-context";

type View = "day" | "week" | "month";

const STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

const doctorsById = new Map(doctors.map((d) => [d.id, d]));

function Toolbar({
  view,
  setView,
  cursor,
  setCursor,
  doctorId,
  setDoctorId,
  serviceId,
  setServiceId,
  statuses,
  toggleStatus,
  query,
  setQuery,
  onReset,
  activeFilters,
  onCreate,
}: {
  view: View;
  setView: (v: View) => void;
  cursor: string;
  setCursor: (d: string) => void;
  doctorId: string;
  setDoctorId: (v: string) => void;
  serviceId: string;
  setServiceId: (v: string) => void;
  statuses: AppointmentStatus[];
  toggleStatus: (s: AppointmentStatus) => void;
  query: string;
  setQuery: (v: string) => void;
  onReset: () => void;
  activeFilters: number;
  onCreate: () => void;
}) {
  const { t } = useI18n();
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const step = (dir: number) =>
    setCursor(
      view === "month"
        ? addMonths(cursor, dir)
        : addDays(cursor, dir * (view === "week" ? 7 : 1))
    );

  const title =
    view === "day"
      ? formatLongDate(cursor)
      : view === "week"
        ? formatWeekRange(cursor)
        : formatMonthYear(cursor);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => step(-1)}
            aria-label={t("common.previous")}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => step(1)}
            aria-label={t("common.next")}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </div>

        <Button
          variant={cursor === TODAY ? "subtle" : "secondary"}
          size="md"
          onClick={() => setCursor(TODAY)}
        >
          {t("common.today")}
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title text-ink">{title}</h1>
          <p className="truncate text-[0.75rem] text-ink-muted">
            {t("appt.clinicHours")}
          </p>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="day">{t("appt.view.day")}</TabsTrigger>
            <TabsTrigger value="week">{t("appt.view.week")}</TabsTrigger>
            <TabsTrigger value="month">{t("appt.view.month")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant={filtersOpen || activeFilters ? "subtle" : "secondary"}
          size="md"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal />
          {t("common.filters")}
          {activeFilters > 0 && (
            <span className="rounded-full bg-forest-800 px-1.5 text-[0.6875rem] font-semibold tabular-nums text-white">
              {activeFilters}
            </span>
          )}
        </Button>

        <Button variant="primary" size="md" onClick={onCreate}>
          <Plus />
          {t("appt.new")}
        </Button>
      </div>

      {filtersOpen && (
        <Card className="animate-fade-up p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("appt.searchPlaceholder")}
                className="ps-9"
                aria-label={t("appt.search")}
              />
            </div>
            <Select
              value={doctorId}
              onValueChange={setDoctorId}
              ariaLabel="Filter by clinician"
              options={[
                { value: "all", label: t("appt.allClinicians") },
                ...doctors.map((d) => ({
                  value: d.id,
                  label: d.name,
                  hint: d.specialty,
                })),
              ]}
            />
            <Select
              value={serviceId}
              onValueChange={setServiceId}
              ariaLabel="Filter by service"
              options={[
                { value: "all", label: t("appt.allServices") },
                ...services.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="me-1 text-[0.75rem] text-ink-muted">{t("appt.statusFilter")}</span>
            {STATUSES.map((s) => {
              const on = statuses.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full transition-opacity",
                    on ? "opacity-100" : "opacity-40 hover:opacity-70"
                  )}
                >
                  <StatusBadge status={s} />
                </button>
              );
            })}
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="ms-auto"
              >
                <X />
                {t("appt.clearAll")}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Summary({ list }: { list: Appointment[] }) {
  const { t } = useI18n();
  const count = (s: AppointmentStatus) =>
    list.filter((a) => a.status === s).length;
  const items = [
    { label: t("status.scheduled"), value: list.length },
    { label: t("status.confirmed"), value: count("confirmed") },
    { label: t("status.completed"), value: count("completed") },
    { label: t("status.cancelled"), value: count("cancelled") + count("no_show") },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((i) => (
        <div
          key={i.label}
          className="rounded-card border border-line bg-surface px-4 py-3"
        >
          <p className="text-[0.75rem] text-ink-muted">{i.label}</p>
          <p data-metric className="mt-0.5 text-title text-ink">
            {i.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Module() {
  const { appointments } = useAppointments();

  const [view, setView] = React.useState<View>("day");
  const [cursor, setCursor] = React.useState(TODAY);
  const [doctorId, setDoctorId] = React.useState("all");
  const [serviceId, setServiceId] = React.useState("all");
  const [statuses, setStatuses] = React.useState<AppointmentStatus[]>([]);
  const [query, setQuery] = React.useState("");

  const [selected, setSelected] = React.useState<Appointment | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [seed, setSeed] = React.useState<FormSeed>({});

  const toggleStatus = (s: AppointmentStatus) =>
    setStatuses((all) =>
      all.includes(s) ? all.filter((x) => x !== s) : [...all, s]
    );

  const reset = () => {
    setDoctorId("all");
    setServiceId("all");
    setStatuses([]);
    setQuery("");
  };

  const activeFilters =
    (doctorId !== "all" ? 1 : 0) +
    (serviceId !== "all" ? 1 : 0) +
    (statuses.length ? 1 : 0) +
    (query.trim() ? 1 : 0);

  /** Filters apply to every view; the view then narrows by date. */
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (doctorId !== "all" && a.doctorId !== doctorId) return false;
      if (serviceId !== "all" && a.serviceId !== serviceId) return false;
      if (statuses.length && !statuses.includes(a.status)) return false;
      if (
        q &&
        !a.patient.name.toLowerCase().includes(q) &&
        !a.service.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [appointments, doctorId, serviceId, statuses, query]);

  const inRange = React.useMemo(() => {
    if (view === "day") return filtered.filter((a) => dayKey(a.start) === cursor);
    if (view === "week") {
      const days = new Set(weekDays(cursor));
      return filtered.filter((a) => days.has(dayKey(a.start)));
    }
    const month = cursor.slice(0, 7);
    return filtered.filter((a) => a.start.startsWith(month));
  }, [filtered, view, cursor]);

  const visibleDoctors =
    doctorId === "all" ? doctors : doctors.filter((d) => d.id === doctorId);

  const openCreate = (seedValue: FormSeed = {}) => {
    setSeed(seedValue);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <Toolbar
        view={view}
        setView={setView}
        cursor={cursor}
        setCursor={setCursor}
        doctorId={doctorId}
        setDoctorId={setDoctorId}
        serviceId={serviceId}
        setServiceId={setServiceId}
        statuses={statuses}
        toggleStatus={toggleStatus}
        query={query}
        setQuery={setQuery}
        onReset={reset}
        activeFilters={activeFilters}
        onCreate={() => openCreate({ start: `${cursor}T09:00:00.000Z` })}
      />

      <Summary list={inRange} />

      {view === "week" && doctorId === "all" && (
        <p className="flex items-center gap-2 rounded-field border border-line bg-surface px-3 py-2 text-[0.75rem] text-ink-muted">
          <CalendarDays className="size-3.5 shrink-0 text-forest-500" />
          Showing all six clinicians. Filter to one clinician for the
          hour-by-hour week timeline.
        </p>
      )}

      <Card className="overflow-hidden">
        {inRange.length === 0 && activeFilters > 0 ? (
          <NoResults onReset={reset} />
        ) : view === "day" ? (
          <DayView
            date={cursor}
            doctors={visibleDoctors}
            appointments={inRange}
            onSelect={setSelected}
            onCreateAt={(dId, start) => openCreate({ doctorId: dId, start })}
          />
        ) : view === "week" ? (
          <WeekView
            date={cursor}
            appointments={inRange}
            doctorsById={doctorsById}
            onSelect={setSelected}
            timeline={doctorId !== "all"}
          />
        ) : (
          <MonthView
            date={cursor}
            appointments={inRange}
            onSelect={setSelected}
            onPickDay={(d) => {
              setCursor(d);
              setView("day");
            }}
          />
        )}
      </Card>

      <p className="flex items-center gap-2 text-[0.75rem] text-ink-muted">
        <CalendarDays className="size-3.5" />
        Changes are held in this browser session only — no backend is connected
        yet, so a reload restores the sample book.
      </p>

      <AppointmentDrawer
        appointment={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onEdit={(a) => {
          setSelected(null);
          openCreate({ appointment: a });
        }}
      />

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        seed={seed}
      />
    </div>
  );
}

export function AppointmentsModule() {
  return (
    <AppointmentsProvider patients={patients} services={services}>
      <Module />
    </AppointmentsProvider>
  );
}
