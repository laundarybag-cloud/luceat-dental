/**
 * Arabic for the fixture *content* — service names, clinical specialties,
 * knowledge article titles and the like.
 *
 * This is deliberately separate from `src/locales`. Those files hold
 * interface copy, which the application owns and ships. What lives here is
 * data: in a connected build it comes back from the API already in the
 * caller's language, because that is where a clinic's own catalogue is
 * edited. Keeping the two apart means the boundary stays honest, and the
 * locale files do not slowly fill up with a particular clinic's price list.
 *
 * The values are attached as getters rather than copied into new fields, so
 * `service.name` keeps working everywhere it is already read — around a
 * hundred call sites — and resolves against the active locale at read time,
 * exactly as the date and currency formatters do. A component re-renders on
 * a language change because it subscribes to the locale store, and the
 * getter is evaluated again as it renders.
 *
 * THE ONE RULE: spreading a record (`{ ...service }`) reads its getters and
 * copies the values they return, so the copy is frozen in whichever
 * language was active at that moment. That is fine for a value used and
 * discarded in the same breath, and wrong for anything kept — a record put
 * into component state, or a derived list built once at module load. Build
 * the copy first and attach the getters last, or re-apply them afterwards
 * (`relocalizePlan` does this for a cloned treatment plan).
 *
 * Both of the derived collections in this build hit that rule and are
 * written accordingly: the catalogue merges its detail onto a service and
 * then re-attaches, and the treatment plans rebuild their steps before the
 * plan title is attached.
 */
import { getLocale } from "../i18n/locale";

/** Arabic strings keyed by record id, then by field. */
export type ArabicFields<T> = Record<string, Partial<Record<keyof T, string>>>;

/**
 * Returns the list with the named fields resolved per locale.
 *
 * A record with no Arabic entry keeps its English text, which is the right
 * fallback: a clinic that has not translated a service should still see it.
 */
export function withArabic<T extends { id: string }>(
  rows: T[],
  arabic: ArabicFields<T>
): T[] {
  return rows.map((row) => {
    const overrides = arabic[row.id];
    if (!overrides) return row;

    const copy = { ...row } as T;
    for (const [field, value] of Object.entries(overrides)) {
      if (value == null) continue;
      const english = row[field as keyof T];
      Object.defineProperty(copy, field, {
        get: () => (getLocale() === "ar" ? value : english),
        enumerable: true,
        configurable: true,
      });
    }
    return copy;
  });
}

/**
 * The same, for a value that is not part of a keyed list — a category name
 * on its own, say.
 */
export function pickText(english: string, arabic: Record<string, string>) {
  return getLocale() === "ar" ? (arabic[english] ?? english) : english;
}
