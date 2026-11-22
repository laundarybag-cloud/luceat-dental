"use client";

import * as React from "react";
import { AlertTriangle, Check, RotateCcw, ShieldAlert } from "lucide-react";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABEL,
  ROLES,
  ROLE_META,
  type Permission,
  type Role,
} from "@/lib/access";
import { staffUsers } from "@/lib/mock/users";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { useI18n } from "@/components/i18n/locale-context";

const holdersOf = (role: Role) =>
  staffUsers.filter((u) => u.role === role && u.status !== "suspended").length;

/**
 * Live permission matrix.
 *
 * Toggling a cell changes what the running app allows — the medical records
 * module reads the same matrix — so the editor warns before a change that
 * would lock the current user out of the screen they are on.
 */
export function PermissionMatrix() {
  const { t } = useI18n();
  const { matrix, setPermission, resetMatrix, matrixEdited, role: myRole } =
    useRole();
  const toast = useToast();

  const toggle = (role: Role, permission: Permission) => {
    const allowed = matrix[role].includes(permission);
    const next = !allowed;

    // Removing your own access to this very screen is the one change worth
    // interrupting: you would not be able to put it back.
    if (
      !next &&
      role === myRole &&
      permission === "records.view" &&
      myRole !== "super_admin"
    ) {
      toast({
        tone: "warning",
        title: t("users.wouldLockOut"),
        detail: t("users.signedInAsRole"),
      });
      return;
    }

    setPermission(role, permission, next);
    toast({
      tone: "success",
      title: `${t(ROLE_META[role].labelKey)} ${next ? "granted" : "no longer has"} “${PERMISSION_LABEL[permission]}”`,
      detail: `Applied to this session immediately — ${holdersOf(role)} account${
        holdersOf(role) === 1 ? "" : "s"
      } hold this role. Not persisted; a reload restores the defaults.`,
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-card text-ink">{t("users.permissionMatrix")}</h2>
            <p className="mt-0.5 max-w-xl text-[0.75rem] leading-[1.15rem] text-ink-muted">
              These toggles drive the live application. Removing a permission
              here takes effect at once — open Medical Records as that role and
              the screen changes.
            </p>
          </div>
          {matrixEdited && (
            <Button variant="secondary" size="sm" onClick={resetMatrix}>
              <RotateCcw />
              {t("users.resetToDefaults")}
            </Button>
          )}
        </div>

        {matrixEdited && (
          <p className="mt-3 flex items-start gap-2 rounded-field border border-status-pending/30 bg-status-pending-bg/60 px-3 py-2 text-[0.75rem] text-status-pending">
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            The matrix differs from the shipped defaults. Changes live in this
            browser session only and are lost on reload.
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="scrollbar-slim overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th
                  scope="col"
                  className="sticky start-0 z-10 min-w-56 bg-surface px-4 py-3 text-start text-label uppercase text-ink-muted"
                >
                  {t("users.permission")}
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    scope="col"
                    className="min-w-28 px-3 py-3 text-center"
                  >
                    <span className="block text-[0.75rem] font-semibold text-ink">
                      {t(ROLE_META[r].labelKey)}
                    </span>
                    <span className="mt-0.5 block text-[0.6875rem] tabular-nums text-ink-faint">
                      {holdersOf(r)} account{holdersOf(r) === 1 ? "" : "s"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((p) => (
                <tr key={p} className="border-b border-line last:border-b-0">
                  <th
                    scope="row"
                    className="sticky start-0 z-10 bg-surface px-4 py-2.5 text-start text-small font-medium text-ink"
                  >
                    {PERMISSION_LABEL[p]}
                  </th>
                  {ROLES.map((r) => {
                    const allowed = matrix[r].includes(p);
                    const isMine = r === myRole;
                    return (
                      <td key={r} className="px-3 py-2.5 text-center">
                        <Tooltip
                          content={`${allowed ? "Remove" : "Grant"} “${PERMISSION_LABEL[p]}” ${allowed ? "from" : "to"} ${t(ROLE_META[r].labelKey)}`}
                        >
                          <button
                            onClick={() => toggle(r, p)}
                            aria-pressed={allowed}
                            aria-label={`${PERMISSION_LABEL[p]} for ${t(ROLE_META[r].labelKey)}`}
                            className={cn(
                              "mx-auto flex size-6 items-center justify-center rounded-md border transition-colors",
                              allowed
                                ? "border-forest-600 bg-forest-600 text-white hover:bg-forest-700"
                                : "border-line-strong bg-surface text-transparent hover:border-forest-300 hover:bg-forest-50",
                              isMine && "ring-2 ring-forest-200 ring-offset-1"
                            )}
                          >
                            <Check className="size-3.5" />
                          </button>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-[0.75rem] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-forest-600 bg-forest-600" />
            {t("users.granted")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-line-strong bg-surface" />
            {t("users.notGranted")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-line-strong bg-surface ring-2 ring-forest-200" />
            {t("users.yourCurrentRole")}
          </span>
        </div>
      </Card>

      <p className="flex items-start gap-2 rounded-field border border-line bg-surface px-3 py-2 text-[0.75rem] text-ink-muted">
        <ShieldAlert className="mt-px size-3.5 shrink-0 text-forest-500" />
        <span>
          This matrix governs what the interface shows. It becomes a security
          boundary only once the backend checks the same permissions on every
          request — until then, treat it as configuration, not protection.
        </span>
      </p>
    </div>
  );
}
