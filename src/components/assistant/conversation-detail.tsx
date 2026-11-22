"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  CalendarCheck,
  Lock,
  MessageSquare,
  ShieldAlert,
  Star,
  UserRound,
  Zap,
} from "lucide-react";
import {
  CONVERSATION_STATUS_META,
  safetyRuleById,
  type Conversation,
} from "@/lib/mock/assistant";
import { articleById } from "@/lib/mock/knowledge";
import { assistantCanUse, withheldReason } from "@/lib/knowledge";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/overlay";
import { Tooltip } from "@/components/ui/primitives";
import { useRole } from "@/components/access/role-context";
import { fmtDate } from "@/components/patients/patients-register";
import { useI18n } from "@/components/i18n/locale-context";
import { pickText } from "@/lib/mock/localize";
import { ARTICLE_CATEGORY_AR } from "@/lib/mock/content-ar";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/** Knowledge the assistant used, shown through the publish gate. */
function Citations({ ids }: { ids: string[] }) {
  const { t } = useI18n();
  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line/70 pt-2 text-[0.6875rem] text-ink-faint">
      <BookOpen className="size-3 shrink-0" />
      Answered from:
      {ids.map((id) => {
        const article = articleById(id);
        if (!article) return null;
        const served = assistantCanUse(article);
        return (
          <Tooltip
            key={id}
            content={
              served
                ? `${pickText(
                    article.category,
                    ARTICLE_CATEGORY_AR
                  )} · ${t("kb.publishedApprovedLower")}`
                : `No longer served: ${withheldReason(article)}`
            }
          >
            <Link
              href="/knowledge"
              className={cn(
                "rounded-full border px-1.5 py-px transition-colors",
                served
                  ? "border-line bg-surface text-ink-soft hover:border-forest-300 hover:text-forest-700"
                  : "border-status-pending/40 bg-status-pending-bg/60 text-status-pending line-through"
              )}
            >
              {article.title}
            </Link>
          </Tooltip>
        );
      })}
    </p>
  );
}

