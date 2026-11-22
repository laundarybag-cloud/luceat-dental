"use client";

import * as React from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  getLocale,
  getServerLocale,
  restoreLocale,
  setLocale,
  subscribeLocale,
  type Locale,
} from "@/lib/i18n/locale";
import { fmt, translate, type MessageKey, type Vars } from "@/lib/i18n";

/**
 * Subscribes a component to the active locale.
 *
 * `useSyncExternalStore` rather than React context, because the scheduling
 * helpers and the notification derivations read the same locale from outside
 * the component tree, and two copies of that state would be exactly the kind
 * of drift this build avoids. The server snapshot is always English, and the
 * remembered choice is applied in an effect in `LocaleProvider`, so the first
 * client render matches the markup the server produced.
 */
export function useLocale(): Locale {
  return React.useSyncExternalStore(
    subscribeLocale,
    getLocale,
    getServerLocale
  );
}

export interface Translator {
  (key: MessageKey, vars?: Vars): string;
}

/**
 * The hook every component uses:
 *
 *   const { t, locale, dir, fmt } = useI18n();
 */
export function useI18n() {
  const locale = useLocale();

  return React.useMemo(() => {
    const t: Translator = (key, vars) => translate(key, vars, locale);
    return {
      t,
      locale,
      dir: LOCALE_META[locale].dir,
      isRtl: LOCALE_META[locale].dir === "rtl",
      /** Formatters already bound to the active locale. */
      fmt: {
        dayMonth: (iso: string) => fmt.dayMonth(iso, locale),
        longDate: (iso: string) => fmt.longDate(iso, locale),
        fullDate: (iso: string) => fmt.fullDate(iso, locale),
        monthYear: (iso: string) => fmt.monthYear(iso, locale),
        time: (iso: string) => fmt.time(iso, locale),
        dateTime: (iso: string) => fmt.dateTime(iso, locale),
        number: (v: number) => fmt.number(v, locale),
        decimal: (v: number, d?: number) => fmt.decimal(v, d, locale),
        percent: (v: number, d?: number) => fmt.percent(v, d, locale),
        money: (v: number) => fmt.money(v, locale),
        moneyPrecise: (v: number) => fmt.moneyPrecise(v, locale),
        compactMoney: (v: number) => fmt.compactMoney(v, locale),
      },
      setLocale,
    };
  }, [locale]);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // `useLayoutEffect` rather than `useEffect`: the remembered locale is
  // applied after hydration but before the browser paints, so an Arabic user
  // does not see a frame of left-to-right English.
  React.useLayoutEffect(() => {
    restoreLocale();
  }, []);

  return <>{children}</>;
}

export { DEFAULT_LOCALE, LOCALE_META, type Locale };
