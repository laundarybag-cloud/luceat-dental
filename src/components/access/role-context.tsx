"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import {
  ROLE_META,
  ROLES,
  permissionsFor,
  type Permission,
  type Role,
} from "@/lib/access";
import { cn } from "@/lib/utils";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "@/components/ui/primitives";
import { useI18n } from "@/components/i18n/locale-context";

export type Matrix = Record<Role, Permission[]>;

const RoleContext = React.createContext<{
  role: Role;
  setRole: (role: Role) => void;
  can: (permission: Permission) => boolean;
  /** The live matrix. Module 12 edits this and every gate follows. */
  matrix: Matrix;
  setPermission: (role: Role, permission: Permission, allowed: boolean) => void;
  resetMatrix: () => void;
  /** True while the matrix differs from the shipped defaults. */
  matrixEdited: boolean;
} | null>(null);

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
  return ctx;
}

const defaultMatrix = (): Matrix =>
  Object.fromEntries(ROLES.map((r) => [r, [...permissionsFor(r)]])) as Matrix;

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("clinic_owner");
  const [matrix, setMatrix] = React.useState<Matrix>(defaultMatrix);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("luceat:role") as Role | null;
    if (stored && ROLES.includes(stored)) setRoleState(stored);
  }, []);

  const setRole = React.useCallback((next: Role) => {
    window.localStorage.setItem("luceat:role", next);
    setRoleState(next);
  }, []);

  const setPermission = React.useCallback(
    (target: Role, permission: Permission, allowed: boolean) => {
      setMatrix((m) => ({
        ...m,
        [target]: allowed
          ? m[target].includes(permission)
            ? m[target]
            : [...m[target], permission]
          : m[target].filter((p) => p !== permission),
      }));
    },
    []
  );

  const resetMatrix = React.useCallback(() => setMatrix(defaultMatrix()), []);

  const matrixEdited = React.useMemo(
    () =>
      ROLES.some((r) => {
        const base = permissionsFor(r);
        return (
          base.length !== matrix[r].length ||
          base.some((p) => !matrix[r].includes(p))
        );
      }),
    [matrix]
  );

  const value = React.useMemo(
    () => ({
      role,
      setRole,
      // Reads the live matrix, not the shipped constant, so editing a
      // permission in Module 12 immediately changes what every gate allows.
      can: (p: Permission) => matrix[role].includes(p),
      matrix,
      setPermission,
      resetMatrix,
      matrixEdited,
    }),
    [role, setRole, matrix, setPermission, resetMatrix, matrixEdited]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function RoleChip({ role, className }: { role: Role; className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-5",
        ROLE_META[role].chip,
        className
      )}
    >
      {t(ROLE_META[role].labelKey)}
    </span>
  );
}

/**
 * Role switcher. This exists because the app has no sign-in yet — it is a
 * demonstration control, labelled as one, not a production feature.
 */
export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const { role, setRole } = useRole();

  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-field border border-line bg-surface px-2.5 py-1.5 text-start transition-colors hover:border-line-strong",
            compact && "px-2 py-1"
          )}
          aria-label={t("hint.changeViewingRole")}
        >
          <ShieldCheck className="size-3.5 shrink-0 text-forest-500" />
          <span className="min-w-0">
            <span className="block text-[0.625rem] uppercase tracking-[0.06em] text-ink-faint">
              {t("access.viewingAs")}
            </span>
            <span className="block truncate text-[0.75rem] font-medium text-ink">
              {t(ROLE_META[role].labelKey)}
            </span>
          </span>
        </button>
      </MenuTrigger>
      <MenuContent className="w-72">
        <MenuLabel>Demonstration — no sign-in yet</MenuLabel>
        {ROLES.map((r) => (
          <MenuItem
            key={r}
            onClick={() => setRole(r)}
            className={cn(r === role && "bg-forest-50")}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-small font-medium text-ink">
                {t(ROLE_META[r].labelKey)}
              </span>
              <span className="block text-[0.6875rem] leading-4 text-ink-muted">
                {t(ROLE_META[r].descriptionKey)}
              </span>
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
