"use client";

import * as React from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Languages,
  Plus,
  Search,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { articles as seedArticles, type Article } from "@/lib/mock/knowledge";
import {
  ARTICLE_STATUS_META,
  CATEGORIES,
  assistantCanUse,
  isClinicalCategory,
  withheldReason,
  type ArticleStatus,
  type WorkflowAction,
} from "@/lib/knowledge";
import { doctorProfileById } from "@/lib/mock/doctors";
import { staffUsers } from "@/lib/mock/users";
import { TODAY } from "@/lib/mock/schedule";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, Tooltip } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { fmtDate } from "@/components/patients/patients-register";
import { ArticleEditor } from "./article-editor";
import { useI18n } from "@/components/i18n/locale-context";
import { pickText } from "@/lib/mock/localize";
import { ARTICLE_CATEGORY_AR } from "@/lib/mock/content-ar";

const authorName = (id: string) =>
  doctorProfileById(id)?.name ??
  staffUsers.find((u) => u.id === id)?.name ??
  "Unknown";

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

export function KnowledgeModule() {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const { can } = useRole();
  const [articles, setArticles] = React.useState<Article[]>(seedArticles);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  const open = openId ? articles.find((a) => a.id === openId) : undefined;

  const update = (next: Article) =>
    setArticles((all) => all.map((a) => (a.id === next.id ? next : a)));

  const runAction = (article: Article, action: WorkflowAction) => {
    const me = can("records.diagnosis.confirm") ? "d1" : "u-owner";
    let next: Article = article;

    switch (action) {
      case "submit":
        next = { ...article, status: "in_review", updated: TODAY };
        toast({
          tone: "info",
          title: t("kb.sentForReview"),
          detail: isClinicalCategory(article.category)
            ? "A clinician must approve it before the assistant can use it."
            : "Awaiting sign-off. Session state only.",
        });
        break;
      case "approve":
        next = {
          ...article,
          status: "published",
          reviewerId: me,
          reviewedOn: TODAY,
          updated: TODAY,
        };
        toast({
          tone: "success",
          title: t("kb.approvedPublished"),
          detail: t("kb.nowAnswerable"),
        });
        break;
      case "publish":
        next = { ...article, status: "published", updated: TODAY };
        toast({
          tone: "success",
          title: t("kb.published"),
          detail: t("kb.liveSessionOnly"),
        });
        break;
      case "archive":
        next = { ...article, status: "archived", updated: TODAY };
        toast({
          tone: "info",
          title: t("kb.archived"),
          detail: t("kb.withdrawn"),
        });
        break;
      case "restore":
        next = { ...article, status: "draft", updated: TODAY };
        toast({
          tone: "info",
          title: t("kb.restoredDraft"),
          detail: t("kb.mustReview"),
        });
        break;
    }
    update(next);
  };

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (status === "live" && !assistantCanUse(a)) return false;
      if (status !== "all" && status !== "live" && a.status !== status)
        return false;
      if (
        q &&
        !a.title.toLowerCase().includes(q) &&
        !a.summary.toLowerCase().includes(q) &&
        !a.tags.join(" ").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [articles, query, category, status]);

  const live = articles.filter(assistantCanUse);
  const withheldPublished = articles.filter(
    (a) => a.status === "published" && !assistantCanUse(a)
  );
  const inReview = articles.filter((a) => a.status === "in_review");
  const drafts = articles.filter((a) => a.status === "draft");
  const archived = articles.filter((a) => a.status === "archived");

  if (open) {
    return (
      <ArticleEditor
        article={open}
        onBack={() => setOpenId(null)}
        onChange={update}
        onAction={(action) => runAction(open, action)}
      />
    );
  }

  const columns: Column<Article>[] = [
    {
      id: "title",
      header: t("col.article"),
      sortBy: (a) => a.title,
      cell: (a) => (
        <span className="block min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-medium text-ink">{a.title}</span>
            {a.language === "ar" && (
              <Tooltip content="Arabic">
                <Languages className="size-3 shrink-0 text-ink-faint" />
              </Tooltip>
            )}
            {isClinicalCategory(a.category) && (
              <Tooltip content="Clinical content — needs clinician approval">
                <ShieldCheck className="size-3 shrink-0 text-forest-400" />
              </Tooltip>
            )}
          </span>
          <span className="block truncate text-[0.75rem] text-ink-faint">
            {pickText(a.category, ARTICLE_CATEGORY_AR)}
          </span>
        </span>
      ),
    },
    {
      id: "assistant",
      header: t("col.assistant"),
      sortBy: (a) => (assistantCanUse(a) ? 0 : 1),
      cell: (a) =>
        assistantCanUse(a) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-status-completed-bg px-2 py-0.5 text-[0.75rem] font-medium text-status-completed">
            <Bot className="size-3" />
            {t("kb.live")}
          </span>
        ) : (
          <Tooltip content={withheldReason(a) ?? ""}>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-[0.75rem] font-medium text-ink-muted">
              {t("kb.withheld")}
            </span>
          </Tooltip>
        ),
    },
    {
      id: "status",
      header: t("col.status"),
      sortBy: (a) => a.status,
      cell: (a) => {
        const meta = ARTICLE_STATUS_META[a.status];
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
    {
      id: "reviewer",
      header: t("col.reviewedBy"),
      hideBelow: "lg",
      sortBy: (a) => a.reviewerId ?? "",
      cell: (a) =>
        a.reviewerId ? (
          <span className="truncate">{authorName(a.reviewerId)}</span>
        ) : isClinicalCategory(a.category) ? (
          <span className="text-status-pending">{t("kb.needsClinician")}</span>
        ) : (
          <span className="text-ink-faint">{t("kb.notRequired")}</span>
        ),
    },
    {
      id: "citations",
      header: t("col.cited"),
      align: "end",
      hideBelow: "xl",
      sortBy: (a) => a.citations,
      cell: (a) => (
        <span className="tabular-nums text-ink-muted">{a.citations || "—"}</span>
      ),
    },
    {
      id: "updated",
      header: t("col.updated"),
      hideBelow: "md",
      sortBy: (a) => a.updated,
      cell: (a) => <span className="tabular-nums">{fmtDate(a.updated)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <h1 className="text-title text-ink">{t("kb.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
            {t("kb.subtitleFull", {
              count: fmt.number(articles.length),
              categories: fmt.number(CATEGORIES.length),
            })}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() =>
            toast({
              tone: "info",
              title: t("kb.newNeedsBackend"),
              detail: t("kb.newBody"),
            })
          }
        >
          <Plus />
          {t("kb.newArticle")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label={t("kb.liveToAssistant")}
          value={String(live.length)}
          hint={t("kb.publishedApproved")}
          tone="good"
        />
        <Stat
          label={t("kb.inReview")}
          value={String(inReview.length)}
          hint={t("kb.awaitingApproval")}
          tone={inReview.length ? "pending" : undefined}
        />
        <Stat label={t("kb.drafts")} value={String(drafts.length)} hint={t("kb.beingWritten")} />
        <Stat
          label={t("kb.withheld")}
          value={String(withheldPublished.length)}
          hint={
            withheldPublished.length
              ? t("kb.publishedUnapproved")
              : t("kb.nothingBlocked")
          }
          tone={withheldPublished.length ? "pending" : undefined}
        />
        <Stat
          label={t("kb.archived")}
          value={String(archived.length)}
          hint={t("kb.keptNeverServed")}
        />
      </div>

      {/* The gate, proven at a glance */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md",
              withheldPublished.length
                ? "bg-status-pending-bg text-status-pending"
                : "bg-status-completed-bg text-status-completed"
            )}
          >
            {withheldPublished.length ? (
              <AlertTriangle className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-card text-ink">
              {t("kb.whatAssistantAnswers")}
            </p>
            <p className="mt-0.5 text-[0.75rem] leading-[1.15rem] text-ink-muted">
              {t("kb.servedExplainer", {
                live: fmt.number(live.length),
                total: fmt.number(articles.length),
              })}
              {withheldPublished.length > 0 && (
                <>
                  {" "}
                  <span className="font-medium text-status-pending">
                    {t("kb.withheldForSignOff", {
                      count: fmt.number(withheldPublished.length),
                    })}
                  </span>
                </>
              )}
            </p>
            {withheldPublished.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {withheldPublished.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => setOpenId(a.id)}
                      className="rounded-full border border-status-pending/30 bg-status-pending-bg/60 px-2.5 py-1 text-[0.75rem] font-medium text-status-pending transition-colors hover:border-status-pending/50"
                    >
                      {a.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("kb.searchPlaceholder")}
              className="ps-9"
              aria-label={t("kb.search")}
            />
          </div>
          <Select
            value={category}
            onValueChange={setCategory}
            ariaLabel="Filter by category"
            options={[
              { value: "all", label: t("kb.allCategories") },
              ...CATEGORIES.map((c) => ({
                value: c.name,
                label: c.name,
                hint: c.clinical ? t("kb.categoryClinical") : undefined,
              })),
            ]}
          />
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Filter by status"
            options={[
              { value: "all", label: t("patients.allStatuses") },
              { value: "live", label: t("kb.liveToTheAssistant") },
              ...(
                Object.keys(ARTICLE_STATUS_META) as ArticleStatus[]
              ).map((s) => ({
                value: s,
                label: ARTICLE_STATUS_META[s].label,
              })),
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(a) => a.id}
          onRowClick={(a) => setOpenId(a.id)}
          caption={t("cap.knowledge")}
          pageSize={10}
          empty={
            <EmptyState
              illustration={
                <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                  <SearchX className="size-5 text-forest-400" />
                </span>
              }
              title={t("kb.empty.title")}
              description={t("kb.empty.body")}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
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

      <p className="text-[0.75rem] text-ink-muted">
        Workflow changes are held in this browser session only. Clinical
        categories require a clinician to approve the content — a role without
        that permission can submit for review but cannot sign it off.
      </p>
    </div>
  );
}