export function ConversationDetail({
  conversation,
  onOpenChange,
}: {
  conversation: Conversation | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const { can } = useRole();
  const canSeePatient = can("records.view");

  if (!conversation) return null;
  const meta = CONVERSATION_STATUS_META[conversation.status];
  const bookings = conversation.messages.filter((m) => m.action);
  const rulesFired = Array.from(
    new Set(
      conversation.messages
        .map((m) => m.safetyRuleId)
        .filter((id): id is string => !!id)
    )
  );

  return (
    <Drawer open={!!conversation} onOpenChange={onOpenChange}>
      <DrawerContent
        title={`Conversation ${conversation.ref}`}
        description={`${conversation.channel} · ${fmtDate(conversation.startedAt)}`}
        footer={
          <>
            <Button variant="secondary" size="md" asChild>
              <Link href="/knowledge">
                <BookOpen />
                {t("ai.knowledgeBase")}
              </Link>
            </Button>
            {conversation.patientId && canSeePatient && (
              <Button variant="secondary" size="md" asChild>
                <Link href={`/patients/${conversation.patientId}`}>
                  <UserRound />
                  {t("appt.drawer.patientRecord")}
                </Link>
              </Button>
            )}
          </>
        }
      >
        {/* Who */}
        <div className="flex items-center gap-3 border-b border-line bg-canvas px-5 py-4">
          <Avatar
            src={conversation.avatar}
            name={conversation.patientName}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-card text-ink">
              {conversation.patientId && !canSeePatient
                ? "Patient (identity hidden)"
                : conversation.patientName}
            </p>
            <p className="truncate text-[0.75rem] text-ink-muted">
              {conversation.topic} · {conversation.channel}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
              meta.chip
            )}
          >
            {meta.label}
          </span>
        </div>

        {conversation.patientId && !canSeePatient && (
          <p className="flex items-start gap-2 border-b border-line bg-status-pending-bg/40 px-5 py-2.5 text-[0.75rem] text-status-pending">
            <Lock className="mt-px size-3.5 shrink-0" />
            Your role can read the conversation but not the patient&apos;s
            identity or record.
          </p>
        )}

        {conversation.handoffReason && (
          <p className="flex items-start gap-2 border-b border-line bg-status-pending-bg/40 px-5 py-2.5 text-[0.75rem] text-status-pending">
            <ShieldAlert className="mt-px size-3.5 shrink-0" />
            <span>
              <span className="font-medium">{t("ai.handedToHumanDot")}</span>{" "}
              {conversation.handoffReason}
            </span>
          </p>
        )}

        {/* Transcript */}
        <div className="space-y-3 px-5 py-4">
          {conversation.messages.map((m) => {
            const rule = m.safetyRuleId ? safetyRuleById(m.safetyRuleId) : null;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2.5",
                  m.from === "patient" ? "flex-row" : "flex-row"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5",
                    m.from === "assistant" && "bg-status-progress-bg text-status-progress",
                    m.from === "patient" && "bg-surface-sunken text-ink-muted",
                    m.from === "staff" && "bg-forest-50 text-forest-700"
                  )}
                >
                  {m.from === "assistant" ? (
                    <Bot />
                  ) : m.from === "staff" ? (
                    <UserRound />
                  ) : (
                    <MessageSquare />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "rounded-card border px-3 py-2.5",
                      m.from === "assistant"
                        ? "border-status-progress/20 bg-status-progress-bg/25"
                        : m.from === "staff"
                          ? "border-forest-200/60 bg-forest-50/50"
                          : "border-line bg-surface"
                    )}
                  >
                    <p className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.06em] text-ink-faint">
                      {m.from === "assistant"
                        ? "Luceat Assistant"
                        : m.from === "staff"
                          ? "Clinic team"
                          : "Patient"}
                      <span className="tabular-nums normal-case tracking-normal">
                        {timeFmt.format(new Date(m.at))}
                      </span>
                    </p>
                    <p className="mt-1 text-small leading-5 text-ink">{m.text}</p>

                    {m.articleIds && m.articleIds.length > 0 && (
                      <Citations ids={m.articleIds} />
                    )}

                    {rule && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-field border border-status-pending/25 bg-status-pending-bg/50 px-2 py-1.5 text-[0.6875rem] text-status-pending">
                        <ShieldAlert className="mt-px size-3 shrink-0" />
                        Safety rule applied: {rule.title}
                      </p>
                    )}

                    {m.action && (
                      <p className="mt-2 flex items-start gap-1.5 rounded-field border border-status-completed/25 bg-status-completed-bg/50 px-2 py-1.5 text-[0.6875rem] text-status-completed">
                        <Zap className="mt-px size-3 shrink-0" />
                        {m.action.kind === "handoff" ? t("ai.handedOver") : "Action taken"}:{" "}
                        {m.action.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Outcome */}
        <div className="border-t border-line px-5 py-4">
          <p className="text-label uppercase text-ink-faint">{t("ai.outcome")}</p>
          <ul className="mt-2 space-y-2 text-small">
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <CalendarCheck className="size-3.5" />
                {t("ai.bookingMade")}
              </span>
              <span className="text-ink">
                {conversation.bookingMade ? "Yes" : "No"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <Zap className="size-3.5" />
                {t("ai.actionsTaken")}
              </span>
              <span className="tabular-nums text-ink">{bookings.length}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <ShieldAlert className="size-3.5" />
                {t("ai.safetyRulesApplied")}
              </span>
              <span className="tabular-nums text-ink">{rulesFired.length}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-ink-muted">
                <Star className="size-3.5" />
                {t("ai.patientRating")}
              </span>
              <span className="flex items-center gap-1 text-ink">
                {conversation.rating ? (
                  <>
                    <Star className="size-3 fill-gold-300 text-gold-300" />
                    {conversation.rating} / 5
                  </>
                ) : (
                  <span className="text-ink-faint">{t("ai.notRated")}</span>
                )}
              </span>
            </li>
          </ul>

          {conversation.feedback && (
            <p className="mt-3 rounded-field border border-line bg-canvas p-3 text-[0.75rem] italic leading-[1.15rem] text-ink-soft">
              “{conversation.feedback}”
            </p>
          )}

          {conversation.status === "unresolved" && (
            <p className="mt-3 flex items-start gap-1.5 rounded-field border border-status-cancelled/25 bg-status-cancelled-bg/50 px-2.5 py-2 text-[0.75rem] text-status-cancelled">
              <AlertTriangle className="mt-px size-3.5 shrink-0" />
              Nothing published covered this question — it is in the unanswered
              queue for an article to be written.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
