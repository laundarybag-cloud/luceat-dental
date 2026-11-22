"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- Tooltip */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  disabled,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  disabled?: boolean;
}) {
  if (disabled) return <>{children}</>;
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          className="z-50 rounded-md bg-forest-900 px-2.5 py-1.5 text-[0.75rem] font-medium leading-4 text-forest-50 shadow-overlay data-[state=delayed-open]:animate-fade-up"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ----------------------------------------------------------------- Menu */

export const Menu = DropdownMenuPrimitive.Root;
export const MenuTrigger = DropdownMenuPrimitive.Trigger;

export function MenuContent({
  className,
  align = "end",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-52 overflow-hidden rounded-panel border border-line bg-surface p-1.5 shadow-overlay",
          "data-[state=open]:animate-fade-up",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function MenuItem({
  className,
  tone,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  tone?: "danger";
}) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-small text-ink-soft outline-none transition-colors",
        "data-[highlighted]:bg-forest-50 data-[highlighted]:text-forest-800",
        tone === "danger" &&
          "text-status-cancelled data-[highlighted]:bg-status-cancelled-bg data-[highlighted]:text-status-cancelled",
        "[&_svg]:size-4 [&_svg]:text-current [&_svg]:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export function MenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-2.5 pb-1 pt-2 text-label uppercase text-ink-faint", className)}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-line" />;
}

/* ----------------------------------------------------------------- Tabs */

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-0.5 rounded-field bg-surface-sunken p-0.5",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-[0.375rem] px-2.5 py-1 text-[0.8125rem] font-medium text-ink-muted transition-all duration-150",
        "hover:text-ink-soft",
        "data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-card",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;

/* ------------------------------------------------------------ Separator */

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        "bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  );
}

/* ------------------------------------------------------------- Skeleton */

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-surface-sunken",
        className
      )}
      {...props}
    />
  );
}

/* ----------------------------------------------------------- Empty state */

export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
  compact,
}: {
  illustration?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 py-8" : "gap-3 py-12",
        className
      )}
    >
      {illustration}
      <div className="max-w-xs">
        <p className="text-card text-ink">{title}</p>
        <p className="mt-1 text-small text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------- Progress */

export function Progress({
  value,
  className,
  tone = "brand",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "gold" | "muted";
}) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-soft)]",
          tone === "brand" && "bg-forest-500",
          tone === "gold" && "bg-gold-300",
          tone === "muted" && "bg-forest-200"
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
