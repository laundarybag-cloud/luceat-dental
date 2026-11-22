"use client";

import * as React from "react";
import { BookOpen, Bot, Check, FileQuestion, Info, X } from "lucide-react";
import Link from "next/link";
import { articleById } from "@/lib/mock/knowledge";
import { assistantCanUse } from "@/lib/knowledge";
import { cn } from "@/lib/utils";
import type { AssistantSuggestion } from "@/lib/mock/records";
import { useRole } from "@/components/access/role-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { fmtDate } from "@/components/patients/patients-register";
import { Panel } from "@/components/patients/profile-tabs";
import { useI18n } from "@/components/i18n/locale-context";

/**
 * Assistant observations.
 *
 * Deliberately *not* styled like the diagnoses list, and never called a
 * finding, a diagnosis or a suggestion of treatment. Each entry states what
 * the patient said, where it came from, and that a clinician must examine the
 * patient before anything enters the record. Confirming does not copy text
 * into the record: it opens the clinician's own diagnosis entry.
 */
export function AssistantObservations({
  suggestions,
  patientName,
}: {
  suggestions: AssistantSuggestion[];
  patientName: string;
}) {
  const { t } = useI18n();
  const { can } = useRole();
  const toast = useToast();
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const open = suggestions.filter((s) => !dismissed.includes(s.id));

  if (!suggestions.length) {
    return (
      <Panel title={t("records.obsTitle")}>
        <p className="py-6 text-center text-small text-ink-faint">
          The assistant has not flagged anything from this patient&apos;s
          conversations.
        </p>
      </Panel>
    );
  }

  return (
    <section className="rounded-card border border-status-progress/25 bg-status-progress-bg/25">
      <header className="flex flex-wrap items-center gap-2 border-b border-status-progress/20 px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-status-progress-bg text-status-progress">
          <Bot className="size-3.5" />
        </span>
        <h3 className="text-card text-ink">{t("records.obsTitle")}</h3>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-status-progress">
          {t("records.obsNotDiagnosis")}
        </span>
        <span className="ms-auto text-[0.75rem] tabular-nums text-ink-muted">
          {open.length} awaiting review
        </span>
      </header>

      <p className="flex items-start gap-2 border-b border-status-progress/20 px-4 py-2.5 text-[0.75rem] leading-[1.15rem] text-ink-soft">
        <Info className="mt-px size-3.5 shrink-0 text-status-progress" />
        These are things {patientName.split(" ")[0]} said to the patient
        assistant. They are unverified, carry no clinical weight, and form no
        part of the record. Only a clinician who has examined the patient can
        record a diagnosis.
      </p>

      <div className="divide-y divide-status-progress/15">
        {open.length === 0 ? (
          <p className="px-4 py-6 text-center text-small text-ink-muted">
            {t("records.obsAllReviewed")}
          </p>
        ) : (
          open.map((s) => (
            <article key={s.id} className="px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <FileQuestion className="mt-0.5 size-4 shrink-0 text-status-progress" />
                <div className="min-w-0 flex-1">
                  <p className="text-small leading-5 text-ink">{s.observation}</p>
                  <p className="mt-1.5 text-[0.75rem] text-ink-muted">
                    {s.basis} · raised {fmtDate(s.raisedOn)} ·{" "}
                    <span className="capitalize">{s.confidence}</span> signal
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-ink-faint">
                    Drawn from: {s.sources.join(" · ")}
                  </p>

                  {/* Knowledge the assistant used, filtered through the same
                      publish gate the Knowledge Center enforces: an article
                      withdrawn there stops being cited here. */}
                  {s.articleIds.length > 0 && (
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.6875rem] text-ink-faint">
                      <BookOpen className="size-3 shrink-0" />
                      Knowledge used:
                      {s.articleIds.map((id) => {
                        const article = articleById(id);
                        if (!article) return null;
                        const served = assistantCanUse(article);
                        return (
                          <Link
                            key={id}
                            href="/knowledge"
                            className={cn(
                              "rounded-full border px-1.5 py-px transition-colors",
                              served
                                ? "border-line bg-surface text-ink-soft hover:border-forest-300 hover:text-forest-700"
                                : "border-status-pending/30 bg-status-pending-bg/60 text-status-pending line-through"
                            )}
                            title={
                              served
                                ? t("kb.publishedApproved")
                                : t("kb.noLongerServed")
                            }
                          >
                            {article.title}
                          </Link>
                        );
                      })}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!can("records.diagnosis.confirm")}
                      onClick={() =>
                        toast({
                          tone: "info",
                          title: t("records.obsOpensBlank"),
                          detail: t("hint.observationNote"),
                        })
                      }
                    >
                      <Check />
                      {t("records.obsExamine")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!can("records.diagnosis.confirm")}
                      onClick={() => {
                        setDismissed((all) => [...all, s.id]);
                        toast({
                          tone: "info",
                          title: t("records.obsDismissed"),
                          detail: t("records.obsDismissBody"),
                        });
                      }}
                    >
                      <X />
                      {t("records.obsNotRelevant")}
                    </Button>
                    {!can("records.diagnosis.confirm") && (
                      <span className="text-[0.75rem] text-ink-faint">
                        {t("records.obsClinicianOnly")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
