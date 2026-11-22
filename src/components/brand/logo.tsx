import { cn } from "@/lib/utils";

/**
 * Luceat mark — a tooth silhouette cut by a light ray ("luceat" = let it shine).
 * Drawn rather than imported so it inherits currentColor and stays crisp.
 */
export function LuceatMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-forest-800" />
      <path
        d="M16 7.4c-1.9 0-2.7.8-4.3.8-1.9 0-3.5 1.5-3.5 3.9 0 2.2.6 3.6 1.2 5.6.5 1.7.6 3.3.9 4.6.3 1.3.9 2.1 1.8 2.1 1.1 0 1.4-1.1 1.7-2.7.3-1.5.6-2.9 2.2-2.9s1.9 1.4 2.2 2.9c.3 1.6.6 2.7 1.7 2.7.9 0 1.5-.8 1.8-2.1.3-1.3.4-2.9.9-4.6.6-2 1.2-3.4 1.2-5.6 0-2.4-1.6-3.9-3.5-3.9-1.6 0-2.4-.8-4.3-.8Z"
        className="fill-forest-100"
      />
      <path
        d="M21.6 9.1 24.9 5"
        className="stroke-gold-300"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="26.4" cy="4.2" r="1.5" className="fill-gold-300" />
    </svg>
  );
}

export function LuceatWordmark({
  className,
  tone = "light",
  name,
}: {
  className?: string;
  tone?: "light" | "dark";
  /** The clinic name from settings. Falls back to the shipped brand. */
  name?: string;
}) {
  // The first word carries the weight and the rest is muted, so an edited
  // clinic name keeps the lockup's shape instead of flattening to one colour.
  const full = (name ?? "Luceat Dental").trim();
  const [first, ...rest] = full.split(/\s+/);

  return (
    <span className={cn("flex min-w-0 flex-col leading-none", className)}>
      <span
        className={cn(
          "truncate text-[0.9375rem] font-semibold tracking-[-0.015em]",
          tone === "light" ? "text-white" : "text-ink"
        )}
        title={full}
      >
        {first}
        {rest.length > 0 && (
          <span
            className={tone === "light" ? "text-forest-200" : "text-ink-muted"}
          >
            {" "}
            {rest.join(" ")}
          </span>
        )}
      </span>
      <span
        className={cn(
          "mt-1 text-[0.625rem] font-medium uppercase tracking-[0.14em]",
          tone === "light" ? "text-forest-300" : "text-ink-faint"
        )}
      >
        Clinic Suite
      </span>
    </span>
  );
}
