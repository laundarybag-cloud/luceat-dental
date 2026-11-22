"use client";

import * as React from "react";
import Image from "next/image";
import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: { box: "size-6", text: "text-[0.625rem]", px: 24 },
  sm: { box: "size-8", text: "text-[0.6875rem]", px: 32 },
  md: { box: "size-9", text: "text-[0.75rem]", px: 36 },
  lg: { box: "size-11", text: "text-[0.8125rem]", px: 44 },
  xl: { box: "size-14", text: "text-[0.9375rem]", px: 56 },
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
  ring,
  status,
}: {
  src?: string;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Soft halo — use on the few avatars that should read as "primary". */
  ring?: boolean;
  status?: "online" | "offline";
}) {
  const [failed, setFailed] = React.useState(false);
  const s = SIZES[size];

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "relative overflow-hidden rounded-full bg-forest-100",
          s.box,
          ring && "ring-2 ring-white ring-offset-1 ring-offset-forest-100"
        )}
      >
        {src && !failed ? (
          <Image
            src={src}
            alt={name}
            width={s.px * 2}
            height={s.px * 2}
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className={cn(
              "flex size-full items-center justify-center font-semibold text-forest-700",
              s.text
            )}
            aria-hidden
          >
            {initials(name)}
          </span>
        )}
      </span>
      {status ? (
        <span
          className={cn(
            "absolute -end-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-surface",
            status === "online" ? "bg-forest-400" : "bg-ink-faint"
          )}
          aria-label={status}
        />
      ) : null}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 4,
  size = "sm",
}: {
  people: { name: string; avatar?: string }[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span
          key={p.name}
          className={cn("rounded-full ring-2 ring-surface", i > 0 && "-ms-2")}
        >
          <Avatar src={p.avatar} name={p.name} size={size} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="-ms-2 flex size-8 items-center justify-center rounded-full bg-surface-sunken text-[0.6875rem] font-semibold text-ink-soft ring-2 ring-surface">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}
