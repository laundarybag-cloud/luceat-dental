"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Menu as MenuIcon,
  ChevronRight,
  CalendarPlus,
  UserPlus,
  FileText,
  LifeBuoy,
  Command,
} from "lucide-react";
import { findNavItem } from "@/lib/navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useSettings } from "@/components/settings/settings-context";
import { useI18n } from "@/components/i18n/locale-context";
import { TODAY } from "@/lib/mock/schedule";
import { roleKey } from "@/lib/i18n/domain";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { Avatar } from "@/components/ui/avatar";
import { useRole } from "@/components/access/role-context";


export function Topbar({
  onOpenMobileNav,
  onOpenSearch,
}: {
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
}) {
  const pathname = usePathname();
  const { role } = useRole();
  const { name: clinicName } = useSettings();
  const { t, fmt } = useI18n();

  const current = findNavItem(pathname);
  const isRoot = pathname === "/";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl md:px-6">
      <button
        onClick={onOpenMobileNav}
        className="-ms-1 rounded-field p-2 text-ink-soft transition-colors hover:bg-surface-sunken lg:hidden"
        aria-label={t("shell.openNavigation")}
      >
        <MenuIcon className="size-5" />
      </button>

      {/* Breadcrumb */}
      <nav aria-label={t("shell.breadcrumb")} className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-small">
          <li>
            <Link
              href="/"
              className="truncate text-ink-muted transition-colors hover:text-forest-700"
            >
              {/* The breadcrumb root is the clinic, so it follows the name
                  in settings rather than staying on the shipped brand. */}
              {clinicName.split(/\s+/)[0]}
            </Link>
          </li>
          {!isRoot && current && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-ink-faint rtl:rotate-180" />
              <li className="truncate font-medium text-ink">{t(current.label)}</li>
            </>
          )}
          {isRoot && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-ink-faint rtl:rotate-180" />
              <li className="truncate font-medium text-ink">{t("nav.overview")}</li>
            </>
          )}
        </ol>
      </nav>

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className={cn(
          "group hidden h-9 w-72 items-center gap-2.5 rounded-field border border-line bg-surface px-3 text-start text-small text-ink-faint shadow-card",
          "transition-colors hover:border-line-strong hover:text-ink-muted md:flex xl:w-80"
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">{t("topbar.searchPlaceholder")}</span>
        <kbd className="flex items-center gap-0.5 rounded border border-line bg-canvas px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-faint">
          <Command className="size-2.5" />K
        </kbd>
      </button>

      <Tooltip content={t("common.search")}>
        <button
          onClick={onOpenSearch}
          className="rounded-field p-2 text-ink-soft transition-colors hover:bg-surface-sunken md:hidden"
          aria-label={t("common.search")}
        >
          <Search className="size-5" />
        </button>
      </Tooltip>

      {/* Derived and locale-formatted — it was a hardcoded English date. */}
      <span className="hidden text-small text-ink-muted xl:block">
        {fmt.fullDate(TODAY)}
      </span>

      <div className="hidden h-5 w-px bg-line xl:block" />

      {/* Quick actions */}
      <Menu>
        <MenuTrigger asChild>
          <Button variant="primary" size="md" className="hidden sm:inline-flex">
            <Plus />
            {t("topbar.new")}
          </Button>
        </MenuTrigger>
        <MenuContent className="w-56">
          <MenuLabel>{t("topbar.new")}</MenuLabel>
          <MenuItem>
            <CalendarPlus /> {t("topbar.newAppointment")}
          </MenuItem>
          <MenuItem>
            <UserPlus /> {t("topbar.newPatient")}
          </MenuItem>
          <MenuItem>
            <FileText /> {t("topbar.newArticle")}
          </MenuItem>
        </MenuContent>
      </Menu>

      <LanguageSwitcher compact />
      <NotificationBell />

      <Tooltip content={t("topbar.helpCenter")}>
        <button
          className="hidden rounded-field p-2 text-ink-soft transition-colors hover:bg-surface-sunken sm:block"
          aria-label={t("topbar.helpCenter")}
        >
          <LifeBuoy className="size-[1.125rem]" />
        </button>
      </Tooltip>

      <Menu>
        <MenuTrigger asChild>
          <button
            className="ms-0.5 rounded-full transition-opacity hover:opacity-85"
            aria-label={t("shell.accountLabel")}
          >
            <Avatar
              src="/images/doctor-avatar.jpg"
              name={t("doctor.owner.full")}
              size="md"
            />
          </button>
        </MenuTrigger>
        <MenuContent className="w-60">
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar
              src="/images/doctor-avatar.jpg"
              name={t("doctor.owner.full")}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate text-small font-medium text-ink">
                {t("doctor.owner.full")}
              </p>
              <p className="truncate text-[0.75rem] text-ink-muted">
                {t(roleKey(role))}
              </p>
            </div>
          </div>
          <MenuSeparator />
          <MenuItem>
            <LifeBuoy /> {t("topbar.help")}
          </MenuItem>
        </MenuContent>
      </Menu>
    </header>
  );
}
