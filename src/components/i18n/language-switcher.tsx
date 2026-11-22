"use client";

import * as React from "react";
import { Check, Languages } from "lucide-react";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { useI18n } from "./locale-context";

/**
 * Each language is listed in its own script — «العربية», never "Arabic" —
 * because someone who cannot read the current interface language still has
 * to be able to find their own.
 */
export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { t, locale, setLocale } = useI18n();

  const trigger = compact ? (
    <button
      className="relative rounded-field p-2 text-ink-soft transition-colors hover:bg-surface-sunken"
      aria-label={t("topbar.language")}
    >
      <Languages className="size-[1.125rem]" />
    </button>
  ) : (
    <button
      className="inline-flex items-center gap-1.5 rounded-field px-2.5 py-1.5 text-[0.75rem] font-medium text-ink-soft transition-colors hover:bg-surface-sunken"
      aria-label={t("topbar.language")}
    >
      <Languages className="size-4" />
      <span>{LOCALE_META[locale].nativeName}</span>
    </button>
  );

  return (
    <Menu>
      <Tooltip content={t("topbar.language")}>
        <MenuTrigger asChild>{trigger}</MenuTrigger>
      </Tooltip>
      <MenuContent align="end" className="w-52">
        <MenuLabel>{t("topbar.language")}</MenuLabel>
        {LOCALES.map((option: Locale) => {
          const active = option === locale;
          return (
            <MenuItem key={option} onSelect={() => setLocale(option)}>
              {/* A hidden-but-present tick keeps both rows the same width;
                  `invisible` beats `opacity-0` here because the menu item's
                  own `[&_svg]` rules were still painting the faded icon. */}
              <Check className={cn("size-4", !active && "invisible")} />
              <span
                lang={option}
                dir={LOCALE_META[option].dir}
                className={cn("flex-1", option === "ar" && "font-arabic")}
              >
                {LOCALE_META[option].nativeName}
              </span>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
