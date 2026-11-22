/**
 * Locale store.
 *
 * Same shape as the clinic settings store: a tiny external store, because
 * formatters and other non-React code need to read the active locale too,
 * and two copies of that state would drift.
 *
 * The server always renders English. The stored preference is applied in a
 * layout effect after hydration, so the markup the server produced and the
 * markup React hydrates are identical — a locale read from `localStorage`
 * during render would be a hydration mismatch on every page.
 */

export type Locale = "en" | "ar";

export const LOCALES: Locale[] = ["en", "ar"];

export const LOCALE_META: Record<
  Locale,
  {
    /** The language's name in that language — never translated. */
    nativeName: string;
    englishName: string;
    dir: "ltr" | "rtl";
    /**
     * BCP 47 tag used for every Intl formatter.
     *
     * Arabic uses `ar-EG` with the Latin numbering system. Egypt writes
     * Arabic-Indic digits (٣٢١) in prose, but this is a clinical admin panel
     * full of tabular figures, money and times: mixing numeral systems
     * across a table breaks column alignment and makes totals hard to
     * compare at a glance. Latin digits in an Arabic interface are standard
     * practice in medical and financial software in Egypt.
     */
    intlTag: string;
  }
> = {
  en: {
    nativeName: "English",
    englishName: "English",
    dir: "ltr",
    intlTag: "en-GB",
  },
  ar: {
    nativeName: "العربية",
    englishName: "Arabic",
    dir: "rtl",
    intlTag: "ar-EG-u-nu-latn",
  },
};

export const DEFAULT_LOCALE: Locale = "en";
const STORAGE_KEY = "luceat:locale";

let current: Locale = DEFAULT_LOCALE;

/**
 * False until the client has finished hydrating.
 *
 * React hydrates Suspense boundaries over several commits, so the shell can
 * be live while a page subtree is still matching itself against the HTML the
 * server sent. Anything that reads the locale outside React — the Intl
 * formatters, and the fixture records whose names resolve per language —
 * would otherwise switch to Arabic halfway through and hydrate Arabic text
 * onto English markup. Holding the switch until the next frame keeps the
 * server's markup and the first client render identical, which is the one
 * thing hydration requires.
 */
let ready = false;
const listeners = new Set<() => void>();

/** The locale everything renders with. */
export const getLocale = (): Locale => (ready ? current : DEFAULT_LOCALE);

/**
 * The remembered choice, whether or not it has been applied yet — used by
 * the language switcher so its tick is on the right row immediately.
 */
export const getSelectedLocale = () => current;

/** The server snapshot is always English; see the note at the top. */
export const getServerLocale = () => DEFAULT_LOCALE;

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setLocale(next: Locale) {
  if (current === next) return;
  current = next;
  ready = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private browsing or a blocked store: the choice still applies to this
    // session, it just will not be remembered.
  }
  applyDocumentLocale(next);
  listeners.forEach((l) => l());
}

/** Reads the remembered choice. Called once, after hydration. */
export function restoreLocale(): Locale {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  const next = LOCALES.includes(stored as Locale)
    ? (stored as Locale)
    : DEFAULT_LOCALE;
  current = next;

  // Deferred a frame so every Suspense boundary has hydrated first; see the
  // note on `ready`. The document attributes move with it, so direction and
  // text never disagree.
  requestAnimationFrame(() => {
    ready = true;
    applyDocumentLocale(next);
    listeners.forEach((l) => l());
  });

  return next;
}

/**
 * Direction and language belong on the document element, so CSS logical
 * properties, the `rtl:` variants and the Arabic font all follow from one
 * place rather than from a prop threaded through the tree.
 */
export function applyDocumentLocale(locale: Locale) {
  const el = document.documentElement;
  el.lang = locale;
  el.dir = LOCALE_META[locale].dir;
  el.dataset.locale = locale;
}
