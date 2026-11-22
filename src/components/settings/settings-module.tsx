"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  CircleAlert,
  Clock,
  Globe,
  Info,
  Languages,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  dayNames,
  DEFAULT_SETTINGS,
  SLOT_OPTIONS,
  describeHours,
  formatHour,
  resetSettings,
  setDayHours,
  settingsEdited,
  updateSettings,
  type DayHours,
} from "@/lib/settings";
import { PERMISSION_LABEL, permissionsFor } from "@/lib/access";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useRole } from "@/components/access/role-context";
import { useSettings } from "./settings-context";
import { useI18n } from "@/components/i18n/locale-context";
import { roleKey, roleDescriptionKey, permissionKey, dayKey } from "@/lib/i18n/domain";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, h) => ({
  value: String(h),
  label: h === 24 ? "24:00" : formatHour(h),
}));

/* ------------------------------------------------------------- helpers */

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 sm:pe-6">
        <p className="text-small font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[0.75rem] leading-5 text-ink-muted">
          {description}
        </p>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

/** Marks a control that really changes behaviour, and names what it changes. */
function Live({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 flex items-start gap-1.5 text-[0.75rem] text-forest-700">
      <Check className="mt-px size-3.5 shrink-0" />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- module */

export function SettingsModule() {
  const toast = useToast();
  const settings = useSettings();
  const { t, locale } = useI18n();
  const { role, matrix, matrixEdited } = useRole();


  const [draft, setDraft] = React.useState({
    name: settings.name,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const profileDirty =
    draft.name !== settings.name ||
    draft.phone !== settings.phone ||
    draft.email !== settings.email ||
    draft.address !== settings.address;

  const saveProfile = () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = t("settings.profile.errName");
    if (!/^\+?[\d\s()-]{7,}$/.test(draft.phone.trim()))
      next.phone = t("settings.profile.errPhone");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim()))
      next.email = t("settings.profile.errEmail");
    if (!draft.address.trim()) next.address = t("settings.profile.errAddress");
    setErrors(next);
    if (Object.keys(next).length) return;

    updateSettings({
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
    });
    toast({
      tone: "success",
      title: t("settings.profile.savedTitle"),
      detail: t("hint.identityNote"),
    });
  };

  const changeDay = (day: number, patch: Partial<DayHours> | null) => {
    if (patch === null) {
      setDayHours(day, null);
      return;
    }
    const existing = settings.hours[day] ?? { open: 9, close: 17 };
    const merged = { ...existing, ...patch };
    // Closing before opening would make every booking that day invalid with
    // no way to see why, so the pair is kept in order here.
    if (merged.close <= merged.open) {
      merged.close = Math.min(24, merged.open + 1);
    }
    setDayHours(day, merged);
  };

  const edited = settingsEdited();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <h1 className="text-title text-ink">{t("settings.title")}</h1>
          <p className="text-[0.75rem] text-ink-muted">
{t("settings.subtitle")}
          </p>
        </div>
        {edited && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              resetSettings();
              setDraft({
                name: DEFAULT_SETTINGS.name,
                phone: DEFAULT_SETTINGS.phone,
                email: DEFAULT_SETTINGS.email,
                address: DEFAULT_SETTINGS.address,
              });
              setErrors({});
              toast({ tone: "info", title: t("settings.restoredToast") });
            }}
          >
            <RotateCcw />
            {t("common.restoreDefaults")}
          </Button>
        )}
      </div>

      <Tabs defaultValue="clinic" className="min-w-0">
        <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="clinic">{t("settings.tab.clinic")}</TabsTrigger>
            <TabsTrigger value="scheduling">{t("settings.tab.scheduling")}</TabsTrigger>
            <TabsTrigger value="language">{t("settings.tab.language")}</TabsTrigger>
            <TabsTrigger value="access">{t("settings.tab.access")}</TabsTrigger>
            <TabsTrigger value="about">{t("settings.tab.about")}</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 space-y-4">
          {/* ----------------------------------------------------- clinic */}
          <TabsContent value="clinic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle hint={t("settings.profile.hint")}>
                  {t("settings.profile.title")}
                </CardTitle>
                <Building2 className="size-4 text-ink-faint" />
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label={t("settings.profile.name")}
                    required
                    htmlFor="st-name"
                    error={errors.name}
                  >
                    <Input
                      id="st-name"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, name: e.target.value }))
                      }
                      invalid={!!errors.name}
                    />
                  </Field>
                  <Field
                    label={t("settings.profile.phone")}
                    required
                    htmlFor="st-phone"
                    error={errors.phone}
                    hint={t("settings.profile.phoneHint")}
                  >
                    <Input
                      id="st-phone"
                      dir="ltr"
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, phone: e.target.value }))
                      }
                      invalid={!!errors.phone}
                    />
                  </Field>
                  <Field
                    label={t("settings.profile.email")}
                    required
                    htmlFor="st-email"
                    error={errors.email}
                  >
                    <Input
                      id="st-email"
                      dir="ltr"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, email: e.target.value }))
                      }
                      invalid={!!errors.email}
                    />
                  </Field>
                  <Field
                    label={t("settings.profile.address")}
                    required
                    htmlFor="st-address"
                    error={errors.address}
                  >
                    <Input
                      id="st-address"
                      value={draft.address}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, address: e.target.value }))
                      }
                      invalid={!!errors.address}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveProfile}
                    disabled={!profileDirty}
                  >
                    {t("settings.profile.save")}
                  </Button>
                  {profileDirty && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDraft({
                          name: settings.name,
                          phone: settings.phone,
                          email: settings.email,
                          address: settings.address,
                        });
                        setErrors({});
                      }}
                    >
                      {t("common.discard")}
                    </Button>
                  )}
                </div>
                <Live>{t("settings.profile.live")}</Live>
              </CardBody>
            </Card>
          </TabsContent>

          {/* ------------------------------------------------- scheduling */}
          <TabsContent value="scheduling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle hint={describeHours(settings)}>
                  {t("settings.hours.title")}
                </CardTitle>
                <Clock className="size-4 text-ink-faint" />
              </CardHeader>
              <CardBody className="space-y-1 divide-y divide-line">
                {dayNames().map((name, day) => {
                  const hours = settings.hours[day];
                  return (
                    <div
                      key={name}
                      className="flex flex-wrap items-center gap-3 py-2.5"
                    >
                      <span className="w-24 shrink-0 text-small text-ink">
                        {t(dayKey(day))}
                      </span>

                      <Button
                        variant={hours ? "secondary" : "primary"}
                        size="sm"
                        onClick={() =>
                          changeDay(day, hours ? null : { open: 9, close: 17 })
                        }
                        className="w-24 justify-center"
                      >
                        {hours ? t("settings.hours.open") : t("settings.hours.closed")}
                      </Button>

                      {hours ? (
                        <span className="flex flex-wrap items-center gap-2">
                          <Select
                            value={String(hours.open)}
                            onValueChange={(v) =>
                              changeDay(day, { open: Number(v) })
                            }
                            ariaLabel={t("settings.hours.openingTime", { day: t(dayKey(day)) })}
                            className="w-28"
                            options={HOUR_OPTIONS.slice(0, 24)}
                          />
                          <span className="text-small text-ink-faint">{t("settings.hours.to")}</span>
                          <Select
                            value={String(hours.close)}
                            onValueChange={(v) =>
                              changeDay(day, { close: Number(v) })
                            }
                            ariaLabel={t("settings.hours.closingTime", { day: t(dayKey(day)) })}
                            className="w-28"
                            options={HOUR_OPTIONS.slice(1)}
                          />
                        </span>
                      ) : (
                        <span className="text-[0.75rem] text-ink-faint">
                          {t("settings.hours.noBooking")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle hint={t("settings.slots.hint")}>
                  {t("settings.slots.title")}
                </CardTitle>
                <CalendarClock className="size-4 text-ink-faint" />
              </CardHeader>
              <CardBody className="divide-y divide-line">
                <Row
                  title={t("settings.slots.label")}
                  description={t("hint.slotInterval")}
                >
                  <Select
                    value={String(settings.slotMinutes)}
                    onValueChange={(v) =>
                      updateSettings({ slotMinutes: Number(v) })
                    }
                    ariaLabel={t("settings.slots.label")}
                    className="w-40"
                    options={SLOT_OPTIONS.map((m) => ({
                      value: String(m),
                      label: t("settings.slots.minutes", { count: m }),
                    }))}
                  />
                </Row>
              </CardBody>
            </Card>

            <div className="rounded-card border border-forest-200/70 bg-forest-50/50 px-4 py-3.5">
              <p className="flex items-start gap-2 text-[0.75rem] leading-5 text-forest-900">
                <Sparkles className="mt-px size-3.5 shrink-0 text-forest-600" />
                <span>
                  <strong className="font-semibold">
                    {t("settings.scheduling.liveTitle")}
                  </strong>{" "}
                  {t("settings.scheduling.liveBody")}
                </span>
              </p>
            </div>
          </TabsContent>

          {/* --------------------------------------------------- language */}
          <TabsContent value="language" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle hint={t("settings.language.hint")}>
                  {t("settings.language.title")}
                </CardTitle>
                <Languages className="size-4 text-ink-faint" />
              </CardHeader>
              <CardBody className="divide-y divide-line">
                <Row
                  title={t("settings.language.interface")}
                  description={t("settings.language.interfaceDescription")}
                >
                  <LanguageSwitcher />
                </Row>
                <Row
                  title={t("settings.language.direction")}
                  description={t("settings.language.directionDescription")}
                >
                  {/* Direction is not independently settable: it follows the
                      language, so showing it as a toggle would invite a
                      combination the interface does not support. */}
                  <Badge tone="neutral">
                    {locale === "ar"
                      ? t("settings.language.rtl")
                      : t("settings.language.ltr")}
                  </Badge>
                </Row>
                <Row
                  title={t("settings.language.numerals")}
                  description={t("settings.language.numeralsDescription")}
                >
                  <Badge tone="neutral">
                    {t("settings.language.numeralsValue")}
                  </Badge>
                </Row>
              </CardBody>
            </Card>

            <p className="flex items-start gap-2 text-[0.75rem] leading-5 text-ink-muted">
              <CircleAlert className="mt-px size-3.5 shrink-0" />
              {t("settings.language.contentNote")}
            </p>
          </TabsContent>

          {/* ----------------------------------------------------- access */}
          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle hint={t("settings.access.hint")}>
                  {t("settings.access.title")}
                </CardTitle>
                <ShieldCheck className="size-4 text-ink-faint" />
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-small text-ink">
                    {t(roleKey(role))}
                  </span>
                  {matrixEdited && (
                    <Badge tone="gold">{t("settings.access.edited")}</Badge>
                  )}
                </div>
                <p className="text-[0.75rem] leading-5 text-ink-muted">
                  {t(roleDescriptionKey(role))}
                </p>

                <Separator />

                <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {(
                    Object.keys(PERMISSION_LABEL) as (keyof typeof PERMISSION_LABEL)[]
                  ).map((permission) => {
                    const allowed = matrix[role].includes(permission);
                    return (
                      <li
                        key={permission}
                        className="flex items-center gap-2 text-[0.75rem]"
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            allowed ? "bg-status-completed" : "bg-line"
                          )}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            allowed ? "text-ink-soft" : "text-ink-faint line-through"
                          )}
                        >
                          {t(permissionKey(permission))}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Separator />

                <p className="text-[0.75rem] leading-5 text-ink-muted">
{t("settings.access.footnote")}
                  {matrix[role].length !== permissionsFor(role).length &&
                    t("settings.access.differs")}
                </p>
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/users">
                    {t("settings.access.openUsers")}
                    <ArrowRight className="rtl:rotate-180" />
                  </Link>
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle hint={t("settings.elsewhere.hint")}>
                  {t("settings.elsewhere.title")}
                </CardTitle>
                <Globe className="size-4 text-ink-faint" />
              </CardHeader>
              <CardBody className="divide-y divide-line">
                <Row
                  title={t("settings.elsewhere.remindersTitle")}
                  description={t("settings.elsewhere.remindersBody")}
                >
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/notifications">
                      {t("nav.notifications")}
                      <ArrowRight className="rtl:rotate-180" />
                    </Link>
                  </Button>
                </Row>
                <Row
                  title={t("settings.elsewhere.assistantTitle")}
                  description={t("settings.elsewhere.assistantBody")}
                >
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/ai-assistant">
                      {t("nav.assistant")}
                      <ArrowRight className="rtl:rotate-180" />
                    </Link>
                  </Button>
                </Row>
                <Row
                  title={t("settings.elsewhere.servicesTitle")}
                  description={t("settings.elsewhere.servicesBody")}
                >
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/services">
                      {t("nav.services")}
                      <ArrowRight className="rtl:rotate-180" />
                    </Link>
                  </Button>
                </Row>
              </CardBody>
            </Card>
          </TabsContent>

          {/* ------------------------------------------------------ about */}
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle hint={t("settings.about.hint")}>
                  {t("settings.about.title")}
                </CardTitle>
                <Info className="size-4 text-ink-faint" />
              </CardHeader>
              <CardBody className="space-y-3 text-[0.75rem] leading-5 text-ink-muted">
                <p>{t("settings.about.intro")}</p>

                <Separator />

                <div>
                  <p className="mb-1.5 text-small font-medium text-ink">
                    {t("settings.about.realTitle")}
                  </p>
                  <ul className="space-y-1">
                    {(
                      [
                        "settings.about.real1",
                        "settings.about.real2",
                        "settings.about.real3",
                        "settings.about.real4",
                        "settings.about.real5",
                      ] as const
                    ).map((key) => (
                      <li key={key} className="flex gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-status-completed" />
                        <span>{t(key)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <p className="mb-1.5 text-small font-medium text-ink">
                    {t("settings.about.notTitle")}
                  </p>
                  <ul className="space-y-1">
                    {(
                      [
                        "settings.about.not1",
                        "settings.about.not2",
                        "settings.about.not3",
                        "settings.about.not4",
                        "settings.about.not5",
                        "settings.about.not6",
                      ] as const
                    ).map((key) => (
                      <li key={key} className="flex gap-2">
                        <span
                          className="mt-[0.4rem] size-1 shrink-0 rounded-full bg-ink-faint"
                          aria-hidden
                        />
                        <span>{t(key)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <p>{t("settings.about.credits")}</p>
              </CardBody>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
