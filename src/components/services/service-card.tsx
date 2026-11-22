"use client";

import Image from "next/image";
import { Clock, ImageOff, MoreHorizontal, Pencil, Trash2, UserPlus, AlertTriangle } from "lucide-react";
import type { CatalogueEntry } from "@/lib/mock/catalogue";
import { isBookable } from "@/lib/mock/catalogue";
import { doctorProfileById } from "@/lib/mock/doctors";
import { cn, formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "@/components/ui/primitives";
import { useI18n } from "@/components/i18n/locale-context";

/** Shown wherever a service has no photograph yet — never a borrowed one. */
export function NoImageTile({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[linear-gradient(135deg,var(--color-forest-50),var(--color-surface-sunken))] text-ink-faint",
        className
      )}
    >
      <ImageOff className="size-5" />
      <span className="text-[0.6875rem]">{t("services.noPhoto")}</span>
    </span>
  );
}

export function ServiceCard({
  entry,
  onEdit,
  onDelete,
  onAssign,
}: {
  entry: CatalogueEntry;
  onEdit: (e: CatalogueEntry) => void;
  onDelete: (e: CatalogueEntry) => void;
  onAssign: (e: CatalogueEntry) => void;
}) {
  const { t, fmt } = useI18n();
  const doctors = entry.doctorIds
    .map((id) => doctorProfileById(id))
    .filter(Boolean);
  const bookable = isBookable(entry);
  const reason = !entry.active
    ? t("svc.withdrawn")
    : entry.doctorIds.length === 0
      ? t("empty.noClinicianAssigned")
      : t("svc.everyClinicianUnavailable");

  return (
    <Card interactive className="flex flex-col overflow-hidden">
      <div className="relative h-36 shrink-0 bg-surface-sunken">
        {entry.image ? (
          <Image
            src={entry.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 24rem"
            className={cn(
              "object-cover transition-opacity",
              !entry.active && "opacity-45 grayscale"
            )}
          />
        ) : (
          <NoImageTile />
        )}

        <span className="absolute start-3 top-3 rounded-full bg-surface/90 px-2 py-0.5 text-[0.6875rem] font-medium text-ink-soft shadow-card backdrop-blur-sm">
          {entry.category}
        </span>

        {!entry.active && (
          <span className="absolute end-3 top-3 rounded-full bg-status-noshow-bg px-2 py-0.5 text-[0.6875rem] font-semibold text-status-noshow shadow-card">
            {t("common.inactive")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-card text-ink">{entry.name}</h3>
          <Menu>
            <MenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${entry.name}`}
                className="-me-1 -mt-1 shrink-0"
              >
                <MoreHorizontal />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onClick={() => onEdit(entry)}>
                <Pencil /> {t("services.edit")}
              </MenuItem>
              <MenuItem onClick={() => onAssign(entry)}>
                <UserPlus /> {t("services.assignClinicians")}
              </MenuItem>
              <MenuSeparator />
              <MenuItem tone="danger" onClick={() => onDelete(entry)}>
                <Trash2 /> {t("services.delete")}
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>

        <p className="mt-1.5 line-clamp-2 text-[0.75rem] leading-[1.15rem] text-ink-muted">
          {entry.description}
        </p>

        <div className="mt-3 flex items-center gap-3 text-[0.75rem] text-ink-muted">
          <span className="flex items-center gap-1.5 tabular-nums">
            <Clock className="size-3.5" />
            {t("common.minutesShort", {
              count: fmt.number(entry.durationMin),
            })}
            {entry.bufferMin > 0 && (
              <Tooltip
                content={t("svc.chairTurnaround", {
                  count: fmt.number(entry.bufferMin),
                })}
              >
                <span className="text-ink-faint">+{entry.bufferMin}</span>
              </Tooltip>
            )}
          </span>
          <span className="ms-auto text-small font-semibold tabular-nums text-ink">
            {formatMoney(entry.price)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          {doctors.length ? (
            <AvatarStack
              people={doctors.map((d) => ({ name: d!.name, avatar: d!.avatar }))}
              max={4}
              size="sm"
            />
          ) : (
            <span className="text-[0.75rem] text-ink-faint">{t("services.noClinicians")}</span>
          )}

          {bookable ? (
            <span className="text-[0.75rem] text-ink-faint">
              {t("svc.clinicianCount", { count: fmt.number(doctors.length) })}
            </span>
          ) : (
            <Tooltip content={reason}>
              <span className="flex items-center gap-1 rounded-full bg-status-pending-bg px-2 py-0.5 text-[0.6875rem] font-medium text-status-pending">
                <AlertTriangle className="size-3" />
                {t("services.notBookable")}
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </Card>
  );
}
