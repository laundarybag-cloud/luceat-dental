"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  FileText,
  KeyRound,
  LogIn,
  MoreHorizontal,
  Pencil,
  Search,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UserRoundX,
  History,
} from "lucide-react";
import { ROLES, ROLE_META } from "@/lib/access";
import {
  USER_STATUS_META,
  accessHistory,
  staffUsers,
  type HistoryKind,
  type StaffUser,
} from "@/lib/mock/users";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole, RoleChip } from "@/components/access/role-context";
import { fmtDate } from "@/components/patients/patients-register";
import { PermissionMatrix } from "./permission-matrix";
import { SuspendUserDialog, UserFormDialog } from "./user-form";
import { useI18n } from "@/components/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n";

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-[0.75rem] text-ink-muted">{label}</p>
      <p data-metric className="mt-0.5 text-title text-ink">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">{hint}</p>
    </div>
  );
}

const HISTORY_META: Record<
  HistoryKind,
  { icon: React.ReactNode; chip: string; labelKey: MessageKey }
> = {
  sign_in: {
    icon: <LogIn />,
    chip: "bg-status-completed-bg text-status-completed",
    labelKey: "users.signIn",
  },
  sign_in_failed: {
    icon: <ShieldAlert />,
    chip: "bg-status-pending-bg text-status-pending",
    labelKey: "users.failedSignIn",
  },
  role_changed: {
    icon: <ShieldCheck />,
    chip: "bg-status-checkedin-bg text-status-checkedin",
    labelKey: "users.roleChange",
  },
  permission_changed: {
    icon: <KeyRound />,
    chip: "bg-status-progress-bg text-status-progress",
    labelKey: "users.permissionChange",
  },
  user_invited: {
    icon: <UserPlus />,
    chip: "bg-forest-50 text-forest-700",
    labelKey: "users.invitation",
  },
  user_suspended: {
    icon: <UserRoundX />,
    chip: "bg-status-cancelled-bg text-status-cancelled",
    labelKey: "users.suspension",
  },
  record_opened: {
    icon: <FileText />,
    chip: "bg-surface-sunken text-ink-soft",
    labelKey: "users.recordAccess",
  },
};

