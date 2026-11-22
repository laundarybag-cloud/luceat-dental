"use client";

import { Lock, ShieldAlert } from "lucide-react";
import { ROLE_META, type Permission } from "@/lib/access";
import { useRole, RoleSwitcher } from "@/components/access/role-context";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/locale-context";

/**
 * Blocks a clinical surface for roles without the permission, and says what
 * is missing rather than pretending the page is empty.
 */
export function AccessGate({
  permission,
  what,
  children,
}: {
  permission: Permission;
  what: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const { role, can } = useRole();
  if (can(permission)) return <>{children}</>;

  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-pending-bg">
        <Lock className="size-5 text-status-pending" />
      </span>
      <h2 className="mt-4 text-section text-ink">
        {t("records.restrictedTitle", { what })}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-small text-ink-muted">
        {t("records.restrictedBody", {
          role: t(ROLE_META[role].labelKey),
          description: t(ROLE_META[role].descriptionKey),
        })}
      </p>
      <p className="mx-auto mt-4 max-w-sm text-[0.75rem] text-ink-faint">
        Ask a clinic owner to change your role, or switch role below — this
        build has no sign-in yet, so the switcher stands in for one.
      </p>
      <div className="mt-4 flex justify-center">
        <RoleSwitcher />
      </div>
    </Card>
  );
}

/** Banner stating plainly what this boundary does and does not protect. */
export function EnforcementNotice() {
  const { t } = useI18n();
  return (
    <p className="flex items-start gap-2 rounded-field border border-line bg-surface px-3 py-2 text-[0.75rem] text-ink-muted">
      <ShieldAlert className="mt-px size-3.5 shrink-0 text-forest-500" />
      <span>
        {t("access.notSecurityBoundary")}
      </span>
    </p>
  );
}
