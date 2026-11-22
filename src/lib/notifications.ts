/**
 * Notifications.
 *
 * Two different things get called "notifications" in clinic software, and
 * conflating them is how feeds end up both noisy and untrustworthy:
 *
 *  1. **Alerts** — conditions in the clinic that need a human. These are not
 *     stored messages. They are derived from the same fixtures every other
 *     module reads, so an alert disappears when the underlying state changes
 *     rather than when someone dismisses it. Acknowledging one marks it read;
 *     it does not pretend the work is done.
 *
 *  2. **Patient messages** — records of something that was actually sent, with
 *     a channel and a delivery outcome. Derived from the appointment book: a
 *     confirmed appointment produced a confirmation, an appointment inside the
 *     reminder window produced a reminder, a cancelled one produced a notice.
 *
 * A feed is a leak vector. A receptionist glancing at the bell must not read
 * a patient's clinical detail, so every alert declares two permissions: one to
 * see that something needs attention at all, and one to read the detail. Where
 * a role has the first but not the second, the row stays and the detail is
 * redacted — the same rule Module 10 applies to conversation transcripts.
 */
import type { Permission } from "./access";
import { NOW, TODAY, weekAppointments } from "./mock/schedule";
import { patientRecords } from "./mock/patients";
import { planIndex } from "./mock/treatment-plans";
import { invoices, balanceOf, totalOf } from "./mock/billing";
import { unanswered } from "./mock/assistant";
import { articles } from "./mock/knowledge";
import { assistantCanUse, withheldReason } from "./knowledge";
import { summarise } from "./treatment";
import { formatLongDate, formatTime } from "./schedule";
import { getSettings, type ClinicSettings } from "./settings";
import { fmt, translate } from "./i18n";
import { getLocale, type Locale } from "./i18n/locale";
import { channelKey, templateKey } from "./i18n/domain";

/* ------------------------------------------------------------- alerts */

export type AlertKind =
  | "confirmation_due"
  | "message_failed"
  | "invoice_overdue"
  | "plan_stalled"
  | "recall_due"
  | "assistant_gap"
  | "article_withheld";

export type AlertSeverity = "critical" | "attention" | "info";

export interface ClinicAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  /** Safe for any role that can see the alert at all. */
  title: string;
  /** May carry clinical or financial detail — gated by `detailPermission`. */
  detail: string;
  /** Permission needed to see the row. `null` means anyone. */
  viewPermission: Permission | null;
  /** Permission needed to read `detail`. `null` means anyone. */
  detailPermission: Permission | null;
  at: string;
  /** Where the alert is actually resolved. */
  href: string;
  actionLabel: string;
  patientName?: string;
}

export const ALERT_KIND_META: Record<
  AlertKind,
  { label: string; description: string }
> = {
  confirmation_due: {
    label: "Confirmation due",
    description: "Booked but not yet confirmed by the patient.",
  },
  message_failed: {
    label: "Message failed",
    description: "A reminder or confirmation did not reach the patient.",
  },
  invoice_overdue: {
    label: "Invoice overdue",
    description: "Issued more than 30 days ago and still unpaid.",
  },
  plan_stalled: {
    label: "Plan stalled",
    description: "Treatment agreed, but the next session is not booked.",
  },
  recall_due: {
    label: "Recall due",
    description: "Not seen for six months or more.",
  },
  assistant_gap: {
    label: "Knowledge gap",
    description: "Patients keep asking something no article answers.",
  },
  article_withheld: {
    label: "Article withheld",
    description: "Published, but the assistant is not allowed to use it.",
  },
};

export const SEVERITY_META: Record<
  AlertSeverity,
  { label: string; chip: string; dot: string }
