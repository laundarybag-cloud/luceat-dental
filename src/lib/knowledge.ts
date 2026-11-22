/**
 * Knowledge workflow.
 *
 * The rule the brief is explicit about — only approved content reaches the
 * patient-facing assistant — lives here as `assistantCanUse()`, and every
 * surface reads it rather than reimplementing "is this published?".
 *
 * Clinical categories carry a second condition: a clinician must have signed
 * the article off. An administrator publishing dental advice nobody clinical
 * has read is exactly the failure this gate exists to prevent.
 */

export type ArticleStatus = "draft" | "in_review" | "published" | "archived";

export type KnowledgeCategory =
  | "Frequently Asked Questions"
  | "Dental Services"
  | "Dental Conditions"
  | "Treatment Instructions"
  | "Post-Operative Instructions"
  | "Appointment Policies"
  | "Pricing Information"
  | "Clinic Information"
  | "Emergency Guidelines";

export const CATEGORIES: {
  name: KnowledgeCategory;
  blurb: string;
  /** Content a patient could act on medically needs clinician sign-off. */
  clinical: boolean;
}[] = [
  {
    name: "Frequently Asked Questions",
    blurb: "Everyday questions the front desk answers most often.",
    clinical: false,
  },
  {
    name: "Dental Services",
    blurb: "What each treatment involves and who provides it.",
    clinical: true,
  },
  {
    name: "Dental Conditions",
    blurb: "Explaining conditions in plain language.",
    clinical: true,
  },
  {
    name: "Treatment Instructions",
    blurb: "What to do before and during a course of treatment.",
    clinical: true,
  },
  {
    name: "Post-Operative Instructions",
    blurb: "Aftercare following a procedure.",
    clinical: true,
  },
  {
    name: "Appointment Policies",
    blurb: "Booking, cancellation and late arrival.",
    clinical: false,
  },
  {
    name: "Pricing Information",
    blurb: "Fees, estimates and insurance.",
    clinical: false,
  },
  {
    name: "Clinic Information",
    blurb: "Hours, locations, parking and accessibility.",
    clinical: false,
  },
  {
    name: "Emergency Guidelines",
    blurb: "What to do out of hours and when to seek urgent care.",
    clinical: true,
  },
];

export const isClinicalCategory = (category: KnowledgeCategory) =>
  CATEGORIES.find((c) => c.name === category)?.clinical ?? false;

export const ARTICLE_STATUS_META: Record<
  ArticleStatus,
  { label: string; chip: string; hint: string }
> = {
  draft: {
    label: "Draft",
    chip: "bg-surface-sunken text-ink-soft",
    hint: "Being written. Not visible to the assistant.",
  },
  in_review: {
    label: "In review",
    chip: "bg-status-pending-bg text-status-pending",
    hint: "Waiting for a clinician to approve the content.",
  },
  published: {
    label: "Published",
    chip: "bg-status-completed-bg text-status-completed",
    hint: "Live. The assistant may answer from this.",
  },
  archived: {
    label: "Archived",
    chip: "bg-status-noshow-bg text-status-noshow",
    hint: "Withdrawn. Kept for the record, never served.",
  },
};

export interface ArticleLike {
  status: ArticleStatus;
  category: KnowledgeCategory;
  reviewerId?: string;
  reviewedOn?: string;
}

/**
 * The gate. An article reaches the patient-facing assistant only if it is
 * published, and — for clinical categories — only if a clinician signed it off.
 */
export function assistantCanUse(article: ArticleLike): boolean {
  if (article.status !== "published") return false;
  if (isClinicalCategory(article.category) && !article.reviewerId) return false;
  return true;
}

/** Why an article is not being served, in words a user can act on. */
export function withheldReason(article: ArticleLike): string | null {
  if (assistantCanUse(article)) return null;
  if (article.status === "draft") return "Draft — not submitted for review.";
  if (article.status === "in_review") return "Waiting for clinical approval.";
  if (article.status === "archived") return "Archived — withdrawn from the assistant.";
  return "Published without clinical sign-off, so it is withheld.";
}

export type WorkflowAction = "submit" | "approve" | "publish" | "archive" | "restore";

export interface ActionAvailability {
  action: WorkflowAction;
  label: string;
  /** Null when allowed; otherwise why it is blocked. */
  blockedBecause: string | null;
}

/**
 * Which transitions are offered from a given state, and why one is refused.
 * `canApproveClinical` comes from the permission matrix in Module 12.
 */
export function actionsFor(
  article: ArticleLike,
  canApproveClinical: boolean
): ActionAvailability[] {
  const clinical = isClinicalCategory(article.category);

  switch (article.status) {
    case "draft":
      return [
        { action: "submit", label: "Submit for review", blockedBecause: null },
        {
          action: "publish",
          label: "Publish",
          blockedBecause: clinical
            ? "Clinical content must be reviewed by a clinician first."
            : null,
        },
      ];
    case "in_review":
      return [
        {
          action: "approve",
          label: "Approve and publish",
          blockedBecause:
            clinical && !canApproveClinical
              ? "Only a clinician can approve clinical content."
              : null,
        },
        { action: "archive", label: "Archive", blockedBecause: null },
      ];
    case "published":
      return [
        // A clinical article published without sign-off is withheld. Offer
        // the fix here, or the only article that needs attention is the one
        // thing the workflow cannot act on.
        ...(clinical && !article.reviewerId
          ? [
              {
                action: "approve" as const,
                label: "Approve content",
                blockedBecause: canApproveClinical
                  ? null
                  : "Only a clinician can approve clinical content.",
              },
            ]
          : []),
        { action: "archive", label: "Archive", blockedBecause: null },
      ];
    case "archived":
      return [{ action: "restore", label: "Restore as draft", blockedBecause: null }];
  }
}
