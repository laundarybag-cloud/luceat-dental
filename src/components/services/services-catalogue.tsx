"use client";

import * as React from "react";
import Image from "next/image";
import {
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Rows3,
  Search,
  SearchX,
  Tags,
  Trash2,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import {
  catalogue,
  categories,
  categoryStats,
  isBookable,
  type CatalogueEntry,
} from "@/lib/mock/catalogue";
import { doctorProfileById } from "@/lib/mock/doctors";
import { weekAppointments } from "@/lib/mock/schedule";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { AvatarStack } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { ServiceCard, NoImageTile } from "./service-card";
import { DeleteServiceDialog, ServiceFormDialog } from "./service-form";
import { useI18n } from "@/components/i18n/locale-context";

/** Bookings per service in the current week — derived, not invented. */
const bookings = new Map<string, number>();
for (const a of weekAppointments) {
  if (a.serviceId) bookings.set(a.serviceId, (bookings.get(a.serviceId) ?? 0) + 1);
}

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

export function ServicesCatalogue() {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CatalogueEntry | undefined>();
  const [focusAssignments, setFocusAssignments] = React.useState(false);
  const [deleting, setDeleting] = React.useState<CatalogueEntry | null>(null);
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (status === "active" && !s.active) return false;
      if (status === "inactive" && s.active) return false;
      if (status === "unbookable" && isBookable(s)) return false;
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.category.toLowerCase().includes(q) &&
        !s.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, category, status]);

  const reset = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
  };
  const activeFilters =
    (category !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0) + (query.trim() ? 1 : 0);

  const openCreate = () => {
    setEditing(undefined);
    setFocusAssignments(false);
    setFormOpen(true);
  };
  const openEdit = (e: CatalogueEntry) => {
    setEditing(e);
    setFocusAssignments(false);
    setFormOpen(true);
  };
  const openAssign = (e: CatalogueEntry) => {
    setEditing(e);
    setFocusAssignments(true);
    setFormOpen(true);
  };

  const unbookable = catalogue.filter((s) => !isBookable(s));
  const avgPrice =
    catalogue.reduce((sum, s) => sum + s.price, 0) / catalogue.length;

  const columns: Column<CatalogueEntry>[] = [
    {
      id: "name",
      header: t("col.service"),
      sortBy: (s) => s.name,
      cell: (s) => (
        <span className="flex min-w-0 items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-field bg-surface-sunken">
            {s.image ? (
              <Image src={s.image} alt="" fill sizes="40px" className="object-cover" />
            ) : (
              <NoImageTile className="gap-0 [&>span]:hidden" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">{s.name}</span>
            <span className="block truncate text-[0.75rem] text-ink-faint">
              {s.category}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "duration",
      header: t("col.duration"),
      align: "end",
      hideBelow: "sm",
      sortBy: (s) => s.durationMin,
      cell: (s) => (
        <span className="tabular-nums">
          {s.durationMin} min
          {s.bufferMin > 0 && (
            <span className="text-ink-faint"> +{s.bufferMin}</span>
          )}
        </span>
      ),
    },
    {
      id: "price",
      header: t("serviceForm.price"),
      align: "end",
      sortBy: (s) => s.price,
      cell: (s) => (
        <span className="font-semibold tabular-nums text-ink">
          {formatMoney(s.price)}
        </span>
      ),
    },
    {
      id: "doctors",
      header: t("col.clinicians"),
      hideBelow: "lg",
      sortBy: (s) => s.doctorIds.length,
      cell: (s) =>
        s.doctorIds.length ? (
          <AvatarStack
            people={s.doctorIds.map((id) => {
              const d = doctorProfileById(id);
              return { name: d?.name ?? id, avatar: d?.avatar };
            })}
            max={3}
            size="xs"
          />
        ) : (
          <span className="text-ink-faint">{t("common.none")}</span>
        ),
    },
    {
      id: "bookings",
      header: t("col.booked"),
      align: "end",
      hideBelow: "xl",
      sortBy: (s) => bookings.get(s.id) ?? 0,
      cell: (s) => (
        <span className="tabular-nums">{bookings.get(s.id) ?? 0}</span>
      ),
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (s) => (isBookable(s) ? "1" : s.active ? "2" : "3"),
      cell: (s) =>
        isBookable(s) ? (
          <span className="inline-flex rounded-full bg-status-confirmed-bg px-2 py-0.5 text-[0.75rem] font-medium text-status-confirmed">
            {t("services.bookable")}
          </span>
        ) : s.active ? (
          <Tooltip content={t("svc.noAvailableClinician")}>
            <span className="inline-flex items-center gap-1 rounded-full bg-status-pending-bg px-2 py-0.5 text-[0.75rem] font-medium text-status-pending">
              <AlertTriangle className="size-3" />
              {t("services.unbookable")}
            </span>
          </Tooltip>
        ) : (
          <span className="inline-flex rounded-full bg-status-noshow-bg px-2 py-0.5 text-[0.75rem] font-medium text-status-noshow">
            {t("common.inactive")}
          </span>
        ),
    },
    {
      id: "actions",
      header: "",
      align: "end",
      cell: (s) => (
        <Menu>
          <MenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${s.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal />
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onClick={() => openEdit(s)}>
              <Pencil /> {t("services.edit")}
            </MenuItem>
            <MenuItem onClick={() => openAssign(s)}>
              <UserPlus /> {t("services.assignClinicians")}
            </MenuItem>
            <MenuSeparator />
            <MenuItem tone="danger" onClick={() => setDeleting(s)}>
              <Trash2 /> {t("services.delete")}
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
          <SearchX className="size-5 text-forest-400" />
        </span>
      }
      title={t("services.empty.title")}
      description={t("services.empty.body")}
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
          <h1 className="text-title text-ink">{t("services.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("services.subtitle", {
              count: fmt.number(catalogue.length),
              categories: fmt.number(categories.length),
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
          variant="secondary"
          size="md"
          onClick={() => setCategoriesOpen((v) => !v)}
        >
          <Tags />
          {t("services.categories")}
        </Button>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus />
          {t("services.add")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t("services.bookableNow")}
          value={String(catalogue.filter(isBookable).length)}
          hint={t("h.ofInCatalogue", { count: fmt.number(catalogue.length) })}
        />
        <Stat
          label={t("services.needsAttention")}
          value={String(unbookable.length)}
          hint={
            unbookable.length
              ? unbookable.map((s) => s.name).join(", ")
              : t("empty.everyServiceBookable")
          }
        />
        <Stat
          label={t("services.averagePrice")}
          value={formatMoney(avgPrice)}
          hint={t("services.acrossAll")}
        />
        <Stat
          label={t("services.bookedThisWeek")}
          value={String(weekAppointments.length)}
          hint={t("services.apptsAcrossAll")}
        />
      </div>

      {categoriesOpen && (
        <Card className="animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-card text-ink">{t("services.serviceCategories")}</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast({
                  tone: "info",
                  title: t("services.categoriesServerSide"),
                  detail: t("services.addCategoryBody"),
                })
              }
            >
              <Plus />
              {t("services.newCategory")}
            </Button>
          </div>
          <ul className="divide-y divide-line">
            {categoryStats().map((c) => (
              <li
                key={c.name}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-canvas"
              >
                <button
                  onClick={() => {
                    setCategory(c.name);
                    setCategoriesOpen(false);
                  }}
                  className="min-w-0 flex-1 text-start"
                >
                  <span className="block truncate text-small font-medium text-ink">
                    {c.name}
                  </span>
                  <span className="block truncate text-[0.75rem] text-ink-muted">
                    {c.blurb}
                  </span>
                </button>
                <span className="shrink-0 text-[0.75rem] tabular-nums text-ink-muted">
                  {c.active}/{c.total} active
                </span>
                <Menu>
                  <MenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${c.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem
                      onClick={() =>
                        toast({
                          tone: "info",
                          title: t("services.renameNeedsBackend"),
                          detail: t("services.nothingChanged"),
                        })
                      }
                    >
                      <Pencil /> {t("common.rename")}
                    </MenuItem>
                    <MenuItem
                      tone="danger"
                      disabled={c.total > 0}
                      onClick={() =>
                        toast({
                          tone: "info",
                          title: t("services.notDeleted"),
                          detail: t("services.categoriesServerSideBody"),
                        })
                      }
                    >
                      <Trash2 />
                      {c.total > 0 ? `In use by ${c.total}` : "Delete"}
                    </MenuItem>
                  </MenuContent>
                </Menu>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("services.searchPlaceholder")}
              className="ps-9"
              aria-label={t("services.search")}
            />
          </div>
          <Select
            value={category}
            onValueChange={setCategory}
            ariaLabel="Filter by category"
            options={[
              { value: "all", label: t("services.allCategories") },
              ...categories.map((c) => ({ value: c.name, label: c.name })),
            ]}
          />
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              { value: "active", label: t("common.active") },
              { value: "inactive", label: t("common.inactive") },
              { value: "unbookable", label: t("services.notBookable") },
            ]}
          />
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card>{emptyState}</Card>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <ServiceCard
              key={s.id}
              entry={s}
              onEdit={openEdit}
              onAssign={openAssign}
              onDelete={setDeleting}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            rows={rows}
            columns={columns}
            getRowId={(s) => s.id}
            onRowClick={openEdit}
            caption={t("cap.services")}
            pageSize={10}
            empty={emptyState}
          />
        </Card>
      )}

      <p className="text-[0.75rem] text-ink-muted">
        Clinician assignments are read from the doctor records, so the
        catalogue and the rota cannot disagree about who provides what.
      </p>

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        entry={editing}
        focusAssignments={focusAssignments}
      />
      <DeleteServiceDialog
        entry={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