function AccessHistory() {
  const { t } = useI18n();
  const [kind, setKind] = React.useState("all");
  const rows = accessHistory.filter((h) => kind === "all" || h.kind === kind);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem]">
          <p className="self-center text-[0.75rem] text-ink-muted">
            Sign-ins, role and permission changes, and every time a clinical
            record was opened. Retained for seven years.
          </p>
          <Select
            value={kind}
            onValueChange={setKind}
            ariaLabel="Filter history"
            options={[
              { value: "all", label: t("users.allActivity") },
              { value: "sign_in", label: t("users.signIns") },
              { value: "sign_in_failed", label: t("users.failedSignIns") },
              { value: "role_changed", label: t("users.roleChanges") },
              { value: "permission_changed", label: t("users.permissionChanges") },
              { value: "record_opened", label: t("users.recordAccess") },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((h) => {
              const meta = HISTORY_META[h.kind];
              return (
                <li key={h.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5",
                      meta.chip
                    )}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small text-ink">
                      <span className="font-medium">{h.actor}</span>{" "}
                      <span className="text-ink-soft">{h.detail}</span>
                    </p>
                    <p className="mt-0.5 text-[0.75rem] tabular-nums text-ink-faint">
                      {fmtDate(h.at)} at {h.time}
                      {h.ip ? ` · ${h.ip}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-[0.6875rem] font-medium text-ink-soft">
                    {t(meta.labelKey)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            compact
            illustration={
              <span className="flex size-10 items-center justify-center rounded-full bg-forest-50">
                <History className="size-4 text-forest-400" />
              </span>
            }
            title={t("users.nothingOfKind")}
            description={t("users.tryAnotherActivity")}
          />
        )}
      </Card>

      <p className="text-[0.75rem] text-ink-muted">
        This sample history is illustrative. Real entries are written
        server-side and cannot be edited or deleted from this screen.
      </p>
    </div>
  );
}

function UsersList() {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const { matrix } = useRole();
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StaffUser | undefined>();
  const [suspending, setSuspending] = React.useState<StaffUser | null>(null);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return staffUsers.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (status !== "all" && u.status !== status) return false;
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, roleFilter, status]);

  const columns: Column<StaffUser>[] = [
    {
      id: "name",
      header: t("col.teamMember"),
      sortBy: (u) => u.name,
      cell: (u) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={u.avatar} name={u.name} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate font-medium text-ink">{u.name}</span>
              {u.doctorId && (
                <Tooltip content={t("hint.alsoClinician")}>
                  <Stethoscope className="size-3 shrink-0 text-ink-faint" />
                </Tooltip>
              )}
            </span>
            <span className="block truncate text-[0.75rem] text-ink-faint">
              {u.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "role",
      header: t("userForm.role"),
      sortBy: (u) => t(ROLE_META[u.role].labelKey),
      cell: (u) => <RoleChip role={u.role} />,
    },
    {
      id: "permissions",
      header: t("col.permissions"),
      align: "end",
      hideBelow: "xl",
      sortBy: (u) => matrix[u.role].length,
      cell: (u) => (
        <span className="tabular-nums text-ink-muted">
          {matrix[u.role].length}
        </span>
      ),
    },
    {
      id: "branch",
      header: t("userForm.branch"),
      hideBelow: "lg",
      sortBy: (u) => u.branch,
      cell: (u) => u.branch,
    },
    {
      id: "2fa",
      header: t("col.twoFa"),
      hideBelow: "xl",
      sortBy: (u) => (u.twoFactor ? 1 : 0),
      cell: (u) =>
        u.twoFactor ? (
          <span className="inline-flex items-center gap-1 text-[0.75rem] text-status-completed">
            <Check className="size-3.5" />
            On
          </span>
        ) : (
          <Tooltip content={t("users.noTwoFa")}>
            <span className="inline-flex items-center gap-1 text-[0.75rem] text-status-pending">
              <ShieldAlert className="size-3.5" />
              {t("common.off")}
            </span>
          </Tooltip>
        ),
    },
    {
      id: "active",
      header: t("col.lastActive"),
      hideBelow: "md",
      sortBy: (u) => u.lastActive ?? "",
      cell: (u) =>
        u.lastActive ? (
          <span className="tabular-nums">{fmtDate(u.lastActive)}</span>
        ) : (
          <span className="text-ink-faint">{t("users.neverSignedIn")}</span>
        ),
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (u) => u.status,
      cell: (u) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-5",
            USER_STATUS_META[u.status].chip
          )}
        >
          {t(USER_STATUS_META[u.status].labelKey)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "end",
      cell: (u) => (
        <Menu>
          <MenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${u.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem
              onClick={() => {
                setEditing(u);
                setFormOpen(true);
              }}
            >
              <Pencil /> {t("users.editUser")}
            </MenuItem>
            {u.doctorId && (
              <MenuItem asChild>
                <Link href={`/doctors/${u.doctorId}`}>
                  <Stethoscope /> {t("users.openClinicianProfile")}
                </Link>
              </MenuItem>
            )}
            <MenuItem
              onClick={() =>
                toast({
                  tone: "info",
                  title: t("users.resetNotSent"),
                  detail: t("users.resetBody"),
                })
              }
            >
              <KeyRound /> {t("users.sendReset")}
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              tone={u.status === "suspended" ? undefined : "danger"}
              onClick={() => setSuspending(u)}
            >
              {u.status === "suspended" ? <Check /> : <UserRoundX />}
              {u.status === "suspended" ? "Restore account" : "Suspend account"}
            </MenuItem>
          </MenuContent>
        </Menu>
      ),
    },
  ];

  const active = staffUsers.filter((u) => u.status === "active").length;
  const noTwoFactor = staffUsers.filter(
    (u) => !u.twoFactor && u.status !== "suspended"
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t("users.activeAccounts")}
          value={String(active)}
          hint={t("h.ofInTeam", { count: fmt.number(staffUsers.length) })}
        />
        <Stat
          label={t("users.awaitingInvitation")}
          value={String(staffUsers.filter((u) => u.status === "invited").length)}
          hint={t("users.notYetSignedIn")}
        />
        <Stat
          label={t("users.withoutTwoFa")}
          value={String(noTwoFactor)}
          hint={noTwoFactor ? t("records.clinicalReachable") : "Everyone enrolled"}
        />
        <Stat
          label={t("users.rolesInUse")}
          value={String(new Set(staffUsers.map((u) => u.role)).size)}
          hint={t("h.ofDefined", { count: fmt.number(ROLES.length) })}
        />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("users.searchPlaceholder")}
              className="ps-9"
              aria-label={t("users.search")}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
            ariaLabel="Filter by role"
            options={[
              { value: "all", label: t("users.allRoles") },
              ...ROLES.map((r) => ({ value: r, label: t(ROLE_META[r].labelKey) })),
            ]}
          />
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              { value: "active", label: t("common.active") },
              { value: "invited", label: t("users.invited") },
              { value: "suspended", label: t("users.suspended") },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(u) => u.id}
          onRowClick={(u) => {
            setEditing(u);
            setFormOpen(true);
          }}
          caption={t("cap.users")}
          pageSize={10}
          empty={
            <EmptyState
              illustration={
                <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                  <SearchX className="size-5 text-forest-400" />
                </span>
              }
              title={t("users.empty.title")}
              description={t("users.empty.body")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setRoleFilter("all");
                    setStatus("all");
                  }}
                >
                  {t("appt.clearFilters")}
                </Button>
              }
            />
          }
        />
      </Card>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
      />
      <SuspendUserDialog
        user={suspending}
        onOpenChange={(open) => !open && setSuspending(null)}
      />
    </div>
  );
}

export function UsersModule() {
  const { t, fmt } = useI18n();
  const [formOpen, setFormOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink">{t("users.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("h.accountsAcrossRoles", {
              count: fmt.number(staffUsers.length),
              roles: fmt.number(ROLES.length),
            })}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setFormOpen(true)}>
          <UserPlus />
          {t("users.invite")}
        </Button>
      </div>

      <Tabs defaultValue="users" className="min-w-0">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="users">{t("users.team")}</TabsTrigger>
            <TabsTrigger value="matrix">{t("users.permissionMatrix")}</TabsTrigger>
            <TabsTrigger value="history">{t("users.accessHistory")}</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="users">
            <UsersList />
          </TabsContent>
          <TabsContent value="matrix">
            <PermissionMatrix />
          </TabsContent>
          <TabsContent value="history">
            <AccessHistory />
          </TabsContent>
        </div>
      </Tabs>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