> = {
  critical: {
    label: "Critical",
    chip: "bg-status-cancelled-bg text-status-cancelled",
    dot: "bg-status-cancelled",
  },
  attention: {
    label: "Needs attention",
    chip: "bg-status-pending-bg text-status-pending",
    dot: "bg-status-pending",
  },
  info: {
    label: "For information",
    chip: "bg-surface-sunken text-ink-soft",
    dot: "bg-ink-faint",
  },
};

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const hoursBetween = (from: string, to: string) =>
  (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;

const daysSince = (isoDate: string) =>
  Math.floor(
    (new Date(`${TODAY}T00:00:00.000Z`).getTime() -
      new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`).getTime()) /
      86_400_000
  );

/* --------------------------------------------------- patient messages */

export type Channel = "sms" | "email" | "whatsapp";

export type DeliveryStatus = "delivered" | "sent" | "queued" | "failed";

export type MessageTemplate =
  | "booking_confirmation"
  | "appointment_reminder"
  | "cancellation_notice"
  | "recall_invitation";

export interface PatientMessage {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  template: MessageTemplate;
  channel: Channel;
  /**
   * What the message was about — the service and time, or the reason. Two
   * reminders to the same patient on the same day are different messages,
   * and the log has to show which is which.
   */
  subject: string;
  /** Masked destination — the log never prints a full contact detail. */
  to: string;
  body: string;
  at: string;
  status: DeliveryStatus;
  failureReason?: string;
}

export const TEMPLATE_META: Record<
  MessageTemplate,
  { label: string; purpose: string }
> = {
  booking_confirmation: {
    label: "Booking confirmation",
    purpose: "Sent as soon as an appointment is booked.",
  },
  appointment_reminder: {
    label: "Appointment reminder",
    purpose: "Sent 24 hours before the appointment.",
  },
  cancellation_notice: {
    label: "Cancellation notice",
    purpose: "Sent when an appointment is cancelled.",
  },
  recall_invitation: {
    label: "Recall invitation",
    purpose: "Sent when a patient is six months overdue a check-up.",
  },
};

export const CHANNEL_META: Record<Channel, { label: string }> = {
  sms: { label: "SMS" },
  email: { label: "Email" },
  whatsapp: { label: "WhatsApp" },
};

export const DELIVERY_META: Record<
  DeliveryStatus,
  { label: string; chip: string }
> = {
  delivered: {
    label: "Delivered",
    chip: "bg-status-completed-bg text-status-completed",
  },
  sent: { label: "Sent", chip: "bg-status-progress-bg text-status-progress" },
  queued: { label: "Queued", chip: "bg-surface-sunken text-ink-soft" },
  failed: {
    label: "Failed",
    chip: "bg-status-cancelled-bg text-status-cancelled",
  },
};

/** `+1 415 555 0142` -> `+1 415 ••• 0142`. The log is not a contact list. */
function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const tail = digits.slice(-4);
  return `${phone.slice(0, phone.length - digits.length + 3).trimEnd()} ••• ${tail}`;
}

/** `mariam.haddad@example.com` -> `m•••@example.com`. */
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 1)}•••@${domain}`;
}

/**
 * Two numbers in this fixture are unreachable — a wrong digit taken at the
 * desk, which is the single most common reason a reminder never lands. They
 * are named rather than hashed so the failure is stable and so the record,
 * the log and the alert all agree about who was not reached.
 */
const UNREACHABLE = new Set(["pt7", "pt14"]);

/** The reason has to match the channel: carriers do not bounce email. */
const failureFor = (channel: Channel, locale: Locale) =>
  translate(`fail.${channel}` as Parameters<typeof translate>[0], undefined, locale);

/**
 * Deterministic channel per patient, so the same person is always reached the
 * same way and the log does not reshuffle between renders.
 */
function channelFor(patientId: string): Channel {
  const n = [...patientId].reduce((s, c) => s + c.charCodeAt(0), 0);
  return (["sms", "email", "whatsapp"] as const)[n % 3];
}

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
});

