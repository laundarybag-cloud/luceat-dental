"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  Inbox,
  Lock,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";
import {
  ALERT_KIND_META,
  CHANNEL_META,
  DELIVERY_META,
  SEVERITY_META,
  TEMPLATE_META,
  alertCounts,
  deliveryCounts,
  getPatientMessages,
  reminderRules,
  ruleVolume,
  type AlertKind,
  type Channel,
  type DeliveryStatus,
  type ClinicAlert,
  type PatientMessage,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import {
  EmptyState,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Drawer, DrawerContent } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { useNotifications } from "./notification-context";
import { useSettings } from "@/components/settings/settings-context";
import { useI18n } from "@/components/i18n/locale-context";
import {
  alertKindKey,
  channelKey,
  deliveryKey,
  permissionKey,
  templateKey,
  templateTimingKey,
} from "@/lib/i18n/domain";

/* ------------------------------------------------------------ formatting */



const KIND_ICON: Record<AlertKind, React.ReactNode> = {
  confirmation_due: <CalendarClock />,
  message_failed: <AlertTriangle />,
  invoice_overdue: <AlertTriangle />,
  plan_stalled: <CalendarClock />,
  recall_due: <Bell />,
  assistant_gap: <MessageSquare />,
  article_withheld: <ShieldAlert />,
};

/* ----------------------------------------------------------------- stats */

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3.5">
      <p className="truncate text-[0.75rem] font-medium text-ink-muted">
        {label}
      </p>
      <p
        data-metric
        className={cn(
          "mt-1.5 text-title",
          tone === "warn"
            ? "text-status-cancelled"
            : tone === "good"
              ? "text-status-completed"
              : "text-ink"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">{hint}</p>
    </div>
  );
}

/* ---------------------------------------------------------- alert row */

function AlertRow({ alert }: { alert: ClinicAlert }) {
  const { isRead, markRead, markUnread, detailHidden } = useNotifications();
  const { t, fmt: f } = useI18n();
  const read = isRead(alert.id);
  const hidden = detailHidden(alert);
  const meta = SEVERITY_META[alert.severity];
  const toggle = () => (read ? markUnread(alert.id) : markRead(alert.id));

  return (
    <li
      className={cn(
        "group relative flex gap-3 px-4 py-3.5 transition-colors",
        read ? "bg-surface" : "bg-forest-50/40"
      )}
    >
      {/* Unread marker doubles as the severity colour. */}
      <span className="mt-1.5 flex w-2 shrink-0 justify-center">
        {!read && (
          <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
        )}
      </span>

      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-field bg-surface-sunken text-ink-soft",
          "[&_svg]:size-4"
        )}
        aria-hidden
      >
        {KIND_ICON[alert.kind]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={cn(
              "min-w-0 text-small text-ink",
              !read && "font-semibold"
            )}
          >
            {alert.title}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-px text-[0.6875rem] font-medium",
              meta.chip
            )}
          >
            {t(alertKindKey(alert.kind))}
          </span>
        </div>

        {hidden ? (
          <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] italic text-ink-faint">
            <Lock className="size-3 shrink-0" />
            {t("notifications.detailHidden", {
              permission: t(permissionKey(alert.detailPermission!)),
            })}
          </p>
        ) : (
          <p className="mt-1 text-[0.75rem] leading-5 text-ink-muted">
            {alert.detail}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={alert.href}
            className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-forest-700 hover:underline"
          >
            {alert.actionLabel}
            <ArrowRight className="size-3" />
          </Link>
          <span className="text-[0.75rem] text-ink-faint">
            {f.dateTime(alert.at)}
          </span>
          {/* On a phone the read toggle sits with the other metadata. Kept
              beside the title it squeezed every heading onto two lines. */}
          <button
            onClick={toggle}
            className="rounded-field text-[0.75rem] font-medium text-ink-faint underline-offset-2 hover:underline sm:hidden"
          >
            {read
              ? t("notifications.markUnread")
              : t("notifications.markRead")}
          </button>
        </div>
      </div>

      <button
        onClick={toggle}
        className="hidden h-fit shrink-0 rounded-field px-2 py-1 text-[0.75rem] font-medium text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink-soft sm:block"
      >
        {read ? t("notifications.unread") : t("notifications.markRead")}
      </button>
    </li>
  );
}

/* ------------------------------------------------------------- module */

