/**
 * Dental chart domain model.
 *
 * Teeth use FDI two-digit notation (ISO 3950), the international standard:
 * the first digit is the quadrant (1 upper-right … 4 lower-left, clockwise
 * from the patient's perspective) and the second is the tooth, 1 at the
 * midline out to 8 at the third molar.
 */

export type ToothCondition =
  | "healthy"
  | "caries"
  | "filled"
  | "crown"
  | "root_canal"
  | "implant"
  | "missing"
  | "planned";

export interface ToothRecord {
  fdi: number;
  condition: ToothCondition;
  note?: string;
  /** ISO date the condition was last recorded. */
  updated?: string;
}

export const QUADRANTS: { id: number; label: string; teeth: number[] }[] = [
  { id: 1, label: "Upper right", teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  { id: 2, label: "Upper left", teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  { id: 4, label: "Lower right", teeth: [48, 47, 46, 45, 44, 43, 42, 41] },
  { id: 3, label: "Lower left", teeth: [31, 32, 33, 34, 35, 36, 37, 38] },
];

export const ALL_TEETH = QUADRANTS.flatMap((q) => q.teeth);

/** Anatomical name, derived from the FDI position digit. */
export function toothName(fdi: number): string {
  const pos = fdi % 10;
  const names = [
    "Central incisor",
    "Lateral incisor",
    "Canine",
    "First premolar",
    "Second premolar",
    "First molar",
    "Second molar",
    "Third molar",
  ];
  return names[pos - 1] ?? "Tooth";
}

export const CONDITION_META: Record<
  ToothCondition,
  { label: string; short: string; swatch: string; chip: string; description: string }
> = {
  healthy: {
    label: "Healthy",
    short: "Healthy",
    swatch: "bg-surface border-line-strong",
    chip: "bg-surface-sunken text-ink-soft",
    description: "No findings recorded.",
  },
  caries: {
    label: "Caries",
    short: "Caries",
    swatch: "bg-status-cancelled/80 border-status-cancelled",
    chip: "bg-status-cancelled-bg text-status-cancelled",
    description: "Active decay — treatment required.",
  },
  filled: {
    label: "Filled",
    short: "Filled",
    swatch: "bg-status-checkedin/70 border-status-checkedin",
    chip: "bg-status-checkedin-bg text-status-checkedin",
    description: "Restored with a filling.",
  },
  crown: {
    label: "Crown",
    short: "Crown",
    swatch: "bg-gold-300 border-gold-500",
    chip: "bg-gold-100 text-gold-600",
    description: "Crown or onlay in place.",
  },
  root_canal: {
    label: "Root canal",
    short: "Root canal",
    swatch: "bg-status-progress/70 border-status-progress",
    chip: "bg-status-progress-bg text-status-progress",
    description: "Endodontically treated.",
  },
  implant: {
    label: "Implant",
    short: "Implant",
    swatch: "bg-forest-500 border-forest-700",
    chip: "bg-forest-50 text-forest-700",
    description: "Titanium implant and crown.",
  },
  missing: {
    label: "Missing",
    short: "Missing",
    swatch: "bg-surface-sunken border-line-strong",
    chip: "bg-status-noshow-bg text-status-noshow",
    description: "Extracted or congenitally absent.",
  },
  planned: {
    label: "Treatment planned",
    short: "Planned",
    swatch: "bg-status-pending/70 border-status-pending",
    chip: "bg-status-pending-bg text-status-pending",
    description: "Scheduled in an active treatment plan.",
  },
};

export const CONDITION_ORDER: ToothCondition[] = [
  "healthy",
  "caries",
  "filled",
  "crown",
  "root_canal",
  "implant",
  "planned",
  "missing",
];
