"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/locale-context";

/**
 * Honest placeholder for modules that have not been built yet.
 * It never pretends data exists — it states where the module sits in the plan.
 */
export function ModulePlaceholder({
  module,
  title,
  summary,
  scope,
}: {
  module: string;
  title: string;
  summary: string;
  scope: string[];
}) {
  const { t } = useI18n();
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
        <div className="p-7 md:p-9">
          <Badge tone="brand">
            <Hammer className="size-3" />
            {module} · not built yet
          </Badge>
          <h1 className="mt-4 text-title text-ink">{title}</h1>
          <p className="mt-2 max-w-md text-body text-ink-muted">{summary}</p>

          <p className="mt-6 text-label uppercase text-ink-faint">
            {t("shell.plannedScope")}
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {scope.map((s) => (
              <li
                key={s}
                className="flex items-start gap-2 text-small text-ink-soft"
              >
                <span className="mt-[0.4375rem] size-1 shrink-0 rounded-full bg-forest-300" />
                {s}
              </li>
            ))}
          </ul>

          <Button variant="secondary" size="md" className="mt-7" asChild>
            <Link href="/">
              <ArrowLeft className="rtl:rotate-180" />
              {t("shell.backToOverview")}
            </Link>
          </Button>
        </div>

        <div className="relative min-h-52 border-s border-line bg-forest-900">
          <Image
            src="/images/scenes/waiting-room.jpg"
            alt="Luceat Dental clinic waiting area"
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover opacity-70"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-forest-950/70 to-transparent"
            aria-hidden
          />
        </div>
      </div>
    </Card>
  );
}
