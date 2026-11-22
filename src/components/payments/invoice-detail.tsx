"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardList,
  Mail,
  Printer,
  Receipt,
  Undo2,
  Wallet,
} from "lucide-react";
import {
  INVOICE_STATUS_META,
  balanceOf,
  paidOf,
  statusOf,
  subtotalOf,
  totalOf,
  type Invoice,
  type PaymentMethod,
} from "@/lib/mock/billing";
import { doctorProfileById } from "@/lib/mock/doctors";
import { cn, formatMoney } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { Panel } from "@/components/patients/profile-tabs";
import { fmtDate } from "@/components/patients/patients-register";
import { RecordPaymentDialog, RefundDialog } from "./record-payment";
import { useI18n } from "@/components/i18n/locale-context";

export function InvoiceDetail({ invoice: initial }: { invoice: Invoice }) {
  const { t } = useI18n();
  const toast = useToast();
  const { can } = useRole();
  const [invoice, setInvoice] = React.useState(initial);
  const [paying, setPaying] = React.useState(false);
  const [refunding, setRefunding] = React.useState(false);

  const status = statusOf(invoice);
  const meta = INVOICE_STATUS_META[status];
  const doctor = doctorProfileById(invoice.doctorId);
  const subtotal = subtotalOf(invoice);
  const total = totalOf(invoice);
  const paid = paidOf(invoice);
  const balance = invoice.refund ? 0 : balanceOf(invoice);

  const addPayment = (amount: number, method: PaymentMethod, date: string) =>
    setInvoice((inv) => ({
      ...inv,
      payments: [
        ...inv.payments,
        {
          id: `pay-new-${Date.now()}`,
          amount,
          method,
          date,
          reference: `TXN-${Math.floor(90000 + Math.random() * 9000)}`,
        },
      ],
    }));

  const applyRefund = (amount: number, reason: string) =>
    setInvoice((inv) => ({
      ...inv,
      refund: { amount, reason, date: new Date().toISOString().slice(0, 10) },
    }));

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/payments">
          <ArrowLeft className="rtl:rotate-180" />
          {t("pay.allInvoices")}
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-[linear-gradient(104deg,var(--color-surface)_0%,var(--color-canvas)_60%,var(--color-forest-50)_100%)] p-5 md:flex-row md:items-center">
          <Avatar
            src={invoice.patientAvatar}
            name={invoice.patientName}
            size="xl"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title tabular-nums text-ink">
                {invoice.number}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                  meta.chip
                )}
              >
                {meta.label}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-muted">
              <Link
                href={`/patients/${invoice.patientId}`}
                className="font-medium text-forest-600 hover:text-forest-800"
              >
                {invoice.patientName}
              </Link>
              <span aria-hidden>·</span>
              <span>Issued {fmtDate(invoice.issued)}</span>
              <span aria-hidden>·</span>
              <span>Due {fmtDate(invoice.due)}</span>
              {doctor && (
                <>
                  <span aria-hidden>·</span>
                  <span>{doctor.name}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {balance > 0 && (
              <Button
                variant="primary"
                size="md"
                disabled={!can("billing.view")}
                onClick={() => setPaying(true)}
              >
                <Wallet />
                {t("pay.recordPayment")}
              </Button>
            )}
            {paid > 0 && !invoice.refund && (
              <Button
                variant="secondary"
                size="md"
                disabled={!can("billing.view")}
                onClick={() => setRefunding(true)}
              >
                <Undo2 />
                {t("pay.refund")}
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              aria-label={t("pay.emailInvoice")}
              onClick={() =>
                toast({
                  tone: "info",
                  title: t("pay.nothingSent"),
                  detail: t("pay.emailBody"),
                })
              }
            >
              <Mail />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label={t("pay.printInvoice")}
              onClick={() =>
                toast({
                  tone: "info",
                  title: t("patients.printNeedsBackend"),
                  detail: t("pay.printBody"),
                })
              }
            >
              <Printer />
            </Button>
          </div>
        </div>

        {invoice.refund && (
          <p className="flex items-start gap-2 border-t border-line bg-status-noshow-bg/50 px-5 py-3 text-small text-ink-soft">
            <Undo2 className="mt-px size-4 shrink-0" />
            <span>
              <span className="font-medium text-ink">
                {formatMoney(invoice.refund.amount, true)} refunded
              </span>{" "}
              on {fmtDate(invoice.refund.date)} — {invoice.refund.reason}
            </span>
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Lines */}
        <Panel title={`Charges (${invoice.lines.length})`}>
          <ul className="divide-y divide-line">
            {invoice.lines.map((line) => (
              <li key={line.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-600">
                  {line.source === "appointment" ? (
                    <CalendarCheck className="size-3.5" />
                  ) : (
                    <ClipboardList className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium text-ink">
                    {line.description}
                  </span>
                  {/* The audit trail: what clinical event produced this charge. */}
                  <span className="block truncate text-[0.75rem] text-ink-muted">
                    {line.sourceLabel}
                  </span>
                </span>
                <span className="shrink-0 text-small font-semibold tabular-nums text-ink">
                  {formatMoney(line.amount, true)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-small">
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">{t("pay.subtotal")}</dt>
              <dd className="tabular-nums text-ink">
                {formatMoney(subtotal, true)}
              </dd>
            </div>
            {invoice.discount && (
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">{invoice.discount.label}</dt>
                <dd className="tabular-nums text-status-completed">
                  −{formatMoney(invoice.discount.amount, true)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-line pt-1.5">
              <dt className="font-medium text-ink">{t("pay.total")}</dt>
              <dd className="text-section tabular-nums text-ink">
                {formatMoney(total, true)}
              </dd>
            </div>
          </dl>
        </Panel>

        <div className="space-y-4">
          <Panel title={t("col.balance")}>
            <p
              data-metric
              className={cn(
                "text-display",
                balance > 0 ? "text-status-pending" : "text-ink"
              )}
            >
              {formatMoney(balance, true)}
            </p>
            <p className="mt-1 text-[0.75rem] text-ink-muted">
              {formatMoney(paid, true)} of {formatMoney(total, true)} received
            </p>
            <Progress
              value={total ? (paid / total) * 100 : 0}
              className="mt-2.5"
            />
            {balance > 0 && (
              <Button
                variant="primary"
                size="sm"
                className="mt-3 w-full"
                disabled={!can("billing.view")}
                onClick={() => setPaying(true)}
              >
                <Wallet />
                {t("pay.recordPayment")}
              </Button>
            )}
          </Panel>

          <Panel title={`Payments (${invoice.payments.length})`}>
            {invoice.payments.length ? (
              <ul className="divide-y divide-line">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-status-completed-bg text-status-completed">
                      <Receipt className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small text-ink">
                        {p.method}
                      </span>
                      <span className="block truncate text-[0.6875rem] tabular-nums text-ink-faint">
                        {fmtDate(p.date)} · {p.reference}
                      </span>
                    </span>
                    <span className="shrink-0 text-small font-semibold tabular-nums text-ink">
                      {formatMoney(p.amount, true)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-5 text-center text-small text-ink-faint">
                {t("pay.nothingReceived")}
              </p>
            )}
          </Panel>
        </div>
      </div>

      <p className="text-[0.75rem] text-ink-muted">
        Payments and refunds recorded here are held in this browser session
        only — no money moves and nothing is stored.
      </p>

      <RecordPaymentDialog
        invoice={paying ? invoice : null}
        onOpenChange={(open) => !open && setPaying(false)}
        onRecorded={addPayment}
      />
      <RefundDialog
        invoice={refunding ? invoice : null}
        onOpenChange={(open) => !open && setRefunding(false)}
        onRefunded={applyRefund}
      />
    </div>
  );
}