function buildMessages(locale: Locale): PatientMessage[] {
  const clinic = getSettings();
  const out: PatientMessage[] = [];

  for (const appt of weekAppointments) {
    const record = patientRecords.find((p) => p.id === appt.patient.id);
    const channel = channelFor(appt.patient.id);
    const to =
      channel === "email" && record?.email
        ? maskEmail(record.email)
        : maskPhone(appt.patient.phone);

    const when = `${timeFmt.format(new Date(appt.start))} at ${formatTime(
      appt.start
    )}`;

    // A confirmation goes out when the booking is made. Anything that has
    // reached the chair was obviously booked.
    if (appt.status !== "pending") {
      out.push({
        id: `msg-c-${appt.id}`,
        patientId: appt.patient.id,
        patientName: appt.patient.name,
        appointmentId: appt.id,
        template: "booking_confirmation",
        channel,
        subject: `${appt.service}, ${when}`,
        to,
        body: `Hello ${appt.patient.name.split(" ")[0]}, your ${
          appt.service
        } at ${clinic.name} is booked for ${when}. Reply CHANGE to reschedule.`,
        // Booked two days ahead of the appointment in this fixture.
        at: new Date(
          new Date(appt.start).getTime() - 48 * 3_600_000
        ).toISOString(),
        status: "delivered",
      });
    }

    // A reminder goes out 24 hours before — but only for appointments whose
    // reminder window has already passed. Claiming to have sent a reminder
    // for next Tuesday would be a lie the clock can check.
    const reminderAt = new Date(
      new Date(appt.start).getTime() - 24 * 3_600_000
    ).toISOString();
    if (
      reminderAt <= NOW &&
      appt.status !== "cancelled" &&
      appt.status !== "pending"
    ) {
      const dead = UNREACHABLE.has(appt.patient.id);
      out.push({
        id: `msg-r-${appt.id}`,
        patientId: appt.patient.id,
        patientName: appt.patient.name,
        appointmentId: appt.id,
        template: "appointment_reminder",
        channel,
        subject: `${appt.service}, ${when}`,
        to,
        body: `Reminder: ${appt.service} with ${clinic.name} ${when}. Please arrive 10 minutes early.`,
        at: reminderAt,
        status: dead ? "failed" : "delivered",
        failureReason: dead ? failureFor(channel, locale) : undefined,
      });
    }

    if (appt.status === "cancelled") {
      out.push({
        id: `msg-x-${appt.id}`,
        patientId: appt.patient.id,
        patientName: appt.patient.name,
        appointmentId: appt.id,
        template: "cancellation_notice",
        channel,
        subject: `${appt.service}, ${when}`,
        to,
        body: `Your ${appt.service} on ${when} has been cancelled. Call us on ${clinic.phone} to rebook.`,
        at: new Date(
          new Date(appt.start).getTime() - 12 * 3_600_000
        ).toISOString(),
        status: "delivered",
      });
    }
  }

  // Recall invitations to patients six months overdue. The recall rule is
  // paused in this clinic, so only the handful sent by hand before it was
  // turned off went out; the rest stay overdue with nothing sent, which is
  // exactly what the recall alert exists to catch.
  const overdue = patientRecords
    .filter((p) => p.lastVisit && daysSince(p.lastVisit) >= 180)
    .sort((a, b) => (a.lastVisit ?? "").localeCompare(b.lastVisit ?? ""));
  const invitedSoFar = new Set(
    overdue.slice(0, Math.ceil(overdue.length / 2)).map((p) => p.id)
  );
  for (const p of patientRecords) {
    if (!p.lastVisit || daysSince(p.lastVisit) < 180) continue;
    if (!invitedSoFar.has(p.id)) continue;
    const channel = channelFor(p.id);
    out.push({
      id: `msg-rc-${p.id}`,
      patientId: p.id,
      patientName: p.name,
      template: "recall_invitation",
      channel,
      subject: `Last seen ${formatLongDate(p.lastVisit)}`,
      to: channel === "email" ? maskEmail(p.email) : maskPhone(p.phone),
      body: `Hello ${
        p.name.split(" ")[0]
      }, it has been a while since your last check-up at ${clinic.name}. Reply BOOK and we will find you a time.`,
      at: `${shiftDate(TODAY, -3)}T09:00:00.000Z`,
      status: "sent",
    });
  }

  return out
    .filter((m) => m.at <= NOW)
    .sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Messages are cached against the clinic identity that produced them, so
 * renaming the clinic in Module 14 genuinely rewrites the wording patients
 * were sent rather than leaving a stale name in the log — without rebuilding
 * 450-odd records on every render.
 */
let messageCache: { key: string; value: PatientMessage[] } | null = null;

export function getPatientMessages(
  settings: ClinicSettings = getSettings(),
  locale: Locale = getLocale()
): PatientMessage[] {
  const key = `${settings.name}|${settings.phone}|${locale}`;
  if (messageCache?.key !== key) {
    messageCache = { key, value: buildMessages(locale) };
    alertCache = null;
  }
  return messageCache.value;
}

/* ------------------------------------------------------ alert sources */

function buildAlerts(locale: Locale): ClinicAlert[] {
  // Alert copy is composed in the active language rather than baked in
  // English and translated later: these sentences interleave names, counts
  // and dates, and only the dictionary knows where those belong in Arabic.
  const t = (
    key: Parameters<typeof translate>[0],
    vars?: Parameters<typeof translate>[1]
  ) => translate(key, vars, locale);
  const out: ClinicAlert[] = [];

  // 1. Appointments still unconfirmed with the start time approaching.
  for (const appt of weekAppointments) {
    if (appt.status !== "pending") continue;
    const hours = hoursBetween(NOW, appt.start);
    if (hours < 0 || hours > 72) continue;
    out.push({
      id: `al-conf-${appt.id}`,
      kind: "confirmation_due",
      severity: hours <= 24 ? "critical" : "attention",
      title: t("alert.confirmation.title", { patient: appt.patient.name }),
      detail: t("alert.confirmation.detail", {
        service: appt.service,
        time: fmt.time(appt.start, locale),
        approx: t(
          hours <= 24 ? "alert.confirmation.under" : "alert.confirmation.about"
        ),
        hours: fmt.number(Math.max(1, Math.round(hours)), locale),
      }),
      viewPermission: null,
      detailPermission: null,
      at: NOW,
      href: "/appointments",
      actionLabel: t("alert.confirmation.action"),
      patientName: appt.patient.name,
    });
  }

  // 2. Messages that did not reach the patient, grouped by person. One row
  //    per failed message would have buried every other alert under the two
  //    patients whose contact details are wrong — the point is that those
  //    two people are unreachable, not that nineteen sends failed.
  const failures = new Map<string, PatientMessage[]>();
  for (const msg of getPatientMessages()) {
    if (msg.status !== "failed") continue;
    const list = failures.get(msg.patientId) ?? [];
    list.push(msg);
    failures.set(msg.patientId, list);
  }
  for (const [patientId, list] of failures) {
    const latest = list.reduce((a, b) => (a.at > b.at ? a : b));
    out.push({
      id: `al-msg-${patientId}`,
      kind: "message_failed",
      severity: "attention",
      title:
        list.length === 1
          ? t("alert.messageFailed.titleOne", {
              template: t(templateKey(latest.template)),
              patient: latest.patientName,
            })
          : t("alert.messageFailed.titleMany", {
              count: fmt.number(list.length, locale),
              patient: latest.patientName,
            }),
      detail: t("alert.messageFailed.detail", {
        channel: t(channelKey(latest.channel)),
        to: latest.to,
        reason: latest.failureReason ?? t("alert.messageFailed.noReason"),
      }),
      viewPermission: null,
      detailPermission: null,
      at: latest.at,
      href: `/patients/${patientId}`,
      actionLabel: t("alert.messageFailed.action"),
      patientName: latest.patientName,
    });
  }

  // 3. Invoices unpaid more than 30 days. Money is not everyone's business:
  //    this needs `billing.view`, detail included.
  for (const inv of invoices) {
    if (inv.refund) continue;
    const balance = balanceOf(inv);
    if (balance <= 0) continue;
    const age = daysSince(inv.issued);
    if (age < 30) continue;
    out.push({
      id: `al-inv-${inv.id}`,
      kind: "invoice_overdue",
      severity: age >= 60 ? "critical" : "attention",
      title: t("alert.invoice.title", {
        ref: inv.id.replace("inv-", "#"),
        days: fmt.number(age, locale),
      }),
      detail: t("alert.invoice.detail", {
        patient: inv.patientName,
        balance: fmt.money(balance, locale),
        total: fmt.money(totalOf(inv), locale),
      }),
      viewPermission: "billing.view",
      detailPermission: "billing.view",
      at: `${inv.issued}T09:00:00.000Z`,
      href: `/payments/${inv.id}`,
      actionLabel: t("alert.invoice.action"),
      patientName: inv.patientName,
    });
  }

  // 4. Treatment agreed but not being delivered. The fact that a plan has
  //    stalled is schedule information; what the treatment *is* is clinical,
  //    so the detail is gated even though the row is not.
  for (const entry of planIndex) {
    const summary = summarise(entry.plan);
    if (summary.status !== "stalled") continue;
    out.push({
      id: `al-plan-${entry.plan.id}`,
      kind: "plan_stalled",
      severity: "attention",
      title: t("alert.plan.title", { patient: entry.patient.name }),
      detail: summary.nextUnscheduled
        ? t("alert.plan.detailNext", {
            unscheduled: fmt.number(summary.unscheduled, locale),
            sessions: fmt.number(summary.sessions, locale),
            step: summary.nextUnscheduled.name,
          })
        : `${t("alert.plan.detail", {
            unscheduled: fmt.number(summary.unscheduled, locale),
            sessions: fmt.number(summary.sessions, locale),
          })}.`,
      viewPermission: null,
      detailPermission: "records.view",
      at: NOW,
      href: `/treatment-plans/${entry.plan.id}`,
      actionLabel: t("alert.plan.action"),
      patientName: entry.patient.name,
    });
  }

  // 5. Recall overdue, where no invitation has gone out yet.
  const invited = new Set(
    getPatientMessages()
      .filter((m) => m.template === "recall_invitation")
      .map((m) => m.patientId)
  );
  for (const p of patientRecords) {
    if (!p.lastVisit) continue;
    const days = daysSince(p.lastVisit);
    if (days < 180 || invited.has(p.id)) continue;
    out.push({
      id: `al-recall-${p.id}`,
      kind: "recall_due",
      severity: "info",
      title: t("alert.recall.title", {
        patient: p.name,
        months: fmt.number(Math.floor(days / 30), locale),
      }),
      detail: t("alert.recall.detail", {
        date: fmt.longDate(p.lastVisit, locale),
      }),
      viewPermission: null,
      detailPermission: null,
      at: NOW,
      href: `/patients/${p.id}`,
      actionLabel: t("alert.recall.action"),
      patientName: p.name,
    });
  }

  // 6. Questions patients keep asking that no article answers.
  for (const q of unanswered) {
    if (q.askedCount < 5) continue;
    out.push({
      id: `al-gap-${q.id}`,
      kind: "assistant_gap",
      severity: "info",
      title: t("alert.gap.title", { question: q.question }),
      detail: t("alert.gap.detail", {
        count: fmt.number(q.askedCount, locale),
        category: q.suggestedCategory,
      }),
      viewPermission: null,
      detailPermission: null,
      at: q.lastAsked,
      href: "/ai-assistant",
      actionLabel: t("alert.gap.action"),
    });
  }

  // 7. Articles published but withheld from the assistant. This is the gate
  //    from Module 09 surfacing itself rather than waiting to be noticed.
  for (const a of articles) {
    if (a.status !== "published" || assistantCanUse(a)) continue;
    out.push({
      id: `al-art-${a.id}`,
      kind: "article_withheld",
      severity: "attention",
      title: t("alert.article.title", { title: a.title }),
      detail: withheldReason(a) ?? t("alert.article.detailFallback"),
      viewPermission: null,
      detailPermission: null,
      at: a.updated,
      href: `/knowledge`,
      actionLabel: t("alert.article.action"),
    });
  }

  return out.sort((a, b) => {
    const order = { critical: 0, attention: 1, info: 2 } as const;
    if (order[a.severity] !== order[b.severity])
      return order[a.severity] - order[b.severity];
    return b.at.localeCompare(a.at);
  });
}

let alertCache: { key: string; value: ClinicAlert[] } | null = null;

export function getClinicAlerts(
  settings: ClinicSettings = getSettings(),
  locale: Locale = getLocale()
): ClinicAlert[] {
  // Touch the messages first: a rebuild there invalidates the alerts that
  // are derived from failed sends.
  getPatientMessages(settings, locale);
  const key = `${settings.name}|${settings.phone}|${locale}`;
  if (alertCache?.key !== key) alertCache = { key, value: buildAlerts(locale) };
  return alertCache.value;
}

/* ------------------------------------------------------ reminder rules */

export interface ReminderRule {
  id: string;
  template: MessageTemplate;
  channel: Channel;
  /** Human description of when it fires. */
  timing: string;
  enabledByDefault: boolean;
  body: string;
}

export const reminderRules: ReminderRule[] = [
  {
    id: "rr-1",
    template: "booking_confirmation",
    channel: "sms",
    timing: "Immediately after booking",
    enabledByDefault: true,
    body: "Hello {first_name}, your {service} at Luceat Dental is booked for {date} at {time}. Reply CHANGE to reschedule.",
  },
  {
    id: "rr-2",
    template: "appointment_reminder",
    channel: "sms",
    timing: "24 hours before the appointment",
    enabledByDefault: true,
    body: "Reminder: {service} with Luceat Dental {date} at {time}. Please arrive 10 minutes early.",
  },
  {
    id: "rr-3",
    template: "cancellation_notice",
    channel: "email",
    timing: "When an appointment is cancelled",
    enabledByDefault: true,
    body: "Your {service} on {date} has been cancelled. Call us on {clinic_phone} to rebook.",
  },
  {
    id: "rr-4",
    template: "recall_invitation",
    channel: "email",
    timing: "Six months after the last visit",
    enabledByDefault: false,
    body: "Hello {first_name}, it has been a while since your last check-up at Luceat Dental. Reply BOOK and we will find you a time.",
  },
];

/** How many messages each rule actually produced, from the log itself. */
export const ruleVolume = (rule: ReminderRule) =>
  getPatientMessages().filter((m) => m.template === rule.template).length;

/* ------------------------------------------------------------ helpers */

export function alertCounts(list: ClinicAlert[]) {
  return {
    total: list.length,
    critical: list.filter((a) => a.severity === "critical").length,
    attention: list.filter((a) => a.severity === "attention").length,
    info: list.filter((a) => a.severity === "info").length,
  };
}

export function deliveryCounts(list: PatientMessage[]) {
  return {
    total: list.length,
    delivered: list.filter((m) => m.status === "delivered").length,
    failed: list.filter((m) => m.status === "failed").length,
    queued: list.filter((m) => m.status === "queued" || m.status === "sent")
      .length,
  };
}
