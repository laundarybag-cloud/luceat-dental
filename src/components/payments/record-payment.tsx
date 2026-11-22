"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Undo2, Wallet } from "lucide-react";
import {
  balanceOf,
  totalOf,
  type Invoice,
  type PaymentMethod,
} from "@/lib/mock/billing";
import { TODAY } from "@/lib/mock/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/locale-context";

const METHODS: PaymentMethod[] = [
  "Visa",
  "Mastercard",
  "Bank transfer",
  "Cash",
  "Insurance",
];

/**
 * Takes a payment against an invoice.
 *
 * The one rule worth enforcing in the UI: you cannot receive more than is
 * owed. Overpayment is a credit note, not a payment, and silently accepting
 * it would put the ledger out by the difference.
 */
export function RecordPaymentDialog({
  invoice,
  onOpenChange,
  onRecorded,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onRecorded: (amount: number, method: PaymentMethod, date: string) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const balance = invoice ? balanceOf(invoice) : 0;
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod>("Visa");
  const [date, setDate] = React.useState(TODAY);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!invoice) return;
    setAmount(String(balanceOf(invoice)));
    setMethod("Visa");
    setDate(TODAY);
    setTouched(false);
  }, [invoice]);

  const value = Number(amount);
  const invalid =
    amount.trim() === "" || Number.isNaN(value) || value <= 0;
  const overpaid = !invalid && value > balance;
  const blocked = invalid || overpaid;
  const remainingAfter = Math.max(0, balance - (invalid ? 0 : value));

  if (!invoice) return null;

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Record a payment — ${invoice.number}`}
        description={`${invoice.patientName} · ${formatMoney(balance, true)} outstanding`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              disabled={blocked}
              onClick={() => {
                setTouched(true);
                if (blocked) return;
                onRecorded(value, method, date);
                toast({
                  tone: "success",
                  title: `${formatMoney(value, true)} received`,
                  detail: `${invoice.number} · ${method}. Recorded in this session only — no payment was taken and nothing was stored.`,
                });
                onOpenChange(false);
              }}
            >
              <Wallet />
              {t("pay.recordPayment")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t("pay.amount")}
              required
              htmlFor="pay-amount"
              error={
                touched && invalid
                  ? t("v.amountAboveZero")
                  : overpaid
                    ? `That is more than the ${formatMoney(balance, true)} owed.`
                    : undefined
              }
            >
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step={5}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                invalid={(touched && invalid) || overpaid}
              />
            </Field>
            <Field label={t("pay.method")}>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as PaymentMethod)}
                ariaLabel="Payment method"
                options={METHODS.map((m) => ({ value: m, label: m }))}
              />
            </Field>
            <Field label={t("pay.dateReceived")} htmlFor="pay-date">
              <Input
                id="pay-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[balance, Math.round(balance / 2)]
              .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
              .map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.75rem] font-medium tabular-nums text-ink-soft transition-colors hover:border-forest-300 hover:text-forest-700"
                >
                  {v === balance ? `Full balance ${formatMoney(v)}` : `Half ${formatMoney(v)}`}
                </button>
              ))}
          </div>

          {overpaid ? (
            <p className="flex items-start gap-2 rounded-field border border-status-cancelled/30 bg-status-cancelled-bg/60 px-3 py-2.5 text-small font-medium text-status-cancelled">
              <AlertTriangle className="mt-px size-4 shrink-0" />
              An overpayment has to be raised as a credit note, not taken as a
              payment.
            </p>
          ) : (
            !invalid && (
              <p
                className={cn(
                  "flex items-start gap-2 rounded-field border px-3 py-2.5 text-small",
                  remainingAfter === 0
                    ? "border-status-completed/25 bg-status-completed-bg/60 text-status-completed"
                    : "border-line bg-canvas text-ink-soft"
                )}
              >
                <CheckCircle2 className="mt-px size-4 shrink-0" />
                {remainingAfter === 0
                  ? t("hint.settlesInFull")
                  : `${formatMoney(remainingAfter, true)} will remain outstanding.`}
              </p>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Refund confirmation, stating what it does to the figures. */
export function RefundDialog({
  invoice,
  onOpenChange,
  onRefunded,
}: {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onRefunded: (amount: number, reason: string) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (invoice) setReason("");
  }, [invoice]);

  if (!invoice) return null;
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Refund ${invoice.number}?`}
        description={`${invoice.patientName} · ${formatMoney(paid, true)} received to date`}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={!reason.trim() || paid <= 0}
              onClick={() => {
                onRefunded(paid, reason.trim());
                toast({
                  tone: "info",
                  title: t("pay.refundRecorded"),
                  detail: t("pay.refundBody"),
                });
                onOpenChange(false);
              }}
            >
              <Undo2 />
              Refund {formatMoney(paid)}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {paid <= 0 ? (
            <p className="flex items-start gap-2 rounded-field border border-status-pending/30 bg-status-pending-bg/60 px-3 py-2.5 text-small text-status-pending">
              <AlertTriangle className="mt-px size-4 shrink-0" />
              Nothing has been received against this invoice, so there is
              nothing to refund.
            </p>
          ) : (
            <p className="text-small text-ink-soft">
              The invoice total of {formatMoney(totalOf(invoice), true)} stays
              on the clinical record. The refund removes{" "}
              {formatMoney(paid, true)} from collected revenue and marks the
              invoice as refunded.
            </p>
          )}
          <Field label={t("pay.reason")} required hint={t("pay.statementHint")}>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("pay.reasonPlaceholder")}
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
