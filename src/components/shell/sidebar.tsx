"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  UserCog,
  LifeBuoy,
  X,
} from "lucide-react";
import { navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { LuceatMark, LuceatWordmark } from "@/components/brand/logo";
import { useSettings } from "@/components/settings/settings-context";
import { useI18n } from "@/components/i18n/locale-context";
import { roleKey } from "@/lib/i18n/domain";
import { Avatar } from "@/components/ui/avatar";
import { useRole } from "@/components/access/role-context";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "@/components/ui/primitives";

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { role } = useRole();
  const { name: clinicName } = useSettings();
  const { t } = useI18n();

  return (
    <>
      {/* Scrim — mobile only */}
      <div
        onClick={onCloseMobile}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-forest-950/40 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex flex-col bg-forest-900 text-forest-100",
          "transition-[width,transform] duration-300 ease-[var(--ease-out-soft)]",
          collapsed ? "w-[4.5rem]" : "w-[16.5rem]",
          // Off-canvas below lg only. The `rtl:` variant outranks a `lg:`
          // media query, so the hidden state must itself be max-lg-scoped.
          mobileOpen
            ? "translate-x-0"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.07]",
            collapsed ? "justify-center px-0" : "px-5"
          )}
        >
          <LuceatMark className="size-9 shrink-0" />
          {!collapsed && <LuceatWordmark className="flex-1" name={clinicName} />}
          <button
            onClick={onCloseMobile}
            className="-me-1 rounded-md p-1.5 text-forest-300 transition-colors hover:bg-white/[0.07] hover:text-white lg:hidden"
            aria-label={t("shell.closeNavigation")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-dark flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((group, gi) => (
            <div key={group.label} className={cn(gi > 0 && "mt-5")}>
              {!collapsed ? (
                <p className="px-2.5 pb-1.5 text-label uppercase text-forest-400/90">
                  {t(group.label)}
                </p>
              ) : gi > 0 ? (
                <div className="mx-auto mb-3 h-px w-8 bg-white/[0.07]" />
              ) : null}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Tooltip
                        content={t(item.label)}
                        side="right"
                        disabled={!collapsed}
                      >
                        <Link
                          href={item.href}
                          onClick={onCloseMobile}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative flex items-center rounded-field text-[0.8125rem] font-medium transition-colors duration-150",
                            collapsed
                              ? "h-10 justify-center"
                              : "h-9 gap-3 px-2.5",
                            active
                              ? "bg-white/[0.09] text-white"
                              : "text-forest-200/85 hover:bg-white/[0.05] hover:text-white"
                          )}
                        >
                          {active && (
                            <span className="absolute inset-y-1.5 -start-3 w-[3px] rounded-e-full bg-gold-300" />
                          )}
                          <Icon
                            className={cn(
                              "size-[1.125rem] shrink-0 transition-colors",
                              active
                                ? "text-gold-300"
                                : "text-forest-300 group-hover:text-forest-100"
                            )}
                            strokeWidth={1.9}
                          />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{t(item.label)}</span>
                              {item.badge && (
                                <span
                                  className={cn(
                                    "rounded-full px-1.5 py-px text-[0.6875rem] font-semibold tabular-nums",
                                    active
                                      ? "bg-gold-300 text-forest-900"
                                      : "bg-white/10 text-forest-100"
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                          {collapsed && item.badge && (
                            <span className="absolute end-2.5 top-2 size-1.5 rounded-full bg-gold-300" />
                          )}
                        </Link>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse control */}
        <div className="hidden px-3 pb-2 lg:block">
          <button
            onClick={onToggleCollapsed}
            className={cn(
              "flex h-8 w-full items-center gap-2.5 rounded-field px-2.5 text-[0.75rem] font-medium text-forest-300 transition-colors hover:bg-white/[0.05] hover:text-forest-100",
              collapsed && "justify-center px-0"
            )}
            aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          >
            {collapsed ? (
              <ChevronsRight className="size-4 rtl:rotate-180" />
            ) : (
              <>
                <ChevronsLeft className="size-4 rtl:rotate-180" />
                {t("nav.collapse")}
              </>
            )}
          </button>
        </div>

        {/* Account */}
        <div className="border-t border-white/[0.07] p-3">
          <Menu>
            <MenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center rounded-field p-1.5 text-start transition-colors hover:bg-white/[0.06] data-[state=open]:bg-white/[0.08]",
                  collapsed ? "justify-center" : "gap-2.5"
                )}
                aria-label={t("shell.accountMenu")}
              >
                <Avatar
                  src="/images/doctor-avatar.jpg"
                  name={t("doctor.owner.full")}
                  size="sm"
                />
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-white">
                        {t("doctor.owner.full")}
                      </span>
                      <span className="block truncate text-[0.6875rem] text-forest-300">
                        {t(roleKey(role))}
                      </span>
                    </span>
                    <ChevronsRight className="size-3.5 -rotate-90 text-forest-400" />
                  </>
                )}
              </button>
            </MenuTrigger>
            <MenuContent align="start" side="top" className="w-56">
              <MenuItem>
                <UserCog /> {t("shell.accountSettings")}
              </MenuItem>
              <MenuItem>
                <LifeBuoy /> {t("shell.helpSupport")}
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger">
                <LogOut /> {t("shell.signOut")}
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </aside>
    </>
  );
}
