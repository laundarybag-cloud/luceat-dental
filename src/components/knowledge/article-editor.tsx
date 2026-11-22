"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Hash,
  Languages,
  Paperclip,
  Pencil,
  Save,
  ShieldCheck,
  Upload,
  UserCheck,
} from "lucide-react";
import type { Article } from "@/lib/mock/knowledge";
import {
  ARTICLE_STATUS_META,
  CATEGORIES,
  actionsFor,
  assistantCanUse,
  isClinicalCategory,
  withheldReason,
  type KnowledgeCategory,
  type WorkflowAction,
} from "@/lib/knowledge";
import { doctorProfileById } from "@/lib/mock/doctors";
import { staffUsers } from "@/lib/mock/users";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { Panel } from "@/components/patients/profile-tabs";
import { fmtDate } from "@/components/patients/patients-register";
import { ArticleBody } from "./article-body";
import { useI18n } from "@/components/i18n/locale-context";
import { pickText } from "@/lib/mock/localize";
import { ARTICLE_CATEGORY_AR } from "@/lib/mock/content-ar";

const authorName = (id: string) =>
  doctorProfileById(id)?.name ??
  staffUsers.find((u) => u.id === id)?.name ??
  "Unknown author";

export function ArticleEditor({
  article,
  onBack,
  onChange,
  onAction,
}: {
  article: Article;
  onBack: () => void;
  onChange: (next: Article) => void;
  onAction: (action: WorkflowAction) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const { can } = useRole();
  const canApproveClinical = can("records.diagnosis.confirm");

  const [draft, setDraft] = React.useState(article);
  React.useEffect(() => setDraft(article), [article]);

  const dirty =
    draft.title !== article.title ||
    draft.summary !== article.summary ||
    draft.body !== article.body ||
    draft.category !== article.category ||
    draft.language !== article.language ||
    draft.tags.join() !== article.tags.join();

  const live = assistantCanUse(article);
  const withheld = withheldReason(article);
  const clinical = isClinicalCategory(article.category);
  const actions = actionsFor(article, canApproveClinical);
  const meta = ARTICLE_STATUS_META[article.status];

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ms-2">
        <ArrowLeft className="rtl:rotate-180" />
        {t("kb.allArticles")}
      </Button>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-[linear-gradient(104deg,var(--color-surface)_0%,var(--color-canvas)_60%,var(--color-forest-50)_100%)] p-5 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-title text-ink">{article.title}</h1>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.75rem] font-medium",
                  meta.chip
                )}
              >
                {meta.label}
              </span>
              {clinical && (
                <Badge tone="brand">
                  <ShieldCheck className="size-3" />
                  {t("kb.categoryClinical")}
                </Badge>
              )}
              {article.language === "ar" && (
                <Badge tone="neutral">
                  <Languages className="size-3" />
                  العربية
                </Badge>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-ink-muted">
              <span>{pickText(article.category, ARTICLE_CATEGORY_AR)}</span>
              <span aria-hidden>·</span>
              <span>v{article.version}</span>
              <span aria-hidden>·</span>
              <span>By {authorName(article.authorId)}</span>
              <span aria-hidden>·</span>
              <span>Updated {fmtDate(article.updated)}</span>
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions.map((a) => (
              <Button
                key={a.action}
                variant={a.action === "archive" ? "secondary" : "primary"}
                size="md"
                disabled={!!a.blockedBecause}
                title={a.blockedBecause ?? undefined}
                onClick={() => onAction(a.action)}
              >
                {a.action === "approve" ? <UserCheck /> : <CheckCircle2 />}
                {a.label}
              </Button>
            ))}
          </div>
        </div>

        {/* The gate, stated on every article */}
        <div
          className={cn(
            "flex items-start gap-2.5 border-t px-5 py-3 text-small",
            live
              ? "border-status-completed/20 bg-status-completed-bg/40 text-status-completed"
              : "border-status-pending/25 bg-status-pending-bg/40 text-status-pending"
          )}
        >
          <Bot className="mt-px size-4 shrink-0" />
          <span>
            {live ? (
              <>
                <span className="font-medium">
                  {t("kb.canAnswer")}
                </span>{" "}
                Cited {article.citations} times in the last 30 days.
              </>
            ) : (
              <>
                <span className="font-medium">
                  {t("kb.cannotAnswer")}
                </span>{" "}
                {withheld}
              </>
            )}
          </span>
        </div>

        {actions.some((a) => a.blockedBecause) && (
          <p className="flex items-start gap-2 border-t border-line px-5 py-2.5 text-[0.75rem] text-ink-muted">
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-status-pending" />
            {actions.find((a) => a.blockedBecause)?.blockedBecause}
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Tabs defaultValue="edit" className="min-w-0">
          <TabsList>
            <TabsTrigger value="edit">
              <Pencil className="me-1.5 size-3.5" />
              {t("common.edit")}
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="me-1.5 size-3.5" />
              {t("kb.preview")}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="edit">
              <Panel
                title={t("kb.articleContent")}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!dirty}
                    onClick={() => {
                      onChange({
                        ...draft,
                        updated: new Date().toISOString().slice(0, 10),
                        version: article.version + 1,
                      });
                      toast({
                        tone: "info",
                        title: t("kb.draftKept"),
                        detail: t("kb.contentNotSaved"),
                      });
                    }}
                  >
                    <Save />
                    {t("kb.saveChanges")}
                  </Button>
                }
              >
                <div className="space-y-4">
                  <Field label={t("kb.title_")} htmlFor="kb-title" required>
                    <Input
                      id="kb-title"
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({ ...draft, title: e.target.value })
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={t("serviceForm.category")}
                      required
                      hint={
                        isClinicalCategory(draft.category)
                          ? t("kb.clinicalNeedsApproval")
                          : t("kb.nonClinical")
                      }
                    >
                      <Select
                        value={draft.category}
                        onValueChange={(v) =>
                          setDraft({
                            ...draft,
                            category: v as KnowledgeCategory,
                          })
                        }
                        ariaLabel={t("serviceForm.category")}
                        options={CATEGORIES.map((c) => ({
                          value: c.name,
                          label: c.name,
                          hint: c.clinical ? t("kb.categoryClinical") : undefined,
                        }))}
                      />
                    </Field>
                    <Field label={t("kb.language")}>
                      <Select
                        value={draft.language}
                        onValueChange={(v) =>
                          setDraft({ ...draft, language: v as "en" | "ar" })
                        }
                        ariaLabel={t("kb.language")}
                        options={[
                          { value: "en", label: t("kb.langEnglish") },
                          { value: "ar", label: t("kb.langArabic") },
                        ]}
                      />
                    </Field>
                  </div>

                  <Field
                    label={t("kb.summary")}
                    hint={t("kb.summaryHint")}
                  >
                    <Textarea
                      value={draft.summary}
                      onChange={(e) =>
                        setDraft({ ...draft, summary: e.target.value })
                      }
                      className="min-h-16"
                    />
                  </Field>

                  <Field
                    label={t("kb.body")}
                    hint={t("kb.bodyHint")}
                  >
                    <Textarea
                      value={draft.body}
                      onChange={(e) =>
                        setDraft({ ...draft, body: e.target.value })
                      }
                      className="min-h-80 font-mono text-[0.8125rem] leading-6"
                      dir={draft.language === "ar" ? "rtl" : undefined}
                    />
                  </Field>

                  <Field
                    label={t("kb.tags")}
                    hint={t("kb.tagsHint")}
                  >
                    <Input
                      value={draft.tags.join(", ")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </Field>
                </div>
              </Panel>
            </TabsContent>

            <TabsContent value="preview">
              <Panel title={t("kb.howPatientSees")}>
                <div className="rounded-card border border-line bg-canvas p-5">
                  <h2
                    className={cn(
                      "text-section text-ink",
                      draft.language === "ar" && "font-arabic"
                    )}
                    dir={draft.language === "ar" ? "rtl" : undefined}
                  >
                    {draft.title}
                  </h2>
                  <p
                    className={cn(
                      "mt-1 text-small text-ink-muted",
                      draft.language === "ar" && "font-arabic"
                    )}
                    dir={draft.language === "ar" ? "rtl" : undefined}
                  >
                    {draft.summary}
                  </p>
                  <div className="mt-4 border-t border-line pt-4">
                    <ArticleBody
                      body={draft.body}
                      rtl={draft.language === "ar"}
                    />
                  </div>
                </div>
                <p className="mt-3 text-[0.75rem] text-ink-faint">
                  The assistant answers in its own words and cites this
                  article; it does not read the text out verbatim.
                </p>
              </Panel>
            </TabsContent>
          </div>
        </Tabs>

        {/* Sidebar */}
        <div className="space-y-4">
          <Panel title={t("kb.review")}>
            <ul className="space-y-2.5 text-small">
              <li className="flex items-start justify-between gap-3">
                <span className="text-ink-muted">{t("kb.author")}</span>
                <span className="text-end text-ink">
                  {authorName(article.authorId)}
                </span>
              </li>
              <li className="flex items-start justify-between gap-3">
                <span className="text-ink-muted">{t("kb.clinicalReviewer")}</span>
                <span className="text-end text-ink">
                  {article.reviewerId ? (
                    authorName(article.reviewerId)
                  ) : (
                    <span className="text-status-pending">{t("kb.notReviewed")}</span>
                  )}
                </span>
              </li>
              {article.reviewedOn && (
                <li className="flex items-start justify-between gap-3">
                  <span className="text-ink-muted">{t("kb.approved")}</span>
                  <span className="text-end tabular-nums text-ink">
                    {fmtDate(article.reviewedOn)}
                  </span>
                </li>
              )}
              <li className="flex items-start justify-between gap-3">
                <span className="text-ink-muted">{t("patients.created")}</span>
                <span className="text-end tabular-nums text-ink">
                  {fmtDate(article.created)}
                </span>
              </li>
            </ul>

            {clinical && !article.reviewerId && (
              <p className="mt-3 flex items-start gap-1.5 rounded-field border border-status-pending/30 bg-status-pending-bg/60 px-2.5 py-2 text-[0.75rem] text-status-pending">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                Clinical content with no clinician sign-off is withheld from
                the assistant even once published.
              </p>
            )}
          </Panel>

          <Panel title={t("kb.usage")}>
            <div className="flex items-baseline justify-between">
              <span className="text-[0.75rem] text-ink-muted">
                {t("kb.citedBy")}
              </span>
              <span data-metric className="text-title text-ink">
                {article.citations}
              </span>
            </div>
            {/* Don't imply an article is being cited while it is withheld. */}
            <p className="mt-0.5 text-[0.75rem] text-ink-faint">
              {live
                ? t("doctors.inLast30")
                : article.citations > 0
                  ? t("kb.beforeWithheld")
                  : "Never cited"}
            </p>
            <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[0.75rem] text-ink-muted">
              <Clock className="size-3.5" />
              Version {article.version}
            </p>
          </Panel>

          <Panel
            title={`Attachments (${article.attachments.length})`}
            action={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("kb.uploadAttachment")}
                onClick={() =>
                  toast({
                    tone: "info",
                    title: t("common.uploadsNeedBackend"),
                    detail: t("kb.attachmentsBody"),
                  })
                }
              >
                <Upload />
              </Button>
            }
          >
            {article.attachments.length ? (
              <ul className="space-y-2">
                {article.attachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-muted">
                      {a.kind === "pdf" ? (
                        <FileText className="size-3.5" />
                      ) : (
                        <Paperclip className="size-3.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small text-ink">
                        {a.name}
                      </span>
                      <span className="block text-[0.6875rem] tabular-nums text-ink-faint">
                        {(a.sizeKb / 1024).toFixed(2)} MB
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-small text-ink-faint">
                {t("kb.noAttachments")}
              </p>
            )}
          </Panel>

          <Panel title={t("kb.tags")}>
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.length ? (
                draft.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-[0.75rem] text-ink-soft"
                  >
                    <Hash className="size-3 text-ink-faint" />
                    {t}
                  </span>
                ))
              ) : (
                <p className="text-small text-ink-faint">{t("kb.noTags")}</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