export function NotificationsModule() {
  const toast = useToast();
  const { visible, unread, markAllRead } = useNotifications();
  const { t, fmt: f, locale } = useI18n();

  const [severity, setSeverity] = React.useState("all");
  const [kind, setKind] = React.useState("all");
  const [onlyUnread, setOnlyUnread] = React.useState(false);

  const [query, setQuery] = React.useState("");
  const [channel, setChannel] = React.useState("all");
  const [delivery, setDelivery] = React.useState("all");
  const [open, setOpen] = React.useState<PatientMessage | null>(null);

  // Rules are session state and say so; nothing here rewrites the log.
  const [disabled, setDisabled] = React.useState<Set<string>>(
    () => new Set(reminderRules.filter((r) => !r.enabledByDefault).map((r) => r.id))
  );

  const settings = useSettings();
  // The wording carries the clinic's name and phone number, so the log is
  // rebuilt when either changes.
  const allMessages = React.useMemo(
    () => getPatientMessages(settings, locale),
    [settings, locale]
  );
  const counts = alertCounts(visible);

  const filteredAlerts = visible.filter((a) => {
    if (severity !== "all" && a.severity !== severity) return false;
    if (kind !== "all" && a.kind !== kind) return false;
    if (onlyUnread && !unread.includes(a)) return false;
    return true;
  });

  const messages = allMessages.filter((m) => {
    if (channel !== "all" && m.channel !== channel) return false;
    if (delivery !== "all" && m.status !== delivery) return false;
    if (query) {
      const q = query.toLowerCase();
      if (
        !m.patientName.toLowerCase().includes(q) &&
        !m.body.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const delivered = deliveryCounts(allMessages);

  const columns: Column<PatientMessage>[] = [
    {
      id: "patient",
      header: t("notifications.col.patient"),
      sortBy: (m) => m.patientName,
      cell: (m) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={m.patientName} size="xs" />
          <span className="min-w-0">
            <span className="block truncate text-small font-medium text-ink">
              {m.patientName}
            </span>
            <span dir="ltr" className="block truncate text-[0.6875rem] text-ink-faint">
              {m.to}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "template",
      header: t("notifications.col.message"),
      sortBy: (m) => t(templateKey(m.template)),
      cell: (m) => (
        <span className="block min-w-0 max-w-[15rem] xl:max-w-[20rem]">
          <span className="block truncate text-small text-ink-soft">
            {t(templateKey(m.template))}
          </span>
          <span className="block truncate text-[0.6875rem] text-ink-faint">
            {m.subject}
          </span>
        </span>
      ),
    },
    {
      id: "channel",
      header: t("notifications.col.channel"),
      hideBelow: "xl",
      sortBy: (m) => m.channel,
      cell: (m) => (
        <span className="text-small text-ink-soft">
          {t(channelKey(m.channel))}
        </span>
      ),
    },
    {
      id: "at",
      header: t("notifications.col.sent"),
      hideBelow: "sm",
      sortBy: (m) => m.at,
      cell: (m) => (
        <span dir="ltr" className="whitespace-nowrap text-small text-ink-soft">
          {f.dateTime(m.at)}
        </span>
      ),
    },
    {
      id: "status",
      header: t("notifications.col.delivery"),
      align: "end",
      sortBy: (m) => m.status,
      cell: (m) => (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
            DELIVERY_META[m.status].chip
          )}
        >
          {t(deliveryKey(m.status))}
        </span>
      ),
    },
  ];

  const toggleRule = (id: string, label: string) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      const nowOff = !next.has(id);
      if (nowOff) next.add(id);
      else next.delete(id);
      toast({
        tone: nowOff ? "info" : "success",
        title: nowOff
          ? t("notifications.rules.pausedToast", { name: label })
          : t("notifications.rules.resumedToast", { name: label }),
        detail: nowOff
          ? t("notifications.rules.pausedDetail")
          : t("notifications.rules.resumedDetail"),
      });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <h1 className="text-title text-ink">{t("notifications.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
{t("notifications.subtitle")}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      <Tabs defaultValue="alerts" className="min-w-0">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="alerts">
              {t("notifications.tab.alerts")}
              {unread.length ? ` (${f.number(unread.length)})` : ""}
            </TabsTrigger>
            <TabsTrigger value="messages">{t("notifications.tab.messages")}</TabsTrigger>
            <TabsTrigger value="rules">{t("notifications.tab.rules")}</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 space-y-4">
          {/* ----------------------------------------------------- alerts */}
          <TabsContent value="alerts" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label={t("notifications.stat.open")}
                value={f.number(counts.total)}
                hint={t("notifications.stat.openHint", { count: f.number(unread.length) })}
              />
              <Stat
                label={t("notifications.stat.critical")}
                value={f.number(counts.critical)}
                hint={t("notifications.stat.criticalHint")}
                tone={counts.critical ? "warn" : undefined}
              />
              <Stat
                label={t("notifications.stat.attention")}
                value={f.number(counts.attention)}
                hint={t("notifications.stat.attentionHint")}
              />
              <Stat
                label={t("notifications.stat.info")}
                value={f.number(counts.info)}
                hint={t("notifications.stat.infoHint")}
              />
            </div>

            <Card>
              <CardHeader className="flex-col items-stretch gap-3 xl:flex-row xl:items-start">
                <CardTitle hint={t("notifications.feed.hint")}>
                  {t("notifications.feed.title")}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={onlyUnread ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setOnlyUnread((v) => !v)}
                  >
                    {onlyUnread ? <Bell /> : <BellOff />}
                    {t("notifications.feed.unreadOnly")}
                  </Button>
                  <Select
                    value={severity}
                    onValueChange={setSeverity}
                    ariaLabel={t("notifications.feed.allSeverities")}
                    className="w-40"
                    options={[
                      { value: "all", label: t("notifications.feed.allSeverities") },
                      {
                        value: "critical",
                        label: t("notifications.severity.critical"),
                      },
                      {
                        value: "attention",
                        label: t("notifications.severity.attention"),
                      },
                      { value: "info", label: t("notifications.severity.info") },
                    ]}
                  />
                  <Select
                    value={kind}
                    onValueChange={setKind}
                    ariaLabel={t("notifications.feed.allTypes")}
                    className="w-44"
                    options={[
                      { value: "all", label: t("notifications.feed.allTypes") },
                      ...Object.keys(ALERT_KIND_META).map((k) => ({
                        value: k,
                        label: t(alertKindKey(k as AlertKind)),
                      })),
                    ]}
                  />
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {filteredAlerts.length ? (
                  <ul className="divide-y divide-line">
                    {filteredAlerts.map((a) => (
                      <AlertRow key={a.id} alert={a} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    illustration={
                      <span className="flex size-11 items-center justify-center rounded-full bg-status-completed-bg text-status-completed">
                        <CheckCheck className="size-5" />
                      </span>
                    }
                    title={
                      visible.length
                        ? t("notifications.feed.emptyFiltered")
                        : t("notifications.feed.empty")
                    }
                    description={
                      visible.length
                        ? t("notifications.feed.emptyFilteredHint")
                        : t("notifications.feed.emptyHint")
                    }
                  />
                )}
              </CardBody>
            </Card>

            <p className="text-[0.75rem] text-ink-muted">
{t("notifications.feed.footnote")}
            </p>
          </TabsContent>

          {/* --------------------------------------------------- messages */}
          <TabsContent value="messages" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label={t("notifications.messages.sent")}
                value={f.number(delivered.total)}
                hint={t("notifications.messages.sentHint")}
              />
              <Stat
                label={t("notifications.messages.delivered")}
                value={f.percent(
                  (delivered.delivered / Math.max(1, delivered.total)) * 100
                )}
                hint={t("notifications.messages.deliveredHint", {
                  count: f.number(delivered.delivered),
                })}
                tone="good"
              />
              <Stat
                label={t("notifications.messages.failed")}
                value={f.number(delivered.failed)}
                hint={t("notifications.messages.failedHint")}
                tone={delivered.failed ? "warn" : undefined}
              />
              <Stat
                label={t("notifications.messages.inFlight")}
                value={f.number(delivered.queued)}
                hint={t("notifications.messages.inFlightHint")}
              />
            </div>

            <Card>
              <CardHeader className="flex-col items-stretch gap-3 xl:flex-row xl:items-start">
                <CardTitle
                  hint={t("notifications.log.hint", {
                    shown: f.number(messages.length),
                    total: f.number(delivered.total),
                  })}
                >
                  {t("notifications.log.title")}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("notifications.log.searchPlaceholder")}
                      aria-label={t("common.search")}
                      className="w-52 ps-8"
                    />
                  </div>
                  <Select
                    value={channel}
                    onValueChange={setChannel}
                    ariaLabel={t("notifications.log.allChannels")}
                    className="w-36"
                    options={[
                      { value: "all", label: t("notifications.log.allChannels") },
                      ...Object.keys(CHANNEL_META).map((k) => ({
                        value: k,
                        label: t(channelKey(k as Channel)),
                      })),
                    ]}
                  />
                  <Select
                    value={delivery}
                    onValueChange={setDelivery}
                    ariaLabel={t("notifications.log.allOutcomes")}
                    className="w-36"
                    options={[
                      { value: "all", label: t("notifications.log.allOutcomes") },
                      ...Object.keys(DELIVERY_META).map((k) => ({
                        value: k,
                        label: t(deliveryKey(k as DeliveryStatus)),
                      })),
                    ]}
                  />
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <DataTable
                  rows={messages}
                  columns={columns}
                  getRowId={(m) => m.id}
                  onRowClick={(m) => setOpen(m)}
                  pageSize={12}
                  caption={t("notifications.log.title")}
                  empty={
                    <EmptyState
                      illustration={
                        <span className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
                          <Inbox className="size-5" />
                        </span>
                      }
                      title={t("notifications.log.empty")}
                      description={t("notifications.log.emptyHint")}
                      compact
                    />
                  }
                />
              </CardBody>
            </Card>
          </TabsContent>

          {/* ------------------------------------------------------ rules */}
          <TabsContent value="rules" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {reminderRules.map((rule) => {
                const off = disabled.has(rule.id);
                const meta = TEMPLATE_META[rule.template];
                return (
                  <Card key={rule.id}>
                    <CardBody className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-card text-ink">
                            {t(templateKey(rule.template))}
                          </p>
                          <p className="mt-0.5 text-[0.75rem] text-ink-muted">
                            {t(templateTimingKey(rule.template))} ·{" "}
                            {t(channelKey(rule.channel))}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                            off
                              ? "bg-surface-sunken text-ink-soft"
                              : "bg-status-completed-bg text-status-completed"
                          )}
                        >
                          {off ? t("notifications.rules.paused") : t("notifications.rules.active")}
                        </span>
                      </div>

                      <p className="rounded-field border border-line bg-canvas px-3 py-2.5 text-[0.75rem] leading-5 text-ink-soft">
                        {rule.body}
                      </p>

                      <Separator />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* "Paused" over "3 sent from this rule" reads as a
                            contradiction. Say which side of the pause they
                            fall on — and for recall that is the whole story:
                            the rule is off, so the overdue patients nobody
                            contacted are sitting in the alert feed. */}
                        <span className="text-[0.75rem] text-ink-faint">
                          {off
                            ? t("notifications.rules.sentBefore", {
                                count: f.number(ruleVolume(rule)),
                              })
                            : t("notifications.rules.sentFrom", {
                                count: f.number(ruleVolume(rule)),
                              })}
                        </span>
                        <Button
                          variant={off ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => toggleRule(rule.id, meta.label)}
                        >
                          {off ? <Send /> : <BellOff />}
                          {off ? t("notifications.rules.resume") : t("notifications.rules.pause")}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>

            <p className="text-[0.75rem] text-ink-muted">
{t("notifications.rules.footnote")}
            </p>
          </TabsContent>
        </div>
      </Tabs>

      {/* ------------------------------------------------- message drawer */}
      <Drawer open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DrawerContent
          title={open ? t(templateKey(open.template)) : t("notifications.col.message")}
          description={
            open
              ? `${t(channelKey(open.channel))} · ${open.patientName}`
              : ""
          }
        >
          {open && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Detail label={t("notifications.col.sent")} value={f.dateTime(open.at)} />
                <Detail
                  label={t("notifications.col.channel")}
                  value={t(channelKey(open.channel))}
                />
                <Detail label={t("notifications.col.patient")} value={open.to} />
                <Detail
                  label={t("notifications.col.delivery")}
                  value={t(deliveryKey(open.status))}
                />
              </div>

              {open.status === "failed" && (
                <p className="flex items-start gap-2 rounded-field border border-status-cancelled/30 bg-status-cancelled-bg px-3 py-2.5 text-[0.75rem] leading-5 text-status-cancelled">
                  <AlertTriangle className="mt-px size-3.5 shrink-0" />
                  {open.failureReason}
                </p>
              )}

              <div>
                <p className="mb-1.5 text-[0.75rem] font-medium text-ink-soft">
                  {t("notifications.drawer.received")}
                </p>
                <p className="rounded-field border border-line bg-canvas px-3 py-2.5 text-small leading-6 text-ink">
                  {open.body}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    toast({
                      tone: "info",
                      title: t("notifications.drawer.notSentTitle"),
                      detail: t("notifications.drawer.notSentDetail"),
                    })
                  }
                >
                  <RefreshCw />
                  {t("notifications.drawer.resend")}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/patients/${open.patientId}`}>
                    <Mail />
                    {t("notifications.drawer.openRecord")}
                  </Link>
                </Button>
              </div>

              <p className="text-[0.75rem] text-ink-faint">
{t("notifications.drawer.masked")}
              </p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.75rem] text-ink-faint">{label}</p>
      <p dir="auto" className="mt-0.5 truncate text-small text-ink">
        {value}
      </p>
    </div>
  );
}
