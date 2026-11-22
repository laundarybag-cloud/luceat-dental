"use client";

import * as React from "react";
import Image from "next/image";
import { Check, ImagePlus, Save, AlertTriangle } from "lucide-react";
import {
  dayShort,
  formatMinutes,
  type DoctorProfile,
  type WeekSchedule,
} from "@/lib/mock/doctors";
import { services } from "@/lib/mock/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/locale-context";
import { pickText } from "@/lib/mock/localize";
import { BRANCH_AR } from "@/lib/mock/content-ar";

const toTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMinutes = (t: string) => {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
};

const EMPTY_WEEK: WeekSchedule = {
  0: null,
  1: { start: 9 * 60, end: 17 * 60 },
  2: { start: 9 * 60, end: 17 * 60 },
  3: { start: 9 * 60, end: 17 * 60 },
  4: { start: 9 * 60, end: 17 * 60 },
  5: { start: 9 * 60, end: 17 * 60 },
  6: null,
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function DoctorFormDialog({
  open,
  onOpenChange,
  doctor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: DoctorProfile;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [specialty, setSpecialty] = React.useState("");
  const [branch, setBranch] = React.useState("Harbour Street");
  const [slot, setSlot] = React.useState("30");
  const [bio, setBio] = React.useState("");
  const [week, setWeek] = React.useState<WeekSchedule>(EMPTY_WEEK);
  const [serviceIds, setServiceIds] = React.useState<string[]>([]);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(doctor?.name ?? "");
    setTitle(doctor?.title ?? "");
    setEmail(doctor?.email ?? "");
    setPhone(doctor?.phone ?? "");
    setSpecialty(doctor?.specialty ?? "");
    setBranch(doctor?.branch ?? "Harbour Street");
    setSlot(String(doctor?.slotMinutes ?? 30));
    setBio(doctor?.bio ?? "");
    setWeek(doctor?.schedule ?? EMPTY_WEEK);
    setServiceIds(doctor?.serviceIds ?? []);
    setTouched(false);
  }, [open, doctor]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const missing = {
    name: !name.trim(),
    email: !emailValid,
    specialty: !specialty.trim(),
  };
  const workingDays = DAY_ORDER.filter((d) => week[d]);
  const noDays = workingDays.length === 0;
  const noServices = serviceIds.length === 0;

  const invalidHours = workingDays.filter((d) => {
    const s = week[d]!;
    return s.end <= s.start;
  });

  const blocked =
    Object.values(missing).some(Boolean) ||
    noDays ||
    noServices ||
    invalidHours.length > 0;

  const toggleDay = (d: number) =>
    setWeek((w) => ({
      ...w,
      [d]: w[d] ? null : { start: 9 * 60, end: 17 * 60 },
    }));

  const setDayTime = (d: number, key: "start" | "end", value: string) =>
    setWeek((w) => ({
      ...w,
      [d]: w[d] ? { ...w[d]!, [key]: toMinutes(value) } : w[d],
    }));

  const toggleService = (id: string) =>
    setServiceIds((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id]
    );

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    toast({
      tone: "info",
      title: doctor ? t("doctors.changesNotSaved") : t("doctors.notCreated"),
      detail: t("doctorForm.notStored"),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={doctor ? `Edit ${doctor.name}` : t("empty.addClinician")}
        description={t("doctorForm.workingDaysHint")}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Save />
              {doctor ? "Save changes" : "Create clinician"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="relative size-20 overflow-hidden rounded-panel border border-line bg-surface-sunken">
                {doctor ? (
                  <Image
                    src={doctor.avatar}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <ImagePlus className="size-5 text-ink-faint" />
                  </span>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-20"
                onClick={() =>
                  toast({
                    tone: "info",
                    title: t("common.uploadsNeedBackend"),
                    detail: t("doctorForm.photoNotUploaded"),
                  })
                }
              >
                {t("doctorForm.photo")}
              </Button>
            </div>

            <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
              <Field
                label={t("doctorForm.fullName")}
                required
                htmlFor="dr-name"
                error={touched && missing.name ? t("v.clinicianName") : undefined}
              >
                <Input
                  id="dr-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("doctorForm.namePlaceholder")}
                  invalid={touched && missing.name}
                />
              </Field>
              <Field label={t("doctorForm.jobTitle")} htmlFor="dr-title">
                <Input
                  id="dr-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("doctorForm.titlePlaceholder")}
                />
              </Field>
              <Field
                label={t("patients.email")}
                required
                htmlFor="dr-email"
                error={
                  touched && missing.email
                    ? email.trim()
                      ? t("v.notAnEmail")
                      : t("v.workEmail")
                    : undefined
                }
              >
                <Input
                  id="dr-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@luceatdental.com"
                  invalid={touched && missing.email}
                />
              </Field>
              <Field label={t("patients.phone")} htmlFor="dr-phone">
                <Input
                  id="dr-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 415 555 0000"
                />
              </Field>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t("doctorForm.primarySpecialty")}
              required
              error={touched && missing.specialty ? t("v.chooseSpecialty") : undefined}
            >
              <Select
                value={specialty}
                onValueChange={setSpecialty}
                ariaLabel={t("doctorForm.primarySpecialty")}
                placeholder={t("common.selectPlaceholder")}
                invalid={touched && missing.specialty}
                options={[
                  "Prosthodontics",
                  "Oral Surgery",
                  "Orthodontics",
                  "Endodontics",
                  "Paediatric Dentistry",
                  "Periodontics",
                  "General Dentistry",
                ].map((s) => ({ value: s, label: s }))}
              />
            </Field>
            <Field label={t("doctorForm.branch")}>
              <Select
                value={branch}
                onValueChange={setBranch}
                ariaLabel={t("doctorForm.branch")}
                options={[
                  {
                    value: "Harbour Street",
                    label: pickText("Harbour Street", BRANCH_AR),
                  },
                  {
                    value: "Lindendal Clinic",
                    label: pickText("Lindendal Clinic", BRANCH_AR),
                  },
                ]}
              />
            </Field>
            <Field
              label={t("doctorForm.defaultLength")}
              hint={t("doctorForm.defaultLengthHint")}
            >
              <Select
                value={slot}
                onValueChange={setSlot}
                ariaLabel={t("doctorForm.defaultLength")}
                options={["15", "20", "30", "45", "60", "90"].map((m) => ({
                  value: m,
                  label: `${m} minutes`,
                }))}
              />
            </Field>
          </div>

          {/* Rota */}
          <div>
            <p className="text-label uppercase text-ink-faint">{t("doctors.workingDays")}</p>
            <div className="mt-2 space-y-1.5">
              {DAY_ORDER.map((d) => {
                const day = week[d];
                const bad = day && day.end <= day.start;
                return (
                  <div
                    key={d}
                    className={cn(
                      "flex flex-wrap items-center gap-2 rounded-field border px-2.5 py-2",
                      day ? "border-line bg-surface" : "border-line bg-canvas",
                      bad && "border-status-cancelled/50"
                    )}
                  >
                    <button
                      onClick={() => toggleDay(d)}
                      aria-pressed={!!day}
                      className={cn(
                        "flex w-20 items-center gap-2 text-small font-medium transition-colors",
                        day ? "text-ink" : "text-ink-faint"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded border transition-colors",
                          day
                            ? "border-forest-600 bg-forest-600 text-white"
                            : "border-line-strong bg-surface"
                        )}
                      >
                        {day && <Check className="size-3" />}
                      </span>
                      {dayShort()[d]}
                    </button>

                    {day ? (
                      <>
                        <Input
                          type="time"
                          step={900}
                          value={toTime(day.start)}
                          onChange={(e) => setDayTime(d, "start", e.target.value)}
                          className="h-8 w-28"
                          aria-label={t("doctorForm.dayStart", { day: dayShort()[d] })}
                        />
                        <span className="text-ink-faint">–</span>
                        <Input
                          type="time"
                          step={900}
                          value={toTime(day.end)}
                          onChange={(e) => setDayTime(d, "end", e.target.value)}
                          className="h-8 w-28"
                          aria-label={t("doctorForm.dayEnd", { day: dayShort()[d] })}
                        />
                        {day.breakStart != null && day.breakEnd != null && (
                          <span className="text-[0.75rem] tabular-nums text-ink-faint">
                            break {formatMinutes(day.breakStart)}–
                            {formatMinutes(day.breakEnd)}
                          </span>
                        )}
                        {bad && (
                          <span className="flex items-center gap-1 text-[0.75rem] text-status-cancelled">
                            <AlertTriangle className="size-3.5" />
                            {t("doctorForm.endAfterStart")}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[0.75rem] text-ink-faint">
                        {t("doctors.notWorking")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {touched && noDays && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] text-status-cancelled">
                <AlertTriangle className="size-3.5" />
                {t("doctorForm.needDay")}
              </p>
            )}
          </div>

          {/* Services */}
          <div>
            <p className="text-label uppercase text-ink-faint">
              {t("doctorForm.servicesProvided")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {services.map((s) => {
                const on = serviceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[0.75rem] font-medium transition-colors",
                      on
                        ? "border-forest-400 bg-forest-50 text-forest-800"
                        : "border-line bg-surface text-ink-muted hover:border-line-strong"
                    )}
                    title={`${s.durationMin} min · ${formatMoney(s.price)}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            {touched && noServices && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] text-status-cancelled">
                <AlertTriangle className="size-3.5" />
                {t("doctorForm.needService")}
              </p>
            )}
          </div>

          <Field label={t("doctorForm.biography")} hint={t("doctorForm.biographyHint")}>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("doctorForm.biographyPlaceholder")}
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
