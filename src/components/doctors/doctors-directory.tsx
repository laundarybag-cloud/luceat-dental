"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  LayoutGrid,
  Mail,
  MoreHorizontal,
  Phone,
  Rows3,
  Search,
  Star,
  UserPlus,
  UserRoundX,
} from "lucide-react";
import {
  DOCTOR_STATUS_META,
  doctorProfiles,
  summariseSchedule,
  weeklyHours,
  type DoctorProfile,
  type DoctorStatus,
} from "@/lib/mock/doctors";
import { weekAppointments } from "@/lib/mock/schedule";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { DoctorFormDialog } from "./doctor-form";
import { useI18n } from "@/components/i18n/locale-context";
import { pickText } from "@/lib/mock/localize";
import { DOCTOR_TITLE_AR, BRANCH_AR } from "@/lib/mock/content-ar";

/** Appointments this week, per clinician — derived, never hardcoded. */
const weekLoad = new Map<string, number>();
for (const a of weekAppointments) {
  weekLoad.set(a.doctorId, (weekLoad.get(a.doctorId) ?? 0) + 1);
}

export function StatusChip({ status }: { status: DoctorStatus }) {
  const { t } = useI18n();
  const meta = DOCTOR_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-5",
        meta.chip
      )}
    >
      {t(meta.labelKey)}
    </span>
  );
}

