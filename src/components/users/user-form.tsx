"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  Lock,
  Save,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABEL,
  ROLES,
  ROLE_META,
  type Role,
} from "@/lib/access";
import type { StaffUser } from "@/lib/mock/users";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { useI18n } from "@/components/i18n/locale-context";
import { pickText } from "@/lib/mock/localize";
import { BRANCH_AR } from "@/lib/mock/content-ar";

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: StaffUser;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const { matrix } = useRole();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("receptionist");
  const [branch, setBranch] = React.useState("Harbour Street");
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "receptionist");
    setBranch(user?.branch ?? "Harbour Street");
    setTouched(false);
  }, [open, user]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const missing = { name: !name.trim(), email: !emailValid };
  const blocked = Object.values(missing).some(Boolean);
  const granted = matrix[role];

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    toast({
      tone: "info",
      title: user ? t("doctors.changesNotSaved") : t("users.invitationNotSent"),
      detail: t("userForm.notStored"),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={user ? `Edit ${user.name}` : t("users.inviteMember2")}
        description={
          user
            ? t("hint.roleChangesNow")
            : t("users.emailInvite")
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Save />
              {user ? t("kb.saveChanges") : "Send invitation"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("userForm.fullName")}
              required
              htmlFor="u-name"
              error={touched && missing.name ? "Enter their name." : undefined}
            >
              <Input
                id="u-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("userForm.namePlaceholder")}
                invalid={touched && missing.name}
              />
            </Field>
            <Field
              label={t("userForm.workEmail")}
              required
              htmlFor="u-email"
              hint={user ? undefined : t("hint.invitationSentHere")}
              error={
                touched && missing.email
                  ? email.trim()
                    ? t("v.notAnEmail")
                    : t("v.workEmail")
                  : undefined
              }
            >
              <Input
                id="u-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@luceatdental.com"
                invalid={touched && missing.email}
              />
            </Field>
            <Field label={t("userForm.role")} required>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as Role)}
                ariaLabel={t("userForm.role")}
                options={ROLES.map((r) => ({
                  value: r,
                  label: t(ROLE_META[r].labelKey),
                  hint: t(ROLE_META[r].descriptionKey),
                }))}
              />
            </Field>
            <Field label={t("userForm.branch")}>
              <Select
                value={branch}
                onValueChange={setBranch}
                ariaLabel={t("userForm.branch")}
                options={[
                  {
                    value: "Harbour Street",
                    label: pickText("Harbour Street", BRANCH_AR),
                  },
                  {
                    value: "Lindendal Clinic",
                    label: pickText("Lindendal Clinic", BRANCH_AR),
                  },
                  { value: "Platform", label: t("userForm.platform") },
                ]}
              />
            </Field>
          </div>

          {/* What this role can actually do — read from the live matrix. */}
          <div className="rounded-field border border-line bg-canvas p-3.5">
            <p className="flex items-center gap-2 text-small font-medium text-ink">
              <ShieldCheck className="size-4 text-forest-500" />
              {t(ROLE_META[role].labelKey)} can
            </p>
            <p className="mt-0.5 text-[0.75rem] text-ink-muted">
              {t(ROLE_META[role].descriptionKey)}
            </p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {ALL_PERMISSIONS.map((p) => {
                const allowed = granted.includes(p);
                return (
                  <li
                    key={p}
                    className="flex items-center gap-2 text-[0.75rem]"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full",
                        allowed
                          ? "bg-status-completed-bg text-status-completed"
                          : "bg-surface-sunken text-ink-faint"
                      )}
                    >
                      {allowed ? (
                        <Check className="size-2.5" />
                      ) : (
                        <Lock className="size-2.5" />
                      )}
                    </span>
                    <span className={allowed ? "text-ink-soft" : "text-ink-faint"}>
                      {PERMISSION_LABEL[p]}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 border-t border-line pt-2.5 text-[0.6875rem] text-ink-faint">
              Edit these in the Permission matrix tab. Changes there apply to
              everyone holding the role.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Confirmation for suspending or restoring an account. */
export function SuspendUserDialog({
  user,
  onOpenChange,
}: {
  user: StaffUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const suspending = user?.status !== "suspended";

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      {user && (
        <DialogContent
          title={
            suspending ? `Suspend ${user.name}?` : `Restore ${user.name}?`
          }
          description={
            suspending
              ? t("users.signedOutEverywhere")
              : t("users.regainAccess")
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant={suspending ? "danger" : "primary"}
                onClick={() => {
                  toast({
                    tone: "info",
                    title: t("common.nothingChanged"),
                    detail: t("userForm.statusServerSide"),
                  });
                  onOpenChange(false);
                }}
              >
                {suspending ? <UserRoundX /> : <Check />}
                {suspending ? "Suspend account" : "Restore account"}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-small text-ink-soft">
            {suspending ? (
              <>
                <p className="flex items-start gap-2.5 rounded-field border border-status-pending/30 bg-status-pending-bg/60 px-3 py-2.5 text-status-pending">
                  <AlertTriangle className="mt-px size-4 shrink-0" />
                  <span>
                    Their clinical entries stay in the record — notes,
                    diagnoses and chart findings are never removed when an
                    account is suspended.
                  </span>
                </p>
                {user.doctorId && (
                  <p>
                    This account belongs to a clinician. Suspending it does not
                    cancel their appointments; change their status in the
                    Doctors module to stop new bookings.
                  </p>
                )}
              </>
            ) : (
              <p>
                {user.name} will be able to sign in again with the{" "}
                {user.role.replace("_", " ")} role.
              </p>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
