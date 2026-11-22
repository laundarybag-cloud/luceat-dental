"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Download,
  UserRoundX,
  Phone,
  Mail,
  CalendarPlus,
  FileHeart,
  MoreHorizontal,
} from "lucide-react";
import {
  PATIENT_STATUS_META,
  patientRecords,
  type PatientRecord,
  type PatientStatus,
} from "@/lib/mock/patients";
import { doctorById } from "@/lib/mock/clinic";
import { patientBalance } from "@/lib/mock/billing";
import { formatTime } from "@/lib/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/primitives";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/locale-context";

const shortDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const fmtDate = (iso?: string) =>
  iso ? shortDate.format(new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)) : "—";

function StatusChip({ status }: { status: PatientStatus }) {
  const { t } = useI18n();
  const meta = PATIENT_STATUS_META[status];
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

export function PatientsRegister() {
  const { t, fmt } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [doctor, setDoctor] = React.useState("all");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return patientRecords.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (doctor !== "all" && p.primaryDoctorId !== doctor) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.ref.toLowerCase().includes(q) &&
        !p.phone.includes(q) &&
        !p.email.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, status, doctor]);

  const activeFilters =
    (status !== "all" ? 1 : 0) + (doctor !== "all" ? 1 : 0) + (query.trim() ? 1 : 0);

  const reset = () => {
    setQuery("");
    setStatus("all");
    setDoctor("all");
  };

  const columns: Column<PatientRecord>[] = [
    {
      id: "name",
      header: t("col.patient"),
      sortBy: (p) => p.name,
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={p.avatar} name={p.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{p.name}</span>
            <span className="block truncate text-[0.75rem] tabular-nums text-ink-faint">
              {t("patients.refAge", {
                ref: p.ref,
                age: fmt.number(p.age),
              })}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "contact",
      header: t("col.contact"),
      hideBelow: "lg",
      sortBy: (p) => p.email,
      cell: (p) => (
        <span className="block min-w-0">
          <span dir="ltr" className="block truncate text-start tabular-nums">
            {p.phone}
          </span>
          <span className="block truncate text-[0.75rem] text-ink-faint">
            {p.email}
          </span>
        </span>
      ),
    },
    {
      id: "doctor",
      header: t("patients.primaryClinician"),
      hideBelow: "xl",
      sortBy: (p) => doctorById(p.primaryDoctorId)?.name ?? "",
      cell: (p) => {
        const d = doctorById(p.primaryDoctorId);
        return d ? (
          <span className="flex items-center gap-2">
            <Avatar src={d.avatar} name={d.name} size="xs" />
            <span className="truncate">{d.name.replace("Dr. ", "Dr ")}</span>
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      id: "last",
      header: t("col.lastVisit"),
      hideBelow: "md",
      sortBy: (p) => p.lastVisit ?? "",
      cell: (p) => <span className="tabular-nums">{fmtDate(p.lastVisit)}</span>,
    },
    {
      id: "next",
      header: t("patients.nextAppointment"),
      hideBelow: "sm",
      sortBy: (p) => p.nextAppointment ?? "9999",
      cell: (p) =>
        p.nextAppointment ? (
          <span className="tabular-nums text-ink">
            {fmtDate(p.nextAppointment)}
            <span className="text-ink-faint"> · {formatTime(p.nextAppointment)}</span>
          </span>
        ) : (
          <span className="text-ink-faint">{t("patients.notBooked")}</span>
        ),
    },
    {
      id: "balance",
      header: t("col.balance"),
      align: "end",
      hideBelow: "lg",
      sortBy: (p) => patientBalance(p.id),
      cell: (p) => {
        const owed = patientBalance(p.id);
        return (
          <span
            className={cn(
              "tabular-nums",
              owed > 0 ? "font-semibold text-status-pending" : "text-ink-faint"
            )}
          >
            {owed > 0 ? formatMoney(owed) : "—"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (p) => p.status,
      cell: (p) => <StatusChip status={p.status} />,
    },
    {
      id: "actions",
      header: "",
      align: "end",
      cell: (p) => (
        <Menu>
          <MenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${p.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onClick={() => router.push(`/patients/${p.id}`)}>
              <FileHeart /> {t("patients.openChart")}
            </MenuItem>
            <MenuItem onClick={() => router.push("/appointments")}>
              <CalendarPlus /> {t("patients.bookAppointment")}
            </MenuItem>
            <MenuSeparator />
            <MenuItem>
              <Phone /> Call {p.phone}
            </MenuItem>
            <MenuItem>
              <Mail /> {t("patients.emailPatient")}
            </MenuItem>
          </MenuContent>
        </Menu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink">{t("patients.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("patients.subtitle", {
              count: fmt.number(patientRecords.length),
              overdue: fmt.number(
                patientRecords.filter((p) => p.status === "overdue").length
              ),
            })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() =>
            toast({
              tone: "info",
              title: t("patients.exportNotWired"),
              detail: t("patients.exportNotWiredBody"),
            })
          }
        >
          <Download />
          {t("common.export")}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() =>
            toast({
              tone: "info",
              title: t("patients.intakeNeedsBackend"),
              detail: t("patients.intakeNeedsBackendBody"),
            })
          }
        >
          <UserPlus />
          {t("patients.add")}
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("patients.searchPlaceholder")}
              className="ps-9"
              aria-label={t("patients.search")}
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              ...(
                Object.keys(PATIENT_STATUS_META) as PatientStatus[]
              ).map((s) => ({
                value: s,
                label: t(PATIENT_STATUS_META[s].labelKey),
              })),
            ]}
          />
          <Select
            value={doctor}
            onValueChange={setDoctor}
            ariaLabel="Filter by primary clinician"
            options={[
              { value: "all", label: t("appt.allClinicians") },
              ...[
                "d1",
                "d2",
                "d3",
                "d4",
                "d5",
                "d6",
              ].map((id) => ({
                value: id,
                label: doctorById(id)?.name ?? id,
              })),
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(p) => p.id}
          onRowClick={(p) => router.push(`/patients/${p.id}`)}
          caption={t("patients.caption")}
          pageSize={10}
          empty={
            <EmptyState
              illustration={
                <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                  <UserRoundX className="size-5 text-forest-400" />
                </span>
              }
              title={t("patients.empty.title")}
              description={t("patients.empty.body")}
              action={
                activeFilters ? (
                  <Button variant="secondary" size="sm" onClick={reset}>
                    {t("appt.clearFilters")}
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </Card>

      <p className="text-[0.75rem] text-ink-muted">
        Showing sample records held in this browser session — no patient data is
        stored or transmitted.
      </p>
    </div>
  );
}

export { fmtDate, StatusChip };
