/**
 * Translation lookup and locale-aware formatting.
 *
 * `t()` is available outside React as well, because the scheduling helpers,
 * the notification derivations and the CSV export all produce user-visible
 * strings and must not be stuck in English when the interface is Arabic.
 */
import { en, type MessageKey } from "@/locales/en";
import { ar } from "@/locales/ar";
import { LOCALE_META, getLocale, type Locale } from "./locale";

export type { MessageKey };
export type Vars = Record<string, string | number>;

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = {
  en,
  ar,
};

/** Substitutes `{named}` placeholders. */
function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

export function translate(
  key: MessageKey,
  vars?: Vars,
  locale: Locale = getLocale()
) {
  const dict = DICTIONARIES[locale] ?? en;
  // The English string is the fallback rather than the raw key: a missing
  // translation should read as English, never as "notifications.feed.title".
  return interpolate(dict[key] ?? en[key] ?? key, vars);
}

/* -------------------------------------------------------- formatting */

const tag = (locale: Locale) => LOCALE_META[locale].intlTag;

/**
 * Every formatter is UTC-fixed, as the rest of the build already is: the
 * clinic has one timezone, and pinning it keeps server and client output
 * identical. Only the locale tag changes between languages.
 */
const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>();

function dateFormat(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = `d:${locale}:${JSON.stringify(options)}`;
  let f = cache.get(key) as Intl.DateTimeFormat | undefined;
  if (!f) {
    f = new Intl.DateTimeFormat(tag(locale), { timeZone: "UTC", ...options });
    cache.set(key, f);
  }
  return f;
}

function numberFormat(locale: Locale, options: Intl.NumberFormatOptions) {
  const key = `n:${locale}:${JSON.stringify(options)}`;
  let f = cache.get(key) as Intl.NumberFormat | undefined;
  if (!f) {
    f = new Intl.NumberFormat(tag(locale), options);
    cache.set(key, f);
  }
  return f;
}

/** "US$31,215" -> "$31,215", leaving any bidi marks in place. */
const dollars = (formatted: string) => formatted.replace(/US\$/g, "$");

const atMidnight = (isoDate: string) =>
  new Date(isoDate.length === 10 ? `${isoDate}T00:00:00.000Z` : isoDate);

export const fmt = {
  /** 20 Nov */
  dayMonth: (iso: string, locale: Locale = getLocale()) =>
    dateFormat(locale, { day: "numeric", month: "short" }).format(atMidnight(iso)),

  /** 20 November 2026 */
  longDate: (iso: string, locale: Locale = getLocale()) =>
    dateFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(atMidnight(iso)),

  /** Friday, 20 November 2026 */
  fullDate: (iso: string, locale: Locale = getLocale()) =>
    dateFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(atMidnight(iso)),

  /** Nov 26 */
  monthYear: (iso: string, locale: Locale = getLocale()) =>
    dateFormat(locale, { month: "short", year: "2-digit" }).format(
      atMidnight(iso)
    ),

  /** 14:30 — always 24-hour and Latin digits, for tabular alignment. */
  time: (iso: string, locale: Locale = getLocale()) =>
    dateFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(iso)),

  /** 20 Nov, 14:30 */
  dateTime: (iso: string, locale: Locale = getLocale()) =>
    `${fmt.dayMonth(iso, locale)}, ${fmt.time(iso, locale)}`,

  number: (value: number, locale: Locale = getLocale()) =>
    numberFormat(locale, { maximumFractionDigits: 0 }).format(value),

  decimal: (value: number, digits = 1, locale: Locale = getLocale()) =>
    numberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value),

  percent: (value: number, digits = 0, locale: Locale = getLocale()) =>
    numberFormat(locale, {
      style: "percent",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value / 100),

  /**
   * Both en-GB and ar-EG render USD as "US$" even with `narrowSymbol`,
   * which reads as a foreign-exchange rate rather than a price. The clinic
   * prices in dollars, so the symbol is normalised to "$" while grouping,
   * decimals and digit direction stay locale-correct.
   */
  money: (value: number, locale: Locale = getLocale()) =>
    dollars(
      numberFormat(locale, {
        style: "currency",
        currency: "USD",
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
      }).format(value)
    ),

  moneyPrecise: (value: number, locale: Locale = getLocale()) =>
    dollars(
      numberFormat(locale, {
        style: "currency",
        currency: "USD",
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    ),

  /** $31.2k — compact, for chart axes where space is tight. */
  compactMoney: (value: number, locale: Locale = getLocale()) =>
    dollars(
      numberFormat(locale, {
        style: "currency",
        currency: "USD",
        currencyDisplay: "narrowSymbol",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    ),
};
