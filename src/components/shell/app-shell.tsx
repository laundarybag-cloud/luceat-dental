"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { LocaleProvider } from "@/components/i18n/locale-context";
import { TooltipProvider } from "@/components/ui/primitives";
import { ToastProvider } from "@/components/ui/toast";
import { RoleProvider } from "@/components/access/role-context";
import { NotificationProvider } from "@/components/notifications/notification-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Remember the collapsed preference across reloads.
  React.useEffect(() => {
    const stored = window.localStorage.getItem("luceat:sidebar-collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      window.localStorage.setItem("luceat:sidebar-collapsed", prev ? "0" : "1");
      return !prev;
    });
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <LocaleProvider>
    <TooltipProvider delayDuration={200}>
      <ToastProvider>
      <RoleProvider>
      <NotificationProvider>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "min-h-dvh transition-[padding] duration-300 ease-[var(--ease-out-soft)]",
          collapsed ? "lg:ps-[4.5rem]" : "lg:ps-[16.5rem]"
        )}
      >
        <Topbar
          onOpenMobileNav={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <main className="mx-auto w-full max-w-[96rem] px-4 pb-12 pt-6 md:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </NotificationProvider>
      </RoleProvider>
      </ToastProvider>
    </TooltipProvider>
    </LocaleProvider>
  );
}
