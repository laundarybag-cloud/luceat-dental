"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FilePlus2,
  Lock,
  Search,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";
import {
  CONVERSATION_STATUS_META,
  articleUsage,
  assistantMetrics,
  conversations as allConversations,
  dailySeries,
  safetyRules as seedRules,
  topicMix,
  unanswered,
  type Conversation,
  type SafetyRule,
} from "@/lib/mock/assistant";
import { articleById } from "@/lib/mock/knowledge";
import { assistantCanUse, withheldReason } from "@/lib/knowledge";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  EmptyState,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { fmtDate } from "@/components/patients/patients-register";
import { Panel } from "@/components/patients/profile-tabs";
import { ConversationDetail } from "./conversation-detail";
import { useI18n } from "@/components/i18n/locale-context";

const axisProps = {
  stroke: "transparent",
  tick: { fill: "var(--color-ink-muted)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "pending" | "good";
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-[0.75rem] text-ink-muted">{label}</p>
      <p
        data-metric
        className={cn(
          "mt-0.5 text-title",
          tone === "pending" && "text-status-pending",
          tone === "good" && "text-status-completed",
          !tone && "text-ink"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">{hint}</p>
    </div>
  );
}

/* ------------------------------------------------------- conversations */

function Conversations({
  onOpen,
}: {
  onOpen: (c: Conversation) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [topic, setTopic] = React.useState("all");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return allConversations.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (topic !== "all" && c.topic !== topic) return false;
      if (
        q &&
        !c.patientName.toLowerCase().includes(q) &&
        !c.ref.includes(q) &&
        !c.messages.some((m) => m.text.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [query, status, topic]);

  const columns: Column<Conversation>[] = [
    {
      id: "patient",
      header: t("col.conversation"),
      sortBy: (c) => c.startedAt,
      cell: (c) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={c.avatar} name={c.patientName} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {c.patientName}
            </span>
            <span className="block truncate text-[0.75rem] text-ink-faint">
              {c.ref} · {c.messages[0]?.text.slice(0, 44)}…
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "topic",
      header: t("col.topic"),
      hideBelow: "md",
      sortBy: (c) => c.topic,
      cell: (c) => c.topic,
    },
    {
      id: "channel",
      header: t("col.channel"),
      hideBelow: "xl",
      sortBy: (c) => c.channel,
      cell: (c) => c.channel,
    },
    {
      id: "outcome",
      header: t("ai.outcome"),
      hideBelow: "lg",
      cell: (c) => (
        <span className="flex items-center gap-1.5">
          {c.bookingMade && (
            <Tooltip content="A booking was made in this conversation">
              <span className="inline-flex items-center gap-1 rounded-full bg-status-completed-bg px-2 py-0.5 text-[0.6875rem] font-medium text-status-completed">
                <Zap className="size-3" />
                {t("ai.booked")}
              </span>
            </Tooltip>
          )}
          {c.handoffReason && (
            <Tooltip content={c.handoffReason}>
              <span className="inline-flex items-center gap-1 rounded-full bg-status-pending-bg px-2 py-0.5 text-[0.6875rem] font-medium text-status-pending">
                <ShieldAlert className="size-3" />
                {t("ai.handedOver")}
              </span>
            </Tooltip>
          )}
          {!c.bookingMade && !c.handoffReason && (
            <span className="text-ink-faint">—</span>
          )}
        </span>
      ),
    },
    {
      id: "rating",
      header: t("col.rating"),
      align: "end",
      hideBelow: "xl",
      sortBy: (c) => c.rating ?? 0,
      cell: (c) =>
        c.rating ? (
          <span className="inline-flex items-center gap-1 tabular-nums text-ink">
            <Star className="size-3 fill-gold-300 text-gold-300" />
            {c.rating}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      id: "started",
      header: t("col.started"),
      hideBelow: "sm",
      sortBy: (c) => c.startedAt,
      cell: (c) => <span className="tabular-nums">{fmtDate(c.startedAt)}</span>,
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (c) => c.status,
      cell: (c) => {
        const meta = CONVERSATION_STATUS_META[c.status];
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
              placeholder={t("ai.searchPlaceholder")}
              className="ps-9"
              aria-label={t("ai.search")}
            />
          </div>
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              { value: "active", label: t("common.active") },
              { value: "resolved", label: t("ai.resolved") },
              { value: "escalated", label: t("ai.escalated") },
              { value: "unresolved", label: t("ai.unresolved") },
            ]}
          />
          <Select
            value={topic}
            onValueChange={setTopic}
            ariaLabel="Filter by topic"
            options={[
              { value: "all", label: t("ai.allTopics") },
              ...topicMix().map((t) => ({ value: t.topic, label: t.topic })),
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(c) => c.id}
          onRowClick={onOpen}
          caption={t("cap.conversations")}
          pageSize={10}
          empty={
            <EmptyState
              illustration={
                <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                  <SearchX className="size-5 text-forest-400" />
                </span>
              }
              title={t("ai.empty.title")}
              description={t("ai.empty.body")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setTopic("all");
                  }}
                >
                  {t("appt.clearFilters")}
                </Button>
              }
            />
          }
        />
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------- unanswered */

function Unanswered() {
  const { t } = useI18n();
  const toast = useToast();
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-status-pending-bg text-status-pending">
            <BookOpen className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-card text-ink">
              {t("ai.unansweredQuestions")}
            </p>
            <p className="mt-0.5 text-[0.75rem] leading-[1.15rem] text-ink-muted">
              Nothing published covered these, so the assistant said so and
              routed them to the clinic rather than guessing. Each one is an
              article waiting to be written — publish it and the assistant can
              answer it next time.
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {unanswered.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-small font-medium text-ink">
                  {q.question}
                </span>
                <span className="block truncate text-[0.75rem] text-ink-muted">
                  Asked {q.askedCount} times · last {fmtDate(q.lastAsked)} ·{" "}
                  {q.conversationRefs.join(", ")}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-[0.6875rem] font-medium text-ink-soft">
                {q.suggestedCategory}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() =>
                  toast({
                    tone: "info",
                    title: t("ai.opensNewArticle"),
                    detail: `Pre-filled under ${q.suggestedCategory}. Articles are written server-side, so nothing was created.`,
                  })
                }
              >
                <FilePlus2 />
                {t("ai.draftArticle")}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------- performance */

function Performance() {
  const { t } = useI18n();
  const metrics = assistantMetrics();
  const series = dailySeries();
  const topics = topicMix();
  const usage = articleUsage();
  const maxTopic = Math.max(...topics.map((t) => t.count), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="flex flex-col xl:col-span-3">
          <CardHeader>
            <CardTitle hint={t("ai.outcomesLast7")}>
              {t("ai.dailyOutcomes")}
            </CardTitle>
          </CardHeader>
          <CardBody className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {[
                { label: t("ai.resolved"), color: "var(--color-chart-1)" },
                { label: t("ai.escalated"), color: "var(--color-chart-3)" },
                { label: t("ai.unresolved"), color: "var(--color-chart-5)" },
              ].map((i) => (
                <span
                  key={i.label}
                  className="flex items-center gap-1.5 text-[0.75rem] text-ink-muted"
                >
                  <span
                    className="h-0.5 w-3 rounded-full"
                    style={{ background: i.color }}
                  />
                  {i.label}
                </span>
              ))}
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={series}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
                  <XAxis dataKey="day" {...axisProps} dy={6} />
                  <YAxis {...axisProps} width={34} tickMargin={6} allowDecimals={false} />
                  <RTooltip
                    cursor={{ fill: "var(--color-forest-50)" }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-panel border border-line bg-surface p-3 shadow-overlay">
                          <p className="text-[0.75rem] font-semibold text-ink">
                            {label}
                          </p>
                          {payload.map((p) => (
                            <p
                              key={p.dataKey as string}
                              className="mt-1 flex items-center gap-2 text-[0.75rem]"
                            >
                              <span
                                className="size-2 rounded-full"
                                style={{ background: p.color }}
                              />
                              <span className="flex-1 capitalize text-ink-muted">
                                {p.dataKey as string}
                              </span>
                              <span className="font-semibold tabular-nums text-ink">
                                {p.value as number}
                              </span>
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="resolved" stackId="a" fill="var(--color-chart-1)" animationDuration={600} />
                  <Bar dataKey="escalated" stackId="a" fill="var(--color-chart-3)" animationDuration={600} />
                  <Bar
                    dataKey="unresolved"
                    stackId="a"
                    fill="var(--color-chart-5)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle hint={t("ai.whatPatientsAsk")}>{t("ai.topics")}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {topics.map((t) => (
              <div key={t.topic}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-small text-ink">{t.topic}</span>
                  <span className="text-[0.75rem] tabular-nums text-ink-muted">
                    {t.count}
                  </span>
                </div>
                <Progress
                  value={(t.count / maxTopic) * 100}
                  className="mt-1.5"
                />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t("ai.knowledge")}>
          <ul className="divide-y divide-line">
            {usage.map((u) => {
              const article = articleById(u.articleId);
              if (!article) return null;
              const served = assistantCanUse(article);
              return (
                <li
                  key={u.articleId}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-small",
                        served ? "text-ink" : "text-status-pending line-through"
                      )}
                    >
                      {article.title}
                    </span>
                    <span className="block truncate text-[0.75rem] text-ink-faint">
                      {served ? article.category : withheldReason(article)}
                    </span>
                  </span>
                  <span className="shrink-0 text-small tabular-nums text-ink-muted">
                    {u.uses} use{u.uses === 1 ? "" : "s"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-[0.75rem] text-ink-faint">
            {t("ai.countedFromList")}
          </p>
        </Panel>

        <Panel title={t("ai.patientFeedback")}>
          <div className="flex items-baseline gap-2">
            <span data-metric className="text-display text-ink">
              {metrics.satisfaction.toFixed(1)}
            </span>
            <span className="text-small text-ink-muted">
              out of 5, from {metrics.rated} ratings
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {allConversations
              .filter((c) => c.feedback)
              .map((c) => (
                <li
                  key={c.id}
                  className="rounded-field border border-line bg-canvas p-3"
                >
                  <p className="flex items-center gap-1.5 text-[0.75rem] text-ink-muted">
                    <Star className="size-3 fill-gold-300 text-gold-300" />
                    {c.rating} · {c.ref} · {c.topic}
                  </p>
                  <p className="mt-1 text-small italic leading-5 text-ink-soft">
                    “{c.feedback}”
                  </p>
                </li>
              ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- safety */

function Safety() {
  const { t } = useI18n();
  const toast = useToast();
  const { can } = useRole();
  const [rules, setRules] = React.useState<SafetyRule[]>(seedRules);
  const canEdit = can("records.diagnosis.confirm");

  const toggle = (rule: SafetyRule) => {
    if (rule.locked) {
      toast({
        tone: "warning",
        title: t("ai.cannotSwitchOff"),
        detail: t("ai.preventsAdvice"),
      });
      return;
    }
    if (!canEdit) {
      toast({
        tone: "warning",
        title: t("ai.clinicianOnlySafety"),
        detail: t("ai.readNotAlter"),
      });
      return;
    }
    setRules((all) =>
      all.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
    );
    toast({
      tone: "info",
      title: `${rule.title} ${rule.enabled ? "disabled" : "enabled"}`,
      detail: t("ai.safetySessionOnly"),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-600">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-card text-ink">{t("ai.whatItWontDo")}</p>
            <p className="mt-0.5 text-[0.75rem] leading-[1.15rem] text-ink-muted">
              These limits are what make an assistant safe to put in front of
              patients. Four of them cannot be switched off at all — an
              assistant that can be configured to give a diagnosis is not a
              safe assistant, however the configuration is worded.
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-start gap-3 px-4 py-3.5">
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5",
                  rule.enabled
                    ? "bg-status-completed-bg text-status-completed"
                    : "bg-surface-sunken text-ink-faint"
                )}
              >
                {rule.enabled ? <ShieldCheck /> : <ShieldAlert />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-small font-medium text-ink">
                    {rule.title}
                  </span>
                  {rule.locked && (
                    <Tooltip content={t("hint.cannotBeDisabled")}>
                      <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-1.5 py-px text-[0.625rem] font-semibold uppercase tracking-[0.06em] text-forest-700">
                        <Lock className="size-2.5" />
                        {t("ai.alwaysOn")}
                      </span>
                    </Tooltip>
                  )}
                </p>
                <p className="mt-1 text-[0.75rem] leading-[1.15rem] text-ink-muted">
                  {rule.description}
                </p>
                <p className="mt-1.5 text-[0.6875rem] tabular-nums text-ink-faint">
                  Applied {rule.triggered} times in the last 30 days
                </p>
              </div>

              <button
                onClick={() => toggle(rule)}
                role="switch"
                aria-checked={rule.enabled}
                aria-label={`${rule.title} — ${rule.enabled ? "on" : "off"}`}
                className={cn(
                  "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
                  rule.enabled ? "bg-forest-600" : "bg-line-strong",
                  rule.locked && "opacity-60"
                )}
              >
                <span
                  className={cn(
                    "size-4 rounded-full bg-white shadow-card transition-transform",
                    rule.enabled && "translate-x-4 rtl:-translate-x-4"
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-[0.75rem] text-ink-muted">
        Rule changes are held in this browser session only. The four locked
        rules are enforced in the assistant itself, not just in this screen.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ the module */

export function AssistantModule() {
  const { t, fmt } = useI18n();
  const metrics = assistantMetrics();
  const [open, setOpen] = React.useState<Conversation | null>(null);
  const usage = articleUsage();
  const withheldInUse = usage.filter((u) => {
    const a = articleById(u.articleId);
    return a && !assistantCanUse(a);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <h1 className="text-title text-ink">{t("ai.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("h.conversationsSubtitle", {
              count: fmt.number(metrics.total),
            })}
          </p>
        </div>
        <Button variant="secondary" size="md" asChild>
          <Link href="/knowledge">
            <BookOpen />
            {t("ai.knowledgeCenter")}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <Stat
          label={t("ai.conversations")}
          value={String(metrics.total)}
          hint={t("h.stillActive", { count: fmt.number(metrics.active) })}
        />
        <Stat
          label={t("ai.resolved")}
          value={`${metrics.resolutionRate.toFixed(0)}%`}
          hint={t("h.xOfY", {
              a: fmt.number(metrics.resolved),
              b: fmt.number(metrics.total),
            })}
          tone="good"
        />
        <Stat
          label={t("ai.bookingsMade")}
          value={String(metrics.bookings)}
          hint={t("h.percentOfConversations", {
              percent: fmt.percent(metrics.conversionRate, 0),
            })}
        />
        <Stat
          label={t("ai.handedToHuman")}
          value={String(metrics.escalated)}
          hint={t("ai.safetyOrRequest")}
          tone={metrics.escalated ? "pending" : undefined}
        />
        <Stat
          label={t("ai.unanswered")}
          value={String(metrics.unansweredQuestions)}
          hint={t("h.asksNoArticle", {
              count: fmt.number(metrics.unansweredAsks),
            })}
          tone="pending"
        />
        <Stat
          label={t("ai.satisfaction")}
          value={metrics.satisfaction.toFixed(1)}
          hint={t("h.fromRatings", { count: fmt.number(metrics.rated) })}
        />
      </div>

      {/* The dependency on Module 09, stated plainly */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md",
              withheldInUse.length
                ? "bg-status-pending-bg text-status-pending"
                : "bg-status-completed-bg text-status-completed"
            )}
          >
            {withheldInUse.length ? (
              <AlertTriangle className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
          </span>
          {/* min-w keeps the copy readable instead of letting the button
              squeeze it into a one-word column on a phone. */}
          <div className="min-w-[14rem] flex-1">
            <p className="text-card text-ink">{t("ai.whereAnswersFrom")}</p>
            <p className="mt-0.5 text-[0.75rem] leading-[1.15rem] text-ink-muted">
              The assistant answers only from published, approved articles. It
              cited {usage.length} different articles across these
              conversations.
              {withheldInUse.length > 0 && (
                <>
                  {" "}
                  <span className="font-medium text-status-pending">
                    {withheldInUse.length} of them{" "}
                    {withheldInUse.length === 1 ? "is" : "are"} no longer served
                    — past answers used content the Knowledge Center now
                    withholds.
                  </span>
                </>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="shrink-0 basis-full sm:basis-auto"
          >
            <Link href="/knowledge">{t("ai.reviewKnowledge")}</Link>
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="conversations" className="min-w-0">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="conversations">{t("ai.conversations")}</TabsTrigger>
            <TabsTrigger value="unanswered">
              Unanswered ({unanswered.length})
            </TabsTrigger>
            <TabsTrigger value="performance">{t("ai.performance")}</TabsTrigger>
            <TabsTrigger value="safety">{t("ai.safety")}</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="conversations">
            <Conversations onOpen={setOpen} />
          </TabsContent>
          <TabsContent value="unanswered">
            <Unanswered />
          </TabsContent>
          <TabsContent value="performance">
            <Performance />
          </TabsContent>
          <TabsContent value="safety">
            <Safety />
          </TabsContent>
        </div>
      </Tabs>

      <ConversationDetail
        conversation={open}
        onOpenChange={(o) => !o && setOpen(null)}
      />
    </div>
  );
}
