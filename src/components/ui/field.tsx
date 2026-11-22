"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTROL =
  "h-9 w-full rounded-field border border-line bg-surface px-3 text-small text-ink shadow-card transition-colors placeholder:text-ink-faint hover:border-line-strong focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-400/25 disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-faint";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center gap-1 text-[0.75rem] font-medium text-ink-soft"
      >
        {label}
        {required && (
          <span className="text-status-cancelled" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-[0.75rem] text-status-cancelled">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.75rem] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      CONTROL,
      invalid && "border-status-cancelled/60 focus:ring-status-cancelled/20",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(CONTROL, "h-auto min-h-20 resize-y py-2 leading-5", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ------------------------------------------------------------- Select -- */

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  invalid,
  id,
  ariaLabel,
}: {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          CONTROL,
          "flex items-center justify-between gap-2 text-start",
          "data-[placeholder]:text-ink-faint",
          invalid && "border-status-cancelled/60",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-ink-faint" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-panel border border-line bg-surface shadow-overlay data-[state=open]:animate-fade-up"
        >
          <SelectPrimitive.Viewport className="scrollbar-slim p-1.5">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-small text-ink-soft outline-none",
                  "data-[highlighted]:bg-forest-50 data-[highlighted]:text-forest-800",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-45"
                )}
              >
                <span className="min-w-0 flex-1">
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  {o.hint ? (
                    <span className="block truncate text-[0.6875rem] text-ink-faint">
                      {o.hint}
                    </span>
                  ) : null}
                </span>
                <SelectPrimitive.ItemIndicator>
                  <Check className="size-3.5 text-forest-600" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
