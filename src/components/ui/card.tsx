import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface shadow-card",
        interactive &&
          "transition-[box-shadow,border-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-px hover:border-line-strong hover:shadow-raised",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 pt-4 pb-3",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  children,
  hint,
}: {
  className?: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h3 className={cn("text-section text-ink", className)}>{children}</h3>
      {hint ? (
        <p className="mt-0.5 text-small text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-line px-5 py-3",
        className
      )}
      {...props}
    />
  );
}

/** Small uppercase eyebrow used above metrics and in table groupings. */
export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-label uppercase text-ink-muted", className)}
      {...props}
    />
  );
}
