"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, Lock } from "lucide-react";
import { SEVERITY_META } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  Menu,
  MenuContent,
  MenuTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { useNotifications } from "./notification-context";
import { useI18n } from "@/components/i18n/locale-context";
import { alertKindKey, permissionKey } from "@/lib/i18n/domain";


/**
 * The bell reads the same provider the notifications page does, so the count
 * on the badge is the count on the page — and both follow the active role,
 * because an alert the role may not see must not be counted either.
 */
export function NotificationBell() {
  const { unread, visible, markRead, markAllRead, detailHidden } =
    useNotifications();
  const { t, fmt } = useI18n();
  const top = unread.slice(0, 4);

  return (
    <Menu>
      <Tooltip content="Notifications">
        <MenuTrigger asChild>
          <button
            className="relative rounded-field p-2 text-ink-soft transition-colors hover:bg-surface-sunken"
            aria-label={
              unread.length
                ? t("topbar.notificationsUnread", {
                    count: fmt.number(unread.length),
                  })
                : t("topbar.notificationsNone")
            }
          >
            <Bell className="size-[1.125rem]" />
            {unread.length > 0 && (
              <span
                className={cn(
                  "absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1",
                  "text-[0.625rem] font-semibold leading-4 text-white ring-2 ring-canvas",
                  unread.some((a) => a.severity === "critical")
                    ? "bg-status-cancelled"
                    : "bg-forest-600"
                )}
              >
                {unread.length > 9 ? "9+" : unread.length}
              </span>
            )}
          </button>
        </MenuTrigger>
      </Tooltip>

      <MenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
          <p className="text-small font-semibold text-ink">
            {t("notifications.bell.title")}
          </p>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 rounded-field px-1.5 py-0.5 text-[0.75rem] font-medium text-forest-700 transition-colors hover:bg-forest-50"
            >
              <CheckCheck className="size-3" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        {top.length ? (
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {top.map((a) => {
              const hidden = detailHidden(a);
              return (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    onClick={() => markRead(a.id)}
                    className="flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface-sunken"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        SEVERITY_META[a.severity].dot
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-small font-medium text-ink">
                        {a.title}
                      </span>
                      {hidden ? (
                        <span className="mt-0.5 flex items-center gap-1 text-[0.75rem] italic text-ink-faint">
                          <Lock className="size-3 shrink-0" />
                          {t("notifications.detailHidden", {
                            permission: t(permissionKey(a.detailPermission!)),
                          })}
                        </span>
                      ) : (
                        <span className="mt-0.5 line-clamp-2 block text-[0.75rem] leading-5 text-ink-muted">
                          {a.detail}
                        </span>
                      )}
                      <span className="mt-1 block text-[0.6875rem] text-ink-faint">
                        {t(alertKindKey(a.kind))} · {fmt.dayMonth(a.at)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-small text-ink-muted">
            {visible.length
              ? t("notifications.bell.allSeen")
              : t("notifications.bell.nothing")}
          </p>
        )}

        <Link
          href="/notifications"
          className="block border-t border-line px-3 py-2.5 text-center text-[0.75rem] font-medium text-forest-700 transition-colors hover:bg-surface-sunken"
        >
          {unread.length > top.length
            ? t("notifications.bell.seeAll", {
                count: fmt.number(visible.length),
              })
            : t("notifications.bell.openCentre")}
        </Link>
      </MenuContent>
    </Menu>
  );
}
