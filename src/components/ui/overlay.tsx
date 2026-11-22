"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/* =========================================================== Dialog ===== */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Scrim() {
  return (
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-forest-950/35 backdrop-blur-[3px] data-[state=open]:animate-fade-up" />
  );
}

export function DialogContent({
  className,
  title,
  description,
  footer,
  children,
  size = "md",
}: {
  className?: string;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <DialogPrimitive.Portal>
      <Scrim />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-4 top-[8vh] z-50 mx-auto flex max-h-[84vh] flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-overlay",
          "data-[state=open]:animate-fade-up",
          size === "md" ? "max-w-lg" : "max-w-2xl",
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-section text-ink">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-small text-ink-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X />
            </Button>
          </DialogPrimitive.Close>
        </header>

        <div className="scrollbar-slim flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer ? (
          <footer className="flex items-center justify-end gap-2.5 border-t border-line bg-canvas px-5 py-3.5">
            {footer}
          </footer>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* ============================================================ Drawer ==== */

export const Drawer = DialogPrimitive.Root;

/**
 * Side sheet. Slides from the inline end, so it comes from the right in LTR
 * and the left in RTL without any extra work.
 */
export function DrawerContent({
  className,
  title,
  description,
  footer,
  children,
}: {
  className?: string;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <Scrim />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-line bg-surface shadow-overlay",
          "duration-300 ease-[var(--ease-out-soft)]",
          "data-[state=open]:animate-[drawer-in_0.3s_var(--ease-out-soft)_both]",
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-section text-ink">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-small text-ink-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close">
              <X />
            </Button>
          </DialogPrimitive.Close>
        </header>

        <div className="scrollbar-slim flex-1 overflow-y-auto">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center gap-2.5 border-t border-line bg-canvas px-5 py-3.5">
            {footer}
          </footer>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
