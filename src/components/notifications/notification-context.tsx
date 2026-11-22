"use client";

import * as React from "react";
import { useRole } from "@/components/access/role-context";
import { getClinicAlerts, type ClinicAlert } from "@/lib/notifications";
import { useSettings } from "@/components/settings/settings-context";
import { useLocale } from "@/components/i18n/locale-context";

/**
 * Read state for the alert feed, shared by the topbar bell and the
 * notifications page so the two can never disagree about the count.
 *
 * Read state is the only thing stored here. The alerts themselves stay
 * derived: acknowledging one records that somebody has seen it, and says
 * nothing about whether the underlying condition is resolved. An invoice
 * marked read is still overdue.
 */
const Ctx = React.createContext<{
  /** Alerts the active role is allowed to see at all. */
  visible: ClinicAlert[];
  unread: ClinicAlert[];
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  /** True where the role may see the row but not its detail. */
  detailHidden: (alert: ClinicAlert) => boolean;
} | null>(null);

export function useNotifications() {
  const ctx = React.useContext(Ctx);
  if (!ctx)
    throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { can } = useRole();
  // Renaming the clinic rewrites the messages, which rewrites the alerts
  // derived from the failed ones — so this has to re-read on a settings
  // change, not just on a permission change.
  const settings = useSettings();
  // Alert sentences are composed in the active language, so the feed has to
  // be rebuilt when the language changes as well.
  const locale = useLocale();
  const [read, setRead] = React.useState<Set<string>>(new Set());

  // Filtered by the live permission matrix, so revoking `billing.view` in
  // Module 12 removes the overdue-invoice alerts from the bell immediately.
  const visible = React.useMemo(
    () =>
      getClinicAlerts(settings, locale).filter(
        (a) => !a.viewPermission || can(a.viewPermission)
      ),
    [can, settings, locale]
  );

  const value = React.useMemo(() => {
    const isRead = (id: string) => read.has(id);
    return {
      visible,
      unread: visible.filter((a) => !read.has(a.id)),
      isRead,
      markRead: (id: string) =>
        setRead((prev) => new Set(prev).add(id)),
      markUnread: (id: string) =>
        setRead((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      markAllRead: () => setRead(new Set(visible.map((a) => a.id))),
      detailHidden: (alert: ClinicAlert) =>
        !!alert.detailPermission && !can(alert.detailPermission),
    };
  }, [visible, read, can]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
