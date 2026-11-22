"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, CornerDownLeft, SearchX } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { appointments, doctors } from "@/lib/mock/clinic";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/locale-context";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/primitives";

interface Result {
  id: string;
  label: string;
  hint: string;
  href: string;
  avatar?: string;
  icon?: React.ReactNode;
  group: string;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);

  const results = React.useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();

    const pages: Result[] = navigation
      .flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })))
      .map((i) => {
        const Icon = i.icon;
        return {
          id: `page-${i.href}`,
          label: t(i.label),
          hint: t(i.group),
          href: i.href,
          icon: <Icon className="size-4 text-ink-muted" strokeWidth={1.9} />,
          group: t("palette.group.pages"),
        };
      });

    const people: Result[] = [
      ...appointments.map((a) => ({
        id: `pt-${a.id}`,
        label: a.patient.name,
        hint: t("h.paletteePatient", { service: a.service }),
        href: "/patients",
        avatar: a.patient.avatar,
        group: t("palette.group.patients"),
      })),
      ...doctors.map((d) => ({
        id: `dr-${d.id}`,
        label: d.name,
        hint: t("h.paletteDoctor", { specialty: d.specialty }),
        href: "/doctors",
        avatar: d.avatar,
        group: t("palette.group.doctors"),
      })),
    ];

    const all = [...pages, ...people];
    if (!q) return all.slice(0, 8);
    return all
      .filter(
        (r) =>
          r.label.toLowerCase().includes(q) || r.hint.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, t]);

  React.useEffect(() => setActive(0), [query]);
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = React.useCallback(
    (r?: Result) => {
      if (!r) return;
      onOpenChange(false);
      router.push(r.href);
    },
    [onOpenChange, router]
  );

  let lastGroup = "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-forest-950/35 backdrop-blur-[3px] data-[state=open]:animate-fade-up" />
        <Dialog.Content
          className="fixed inset-x-4 top-[12vh] z-50 mx-auto max-w-xl overflow-hidden rounded-panel border border-line bg-surface shadow-overlay data-[state=open]:animate-fade-up"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              go(results[active]);
            }
          }}
        >
          <Dialog.Title className="sr-only">{t("palette.dialogTitle")}</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-4 shrink-0 text-ink-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("palette.placeholder")}
              className="h-12 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
            />
            <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[0.6875rem] text-ink-faint">
              {t("palette.escHint")}
            </kbd>
          </div>

          <div className="scrollbar-slim max-h-80 overflow-y-auto p-1.5">
            {results.length === 0 ? (
              <EmptyState
                compact
                illustration={
                  <span className="flex size-10 items-center justify-center rounded-full bg-surface-sunken">
                    <SearchX className="size-5 text-ink-faint" />
                  </span>
                }
                title={t("palette.noMatches")}
                description={t("palette.noMatchesHint", { query })}
              />
            ) : (
              results.map((r, i) => {
                const showGroup = r.group !== lastGroup;
                lastGroup = r.group;
                return (
                  <React.Fragment key={r.id}>
                    {showGroup && (
                      <p className="px-2.5 pb-1 pt-2 text-label uppercase text-ink-faint">
                        {r.group}
                      </p>
                    )}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-start transition-colors",
                        i === active ? "bg-forest-50" : "hover:bg-canvas"
                      )}
                    >
                      {r.avatar ? (
                        <Avatar src={r.avatar} name={r.label} size="xs" />
                      ) : (
                        <span className="flex size-6 items-center justify-center">
                          {r.icon}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small font-medium text-ink">
                          {r.label}
                        </span>
                        <span className="block truncate text-[0.75rem] text-ink-muted">
                          {r.hint}
                        </span>
                      </span>
                      {i === active && (
                        <CornerDownLeft className="size-3.5 text-ink-faint" />
                      )}
                    </button>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
