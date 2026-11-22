"use client";

import * as React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ImagePlus,
  Save,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type { CatalogueEntry } from "@/lib/mock/catalogue";
import { categories } from "@/lib/mock/catalogue";
import { doctorProfiles } from "@/lib/mock/doctors";
import { weekAppointments } from "@/lib/mock/schedule";
import { cn, formatMoney } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/overlay";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { NoImageTile } from "./service-card";
import { useI18n } from "@/components/i18n/locale-context";

export function ServiceFormDialog({
  open,
  onOpenChange,
  entry,
  focusAssignments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: CatalogueEntry;
  focusAssignments?: boolean;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [duration, setDuration] = React.useState("30");
  const [buffer, setBuffer] = React.useState("5");
  const [price, setPrice] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [doctorIds, setDoctorIds] = React.useState<string[]>([]);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(entry?.name ?? "");
    setCategory(entry?.category ?? "");
    setDescription(entry?.description ?? "");
    setDuration(String(entry?.durationMin ?? 30));
    setBuffer(String(entry?.bufferMin ?? 5));
    setPrice(entry ? String(entry.price) : "");
    setActive(entry?.active ?? true);
    setDoctorIds(entry?.doctorIds ?? []);
    setTouched(false);
  }, [open, entry]);

  const priceNumber = Number(price);
  const missing = {
    name: !name.trim(),
    category: !category,
    price: price.trim() === "" || Number.isNaN(priceNumber) || priceNumber < 0,
  };
  const blocked = Object.values(missing).some(Boolean);

  const toggleDoctor = (id: string) =>
    setDoctorIds((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id]
    );

  const activeAssigned = doctorIds.filter(
    (id) => doctorProfiles.find((d) => d.id === id)?.status === "active"
  );

  const submit = () => {
    setTouched(true);
    if (blocked) return;
    toast({
      tone: "info",
      title: entry ? t("doctors.changesNotSaved") : t("svc.notCreated"),
      detail: t("serviceForm.notStored"),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        title={
          entry
            ? focusAssignments
              ? t("svc.assignClinicians", { service: entry.name })
              : `Edit ${entry.name}`
            : t("empty.addService")
        }
        description={t("serviceForm.feedsBook")}
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={submit}>
              <Save />
              {entry ? "Save changes" : "Create service"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="relative h-20 w-28 overflow-hidden rounded-panel border border-line bg-surface-sunken">
                {entry?.image ? (
                  <Image
                    src={entry.image}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <NoImageTile />
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-28"
                onClick={() =>
                  toast({
                    tone: "info",
                    title: t("common.uploadsNeedBackend"),
                    detail: t("serviceForm.photoNotUploaded"),
                  })
                }
              >
                <ImagePlus />
                {t("doctorForm.photo")}
              </Button>
            </div>

            <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
              <Field
                label={t("serviceForm.name")}
                required
                htmlFor="sv-name"
                className="sm:col-span-2"
                error={touched && missing.name ? t("v.serviceName") : undefined}
              >
                <Input
                  id="sv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("serviceForm.namePlaceholder")}
                  invalid={touched && missing.name}
                />
              </Field>
              <Field
                label={t("serviceForm.category")}
                required
                error={touched && missing.category ? t("v.chooseCategory") : undefined}
              >
                <Select
                  value={category}
                  onValueChange={setCategory}
                  ariaLabel={t("serviceForm.category")}
                  placeholder={t("common.selectPlaceholder")}
                  invalid={touched && missing.category}
                  options={categories.map((c) => ({
                    value: c.name,
                    label: c.name,
                  }))}
                />
              </Field>
              <Field label={t("col.status")} hint={t("serviceForm.inactiveHint")}>
                <Select
                  value={active ? "active" : "inactive"}
                  onValueChange={(v) => setActive(v === "active")}
                  ariaLabel={t("col.status")}
                  options={[
                    { value: "active", label: t("common.active") },
                    { value: "inactive", label: t("common.inactive") },
                  ]}
                />
              </Field>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("serviceForm.length")} hint={t("serviceForm.lengthHint")}>
              <Select
                value={duration}
                onValueChange={setDuration}
                ariaLabel={t("serviceForm.length")}
                options={["15", "20", "30", "45", "60", "90", "120"].map((m) => ({
                  value: m,
                  label: `${m} minutes`,
                }))}
              />
            </Field>
            <Field label={t("serviceForm.turnaround")} hint={t("serviceForm.turnaroundHint")}>
              <Select
                value={buffer}
                onValueChange={setBuffer}
                ariaLabel={t("serviceForm.turnaround")}
                options={["0", "5", "10", "15", "20", "30"].map((m) => ({
                  value: m,
                  label: `${m} minutes`,
                }))}
              />
            </Field>
            <Field
              label={t("serviceForm.price")}
              required
              htmlFor="sv-price"
              hint={
                !missing.price && price
                  ? `Shown to patients as ${formatMoney(priceNumber)}`
                  : "Excluding any insurance contribution."
              }
              error={
                touched && missing.price
                  ? t("v.priceZeroOrMore")
                  : undefined
              }
            >
              <Input
                id="sv-price"
                type="number"
                min={0}
                step={5}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t("serviceForm.pricePlaceholder")}
                invalid={touched && missing.price}
              />
            </Field>
          </div>

          <Field label={t("serviceForm.description")} hint={t("serviceForm.descriptionHint")}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("serviceForm.descriptionPlaceholder")}
            />
          </Field>

          <div>
            <p className="text-label uppercase text-ink-faint">
              {t("serviceForm.cliniciansProviding")}
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {doctorProfiles.map((d) => {
                const on = doctorIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDoctor(d.id)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-2.5 rounded-field border px-2.5 py-2 text-start transition-colors",
                      on
                        ? "border-forest-400 bg-forest-50"
                        : "border-line bg-surface hover:border-line-strong"
                    )}
                  >
                    <Avatar src={d.avatar} name={d.name} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[0.8125rem] font-medium",
                          on ? "text-forest-800" : "text-ink"
                        )}
                      >
                        {d.name}
                      </span>
                      <span className="block truncate text-[0.6875rem] text-ink-muted">
                        {d.specialty}
                        {d.status !== "active" ? " · on leave" : ""}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "size-4 shrink-0 rounded border",
                        on
                          ? "border-forest-600 bg-forest-600"
                          : "border-line-strong bg-surface"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {active && activeAssigned.length === 0 && (
              <p className="mt-2 flex items-start gap-1.5 rounded-field border border-status-pending/30 bg-status-pending-bg/70 px-2.5 py-2 text-[0.75rem] text-status-pending">
                <AlertTriangle className="mt-px size-3.5 shrink-0" />
                {t("svc.noAvailableProvider")}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation that states the real consequence first. */
export function DeleteServiceDialog({
  entry,
  onOpenChange,
}: {
  entry: CatalogueEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const booked = entry
    ? weekAppointments.filter(
        (a) => a.serviceId === entry.id && a.status !== "cancelled"
      ).length
    : 0;

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      {entry && (
        <DialogContent
          title={`Delete ${entry.name}?`}
          description={t("services.deleteBody")}
          footer={
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t("services.keep")}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  toast({
                    tone: "info",
                    title: t("services.notDeleted"),
                    detail: t("services.notDeletedBody"),
                  });
                  onOpenChange(false);
                }}
              >
                <Trash2 />
                {t("services.delete")}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            {booked > 0 ? (
              <p className="flex items-start gap-2.5 rounded-field border border-status-cancelled/25 bg-status-cancelled-bg/60 px-3 py-2.5 text-small text-status-cancelled">
                <TriangleAlert className="mt-px size-4 shrink-0" />
                <span>
                  <span className="font-medium">
                    {booked} appointment{booked === 1 ? "" : "s"} in the current
                    book use this service.
                  </span>{" "}
                  Deleting it would leave those appointments without a
                  treatment. Consider marking it inactive instead — it stays on
                  past records but can no longer be booked.
                </span>
              </p>
            ) : (
              <p className="text-small text-ink-soft">
                No appointments reference this service, so deleting it affects
                nothing else.
              </p>
            )}
            <p className="text-[0.75rem] text-ink-muted">
              {t("svc.wouldLoseAssignment", {
                count: fmt.number(entry.doctorIds.length),
              })}
            </p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