function DoctorCard({ doctor }: { doctor: DoctorProfile }) {
  const { t } = useI18n();
  const load = weekLoad.get(doctor.id) ?? 0;
  return (
    <Card interactive className="flex flex-col overflow-hidden">
      <Link href={`/doctors/${doctor.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start gap-3.5 p-4">
          <Avatar
            src={doctor.avatar}
            name={doctor.name}
            size="xl"
            status={doctor.status === "active" && doctor.online ? "online" : undefined}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-card text-ink">{doctor.name}</p>
            <p className="truncate text-small text-forest-600">{pickText(doctor.title, DOCTOR_TITLE_AR)}</p>
            <p className="mt-1 truncate text-[0.75rem] text-ink-faint">
              {doctor.ref} · {pickText(doctor.branch, BRANCH_AR)}
            </p>
            <div className="mt-2">
              <StatusChip status={doctor.status} />
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-line px-4 py-3">
          <p className="flex items-center gap-2 truncate text-[0.75rem] text-ink-muted">
            <CalendarClock className="size-3.5 shrink-0" />
            <span className="truncate">{summariseSchedule(doctor.schedule)}</span>
          </p>
          <p className="flex items-center gap-2 truncate text-[0.75rem] text-ink-muted">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{doctor.email}</span>
          </p>
          <p
            dir="ltr"
            className="flex items-center gap-2 truncate text-start text-[0.75rem] tabular-nums text-ink-muted"
          >
            <Phone className="size-3.5 shrink-0" />
            {doctor.phone}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-3 border-t border-line">
          <div className="border-e border-line px-3 py-2.5 text-center">
            <p data-metric className="text-small font-semibold text-ink">
              {load}
            </p>
            <p className="text-[0.625rem] uppercase tracking-[0.06em] text-ink-faint">
              {t("doctors.thisWeek")}
            </p>
          </div>
          <div className="border-e border-line px-3 py-2.5 text-center">
            <p data-metric className="text-small font-semibold text-ink">
              {doctor.utilisation}%
            </p>
            <p className="text-[0.625rem] uppercase tracking-[0.06em] text-ink-faint">
              {t("doctors.utilisation")}
            </p>
          </div>
          <div className="px-3 py-2.5 text-center">
            <p className="flex items-center justify-center gap-1 text-small font-semibold tabular-nums text-ink">
              <Star className="size-3 fill-gold-300 text-gold-300" />
              {doctor.rating}
            </p>
            <p className="text-[0.625rem] uppercase tracking-[0.06em] text-ink-faint">
              {t("doctors.rating")}
            </p>
          </div>
        </div>
      </Link>
    </Card>
  );
}

export function DoctorsDirectory() {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [branch, setBranch] = React.useState("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DoctorProfile | undefined>();

  const branches = React.useMemo(
    () => Array.from(new Set(doctorProfiles.map((d) => d.branch))),
    []
  );

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctorProfiles.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (branch !== "all" && d.branch !== branch) return false;
      if (
        q &&
        !d.name.toLowerCase().includes(q) &&
        !d.specialty.toLowerCase().includes(q) &&
        !d.email.toLowerCase().includes(q) &&
        !d.specialties.join(" ").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, status, branch]);

  const reset = () => {
    setQuery("");
    setStatus("all");
    setBranch("all");
  };
  const activeFilters =
    (status !== "all" ? 1 : 0) + (branch !== "all" ? 1 : 0) + (query.trim() ? 1 : 0);

  const columns: Column<DoctorProfile>[] = [
    {
      id: "name",
      header: t("col.clinician"),
      sortBy: (d) => d.name,
      cell: (d) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={d.avatar} name={d.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{d.name}</span>
            <span className="block truncate text-[0.75rem] text-ink-faint">
              {d.ref} · {d.title}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "specialty",
      header: t("col.specialty"),
      hideBelow: "md",
      sortBy: (d) => d.specialty,
      cell: (d) => d.specialty,
    },
    {
      id: "contact",
      header: t("col.contact"),
      hideBelow: "xl",
      sortBy: (d) => d.email,
      cell: (d) => (
        <span className="block min-w-0">
          <span dir="ltr" className="block truncate text-start tabular-nums">
            {d.phone}
          </span>
          <span className="block truncate text-[0.75rem] text-ink-faint">
            {d.email}
          </span>
        </span>
      ),
    },
    {
      id: "schedule",
      header: t("col.workingHours"),
      hideBelow: "lg",
      sortBy: (d) => weeklyHours(d.schedule),
      cell: (d) => (
        <span className="block min-w-0">
          <span className="block truncate">{summariseSchedule(d.schedule)}</span>
          <span className="block text-[0.75rem] tabular-nums text-ink-faint">
            {weeklyHours(d.schedule).toFixed(1)} h / week
          </span>
        </span>
      ),
    },
    {
      id: "load",
      header: t("patients.tab.appointments"),
      align: "end",
      hideBelow: "sm",
      sortBy: (d) => weekLoad.get(d.id) ?? 0,
      cell: (d) => (
        <span className="tabular-nums">{weekLoad.get(d.id) ?? 0}</span>
      ),
    },
    {
      id: "utilisation",
      header: t("doctors.utilisation"),
      hideBelow: "lg",
      sortBy: (d) => d.utilisation,
      cell: (d) => (
        <span className="flex items-center justify-end gap-2">
          <Progress value={d.utilisation} className="w-16" />
          <span className="w-9 text-end tabular-nums">{d.utilisation}%</span>
        </span>
      ),
      align: "end",
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (d) => d.status,
      cell: (d) => <StatusChip status={d.status} />,
    },
    {
      id: "actions",
      header: "",
      align: "end",
      cell: (d) => (
        <Menu>
          <MenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${d.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onClick={() => router.push(`/doctors/${d.id}`)}>
              <Rows3 /> {t("doctors.openProfile")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                setEditing(d);
                setFormOpen(true);
              }}
            >
              <CalendarClock /> {t("doctors.editSchedule")}
            </MenuItem>
            <MenuSeparator />
            <MenuItem>
              <Mail /> Email {d.email}
            </MenuItem>
          </MenuContent>
        </Menu>
      ),
    },
  ];

  const emptyState = (
    <EmptyState
      illustration={
        <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
          <UserRoundX className="size-5 text-forest-400" />
        </span>
      }
      title={t("doctors.empty.title")}
      description={t("doctors.empty.body")}
      action={
        activeFilters ? (
          <Button variant="secondary" size="sm" onClick={reset}>
            {t("appt.clearFilters")}
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink">{t("doctors.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("doctors.subtitle", {
              active: fmt.number(
                doctorProfiles.filter((d) => d.status === "active").length
              ),
              total: fmt.number(doctorProfiles.length),
              branches: fmt.number(branches.length),
            })}
          </p>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "cards" | "table")}>
          <TabsList>
            <TabsTrigger value="cards" aria-label={t("doctors.cardView")}>
              <LayoutGrid className="size-3.5" />
            </TabsTrigger>
            <TabsTrigger value="table" aria-label={t("doctors.tableView")}>
              <Rows3 className="size-3.5" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <UserPlus />
          {t("doctors.add")}
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("doctors.searchPlaceholder")}
              className="ps-9"
              aria-label={t("doctors.search")}
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              { value: "active", label: t("common.active") },
              { value: "leave", label: t("doctors.onLeave") },
              { value: "inactive", label: t("common.inactive") },
            ]}
          />
          <Select
            value={branch}
            onValueChange={setBranch}
            ariaLabel="Filter by branch"
            options={[
              { value: "all", label: t("doctors.allBranches") },
              ...branches.map((b) => ({ value: b, label: b })),
            ]}
          />
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card>{emptyState}</Card>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            rows={rows}
            columns={columns}
            getRowId={(d) => d.id}
            onRowClick={(d) => router.push(`/doctors/${d.id}`)}
            caption={t("cap.doctors")}
            pageSize={10}
            empty={emptyState}
          />
        </Card>
      )}

      <DoctorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        doctor={editing}
      />
    </div>
  );
}
