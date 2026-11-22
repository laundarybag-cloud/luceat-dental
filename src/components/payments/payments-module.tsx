"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Search, SearchX, Wallet } from "lucide-react";
import {
  INVOICE_STATUS_META,
  balanceOf,
  invoices,
  paidOf,
  statusOf,
  totalOf,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/mock/billing";
import { doctorProfiles } from "@/lib/mock/doctors";
import { cn, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { fmtDate } from "@/components/patients/patients-register";
import { RevenueOverview } from "./revenue-overview";
import { useI18n } from "@/components/i18n/locale-context";

function InvoiceList() {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [doctor, setDoctor] = React.useState("all");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (status !== "all" && statusOf(inv) !== status) return false;
      if (doctor !== "all" && inv.doctorId !== doctor) return false;
      if (
        q &&
        !inv.patientName.toLowerCase().includes(q) &&
        !inv.number.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, status, doctor]);

  const columns: Column<Invoice>[] = [
    {
      id: "number",
      header: t("col.invoice"),
      sortBy: (i) => i.number,
      cell: (i) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={i.patientAvatar} name={i.patientName} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {i.patientName}
            </span>
            <span className="block truncate text-[0.75rem] tabular-nums text-ink-faint">
              {i.number}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "items",
      header: t("col.treatment"),
      hideBelow: "lg",
      cell: (i) => (
        <span className="block min-w-0">
          <span className="block truncate">{i.lines[0]?.description}</span>
          {i.lines.length > 1 && (
            <span className="block text-[0.75rem] text-ink-faint">
              +{i.lines.length - 1} more
            </span>
          )}
        </span>
      ),
    },
    {
      id: "issued",
      header: t("col.issued"),
      hideBelow: "md",
      sortBy: (i) => i.issued,
      cell: (i) => <span className="tabular-nums">{fmtDate(i.issued)}</span>,
    },
    {
      id: "due",
      header: t("col.due"),
      hideBelow: "xl",
      sortBy: (i) => i.due,
      cell: (i) => <span className="tabular-nums">{fmtDate(i.due)}</span>,
    },
    {
      id: "total",
      header: t("pay.total"),
      align: "end",
      sortBy: (i) => totalOf(i),
      cell: (i) => (
        <span className="font-semibold tabular-nums text-ink">
          {formatMoney(totalOf(i), true)}
        </span>
      ),
    },
    {
      id: "paid",
      header: t("col.paid"),
      align: "end",
      hideBelow: "sm",
      sortBy: (i) => paidOf(i),
      cell: (i) => (
        <span className="tabular-nums text-ink-muted">
          {formatMoney(paidOf(i), true)}
        </span>
      ),
    },
    {
      id: "balance",
      header: t("col.balance"),
      align: "end",
      sortBy: (i) => balanceOf(i),
      cell: (i) => {
        const b = i.refund ? 0 : balanceOf(i);
        return (
          <span
            className={cn(
              "tabular-nums",
              b > 0 ? "font-semibold text-status-pending" : "text-ink-faint"
            )}
          >
            {b > 0 ? formatMoney(b, true) : "—"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (i) => statusOf(i),
      cell: (i) => {
        const meta = INVOICE_STATUS_META[statusOf(i)];
        return (
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-5",
              meta.chip
            )}
          >
            {meta.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("pay.searchPlaceholder")}
              className="ps-9"
              aria-label={t("pay.search")}
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              ...(
                Object.keys(INVOICE_STATUS_META) as InvoiceStatus[]
              ).map((s) => ({
                value: s,
                label: INVOICE_STATUS_META[s].label,
              })),
            ]}
          />
          <Select
            value={doctor}
            onValueChange={setDoctor}
            ariaLabel="Filter by clinician"
            options={[
              { value: "all", label: t("appt.allClinicians") },
              ...doctorProfiles.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(i) => i.id}
          onRowClick={(i) => router.push(`/payments/${i.id}`)}
          caption={t("pay.invoices")}
          pageSize={12}
          empty={
            <EmptyState
              illustration={
                <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                  <SearchX className="size-5 text-forest-400" />
                </span>
              }
              title={t("pay.empty.title")}
              description={t("pay.empty.body")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setDoctor("all");
                  }}
                >
                  {t("appt.clearFilters")}
                </Button>
              }
            />
          }
        />
      </Card>

      <p className="text-[0.75rem] text-ink-muted">
        Every line on every invoice traces back to a completed appointment or
        treatment session — open an invoice to see the source of each charge.
      </p>
    </div>
  );
}

export function PaymentsModule() {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const { can } = useRole();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* basis-full below sm: a long title squeezed beside two buttons
            wraps to three lines on a phone. */}
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <h1 className="text-title text-ink">{t("pay.heading")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("pay.subtitle", { count: fmt.number(invoices.length) })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          disabled={!can("billing.view")}
          onClick={() =>
            toast({
              tone: "info",
              title: t("patients.exportNotWired"),
              detail: t("pay.exportBody"),
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
              title: t("pay.invoicesFromTreatment"),
              detail:
                "A new invoice is raised by completing an appointment or a treatment-plan session, so the ledger always matches the clinical record.",
            })
          }
        >
          <Wallet />
          {t("pay.newInvoice")}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="min-w-0">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="overview">{t("pay.revenueOverview")}</TabsTrigger>
            <TabsTrigger value="invoices">{t("pay.invoices")}</TabsTrigger>
          </TabsList>
        </div>
        <div className="mt-4">
          <TabsContent value="overview">
            <RevenueOverview />
          </TabsContent>
          <TabsContent value="invoices">
            <InvoiceList />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
