"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  Info,
  ShieldAlert,
  MoreHorizontal,
  CalendarX2,
  Star,
  Bot,
  CreditCard,
  FileHeart,
  CalendarCheck,
  CalendarClock,
  Phone,
  ClipboardPlus,
  Sparkle,
  Activity,
} from "lucide-react";
import {
  activity,
  appointments,
  doctorById,
  doctors,
  services,
} from "@/lib/mock/clinic";
import type { ActivityEntry, Appointment } from "@/lib/types";
import { NOW, TODAY, weekAppointments } from "@/lib/mock/schedule";
import { clinicHeadline } from "@/lib/analytics";
import { useNotifications } from "@/components/notifications/notification-context";
import { useI18n } from "@/components/i18n/locale-context";
import { cn, formatMoney, formatNumber } from "@/lib/utils";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Progress,
  Tooltip,
} from "@/components/ui/primitives";

/** Fixed UTC formatter so server and client output match exactly. */
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const time = (iso: string) => timeFmt.format(new Date(iso));

/* ------------------------------------------------------- Welcome banner */

/**
 * The hero's facts, all derived from the same fixture the schedule and the
 * reports read. A hardcoded "18 of 36" would drift the moment the rota moved.
 */
function heroFacts() {
  const headline = clinicHeadline();
  const today = weekAppointments.filter((a) => a.start.startsWith(TODAY));
  const onShift = new Set(today.map((a) => a.doctorId)).size;
  const hour = new Date(NOW).getUTCHours();
  const greetingKey =
    hour < 12
      ? ("dashboard.greeting.morning" as const)
      : hour < 17
        ? ("dashboard.greeting.afternoon" as const)
        : ("dashboard.greeting.evening" as const);

  return {
    greetingKey,
    onShift,
    done: headline.completedToday,
    total: headline.appointmentsToday,
  };
}

/** One fact in the hero's status strip. */
function HeroFact({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-field [&_svg]:size-4",
          accent
            ? "bg-gold-100 text-gold-600"
            : "bg-white text-forest-600 shadow-card"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-label uppercase text-ink-faint">
          {label}
        </span>
        {/* dir="auto" keeps figure-led strings ("18 of 36 …") in reading
            order when the shell is flipped to Arabic RTL. */}
        <span
          dir="auto"
          className="block truncate text-small font-medium text-ink"
        >
          {value}
        </span>
      </span>
    </div>
  );
}

export function WelcomeBanner() {
  const { t, fmt } = useI18n();
  const facts = heroFacts();

  return (
    <section className="relative overflow-hidden rounded-panel border border-line bg-[linear-gradient(104deg,var(--color-surface)_0%,var(--color-canvas)_46%,var(--color-forest-50)_74%,var(--color-forest-100)_100%)] shadow-card">
      {/* Soft sage halo behind the portrait, and a warm one at the top edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-24 -top-28 size-[26rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-forest-200)_55%,transparent)_0%,transparent_68%)] blur-[2px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -start-20 bottom-[-9rem] size-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-gold-200)_38%,transparent)_0%,transparent_70%)]"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-stretch md:gap-8">
        {/* Greeting */}
        <div className="animate-fade-up min-w-0 flex-1 px-6 pt-6 md:px-8 md:py-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-forest-200/70 bg-white/70 px-2.5 py-1 text-label uppercase text-forest-700 backdrop-blur-sm">
            <Sparkle className="size-3 text-gold-400" />
            {t("dashboard.welcomeBack")}
          </span>

          <h1 className="mt-4 text-display text-forest-900">
            {t("dashboard.greetingName", {
              greeting: t(facts.greetingKey),
              name: t("doctor.owner.first"),
            })}
          </h1>
          {/* No dir="rtl" here: the bidi algorithm already orders the Arabic
              glyphs, and forcing RTL would push the line to the far edge away
              from the heading it belongs to. */}
          <p
            lang="ar"
            className="mt-1.5 font-arabic text-[1.0625rem] font-medium leading-7 text-forest-600"
          >
            د. مريم النفيلي
          </p>

          <p className="mt-3 max-w-md text-body text-ink-muted">
            {t("dashboard.clinicGrowing")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
            <HeroFact
              icon={<CalendarClock />}
              label={t("dashboard.fact.today")}
              value={fmt.fullDate(TODAY)}
            />
            <HeroFact
              icon={<Activity />}
              label={t("dashboard.fact.clinicStatus")}
              value={
                <span className="flex items-center gap-1.5">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-forest-400 opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-forest-500" />
                  </span>
                  {t("dashboard.fact.openWith", {
                    count: fmt.number(facts.onShift),
                  })}
                </span>
              }
            />
            <HeroFact
              icon={<CalendarCheck />}
              label={t("dashboard.fact.schedule")}
              value={t("dashboard.fact.appointmentsDone", {
                done: fmt.number(facts.done),
                total: fmt.number(facts.total),
              })}
              accent
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 pb-6 md:pb-0">
            <Button variant="primary" size="lg">
              <CalendarClock />
              {t("dashboard.openSchedule")}
            </Button>
            <Button variant="secondary" size="lg">
              <ClipboardPlus />
              {t("dashboard.addPatient")}
            </Button>
          </div>
        </div>

        {/* Portrait */}
        {/* self-center while stacked — `self-end` would throw the portrait
            against the right edge once the flex direction is column. */}
        <div className="relative shrink-0 self-center px-6 md:self-end md:px-8 md:pe-10">
          <div className="relative mx-auto h-56 w-44 overflow-hidden rounded-[1.5rem] rounded-b-none bg-[linear-gradient(170deg,var(--color-forest-100)_0%,var(--color-surface)_72%)] shadow-[0_18px_40px_-18px_rgba(13,45,40,0.35)] ring-1 ring-forest-200/60 md:h-[19.5rem] md:w-56">
            <Image
              src="/images/doctor.jpg"
              alt={t("dashboard.doctorAlt")}
              fill
              priority
              sizes="(max-width: 768px) 11rem, 14rem"
              className="object-cover object-[center_12%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Today's list */

function AppointmentRow({ appt }: { appt: Appointment }) {
  const { t, fmt } = useI18n();
  const doctor = doctorById(appt.doctorId);
  const live = appt.status === "in_progress";

  return (
    <li
      className={cn(
        "group relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas",
        live && "bg-forest-50/60"
      )}
    >
      {live && (
        <span className="absolute inset-y-0 start-0 w-[3px] bg-forest-500" />
      )}
      <div className="w-14 shrink-0">
        <p className="text-small font-semibold tabular-nums text-ink">
          {time(appt.start)}
        </p>
        <p className="text-[0.6875rem] text-ink-faint">
        {t("common.minutesShort", { count: fmt.number(appt.durationMin) })}
      </p>
      </div>

      <Avatar src={appt.patient.avatar} name={appt.patient.name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-small font-medium text-ink">
          {appt.patient.name}
          {appt.isNewPatient && (
            <Badge tone="gold" className="px-1.5 py-0 text-[0.6875rem]">
              {t("row.newPatientTag")}
            </Badge>
          )}
        </p>
        <p className="truncate text-[0.75rem] text-ink-muted">
          {appt.service} · {doctor?.name.replace("Dr. ", "Dr ")}
        </p>
      </div>

      <StatusBadge status={appt.status} className="hidden sm:inline-flex" />

      <Menu>
        <MenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${appt.patient.name}`}
            className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem>
            <CalendarCheck /> {t("row.checkInPatient")}
          </MenuItem>
          <MenuItem>
            <Phone /> Call {appt.patient.phone}
          </MenuItem>
          <MenuItem>
            <FileHeart /> {t("row.openMedicalRecord")}
          </MenuItem>
          <MenuSeparator />
          <MenuItem tone="danger">
            <CalendarX2 /> {t("row.cancelAppointment")}
          </MenuItem>
        </MenuContent>
      </Menu>
    </li>
  );
}

export function TodaySchedule() {
  const { t, fmt } = useI18n();
  const [filter, setFilter] = React.useState<"all" | "active">("all");
  const list = appointments.filter((a) =>
    filter === "all"
      ? true
      : ["checked_in", "in_progress", "confirmed", "pending"].includes(a.status)
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle hint={t("dashboard.schedule.hint")}>
          {t("dashboard.schedule.title")}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Button
            variant={filter === "all" ? "subtle" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            {t("dashboard.schedule.allDay")}
          </Button>
          <Button
            variant={filter === "active" ? "subtle" : "ghost"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            {t("dashboard.schedule.upcomingFilter")}
          </Button>
        </div>
      </CardHeader>

      {list.length ? (
        <ul className="flex-1 divide-y divide-line">
          {list.map((a) => (
            <AppointmentRow key={a.id} appt={a} />
          ))}
        </ul>
      ) : (
        <div className="flex-1 px-5">
          <EmptyState
            illustration={
              <span className="flex size-11 items-center justify-center rounded-full bg-forest-50">
                <CalendarX2 className="size-5 text-forest-400" />
              </span>
            }
            title={t("dashboard.schedule.emptyTitle")}
            description={t("dashboard.schedule.emptyBody")}
          />
        </div>
      )}

      <CardFooter>
        <span className="text-[0.75rem] text-ink-muted">
          {t("dashboard.schedule.showing", {
            shown: fmt.number(list.length),
            total: fmt.number(appointments.length),
          })}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/appointments">
            {t("dashboard.schedule.openCalendar")} <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------- Alerts */

const SEVERITY = {
  critical: {
    icon: ShieldAlert,
    chip: "bg-status-cancelled-bg text-status-cancelled",
  },
  attention: {
    icon: AlertTriangle,
    chip: "bg-status-pending-bg text-status-pending",
  },
  info: { icon: Info, chip: "bg-status-checkedin-bg text-status-checkedin" },
} as const;

/**
 * The same alerts the notification centre shows, not a second hardcoded
 * list. This panel used to invent three of its own — unsigned X-ray consent
 * forms, a chair service window — that no data in the build supported and
 * that the centre knew nothing about.
 */
export function AlertsPanel() {
  const { visible, detailHidden } = useNotifications();
  const { t, fmt } = useI18n();
  const top = visible.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle hint={t("dashboard.alerts.hint")}>
          {t("dashboard.alerts.title")}
        </CardTitle>
        {visible.length > 0 && <Badge tone="danger">{visible.length}</Badge>}
      </CardHeader>
      <CardBody className="space-y-2 pb-4">
        {top.length ? (
          top.map((a) => {
            const S = SEVERITY[a.severity];
            const Icon = S.icon;
            const hidden = detailHidden(a);
            return (
              <Link
                key={a.id}
                href={a.href}
                className="flex items-start gap-3 rounded-field border border-transparent px-2.5 py-2.5 transition-colors hover:border-line hover:bg-canvas"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                    S.chip
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-small font-medium text-ink">
                    {a.title}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] leading-[1.15rem] text-ink-muted">
                    {hidden
                      ? t("notifications.detailHiddenShort")
                      : a.detail}
                  </span>
                </span>
                <ArrowRight className="mt-1.5 size-3.5 shrink-0 text-ink-faint rtl:rotate-180" />
              </Link>
            );
          })
        ) : (
          <p className="px-2.5 py-4 text-small text-ink-muted">
            {t("dashboard.alerts.none")}
          </p>
        )}
      </CardBody>
      {visible.length > top.length && (
        <CardFooter>
          <Link
            href="/notifications"
            className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-forest-700 hover:underline"
          >
            {t("dashboard.alerts.seeAll", {
              count: fmt.number(visible.length),
            })}
            <ArrowRight className="size-3 rtl:rotate-180" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

/* -------------------------------------------------- Doctor performance */

export function DoctorPerformance() {
  const { t } = useI18n();
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle hint={t("dashboard.doctors.hint2")}>
          {t("dashboard.doctors.title2")}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/doctors">
            {t("common.allShort")} <ArrowRight className="rtl:rotate-180" />
          </Link>
        </Button>
      </CardHeader>
      <CardBody className="space-y-3.5">
        {doctors.slice(0, 5).map((d) => (
          <div key={d.id} className="flex items-center gap-3">
            <Avatar
              src={d.avatar}
              name={d.name}
              size="md"
              status={d.online ? "online" : "offline"}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-small font-medium text-ink">
                  {d.name}
                </p>
                <span
                  data-metric
                  className="shrink-0 text-small font-semibold text-ink"
                >
                  {d.utilisation}%
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <Progress
                  value={d.utilisation}
                  tone={d.utilisation >= 85 ? "brand" : "muted"}
                  className="flex-1"
                />
                <Tooltip content={`${d.rating} average patient rating`}>
                  <span className="flex shrink-0 items-center gap-1 text-[0.75rem] font-medium tabular-nums text-ink-muted">
                    <Star className="size-3 fill-gold-300 text-gold-300" />
                    {d.rating}
                  </span>
                </Tooltip>
              </div>
              <p className="mt-1 truncate text-[0.6875rem] text-ink-faint">
                {d.specialty} · {d.completed} completed · {d.room}
              </p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------ Popular services */

export function PopularServices() {
  const { t } = useI18n();
  // Bars are scaled against the top service so their lengths mean something.
  const maxBookings = Math.max(...services.map((s) => s.bookings));
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle hint={t("dashboard.services.hint2")}>
          {t("dashboard.services.title2")}
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {services.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-field">
              <Image
                src={s.image}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-small font-medium text-ink">
                  {s.name}
                </p>
                <span
                  data-metric
                  className="shrink-0 text-small font-semibold text-ink"
                >
                  {formatMoney(s.revenue)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <Progress
                  value={(s.bookings / maxBookings) * 100}
                  tone="gold"
                  className="flex-1"
                />
                <span className="w-[5.5rem] shrink-0 text-end text-[0.75rem] tabular-nums text-ink-muted">
                  {formatNumber(s.bookings)} booked
                </span>
                <span
                  className={cn(
                    "w-12 shrink-0 text-end text-[0.75rem] font-semibold tabular-nums",
                    s.trend >= 0
                      ? "text-status-completed"
                      : "text-status-cancelled"
                  )}
                >
                  {s.trend >= 0 ? "+" : "−"}
                  {Math.abs(s.trend)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------- Activity feed */

const ACTIVITY_ICON: Record<
  ActivityEntry["kind"],
  { icon: typeof Bot; chip: string }
> = {
  ai: { icon: Bot, chip: "bg-status-progress-bg text-status-progress" },
  paid: { icon: CreditCard, chip: "bg-status-completed-bg text-status-completed" },
  record: { icon: FileHeart, chip: "bg-forest-50 text-forest-600" },
  cancelled: {
    icon: CalendarX2,
    chip: "bg-status-cancelled-bg text-status-cancelled",
  },
  booked: {
    icon: CalendarCheck,
    chip: "bg-status-checkedin-bg text-status-checkedin",
  },
};

export function ActivityFeed() {
  const { t } = useI18n();
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle hint={t("dashboard.activity.hint2")}>
          {t("dashboard.activity.title2")}
        </CardTitle>
      </CardHeader>
      <CardBody className="pb-4">
        <ol className="relative space-y-4 ps-1">
          <span
            className="absolute inset-y-2 start-[1.0625rem] w-px bg-line"
            aria-hidden
          />
          {activity.map((e) => {
            const A = ACTIVITY_ICON[e.kind];
            const Icon = A.icon;
            return (
              <li key={e.id} className="relative flex gap-3">
                <span
                  className={cn(
                    "z-10 flex size-[1.875rem] shrink-0 items-center justify-center rounded-full ring-4 ring-surface",
                    A.chip
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-small leading-[1.3rem] text-ink-soft">
                    <span className="font-medium text-ink">{e.actor}</span>{" "}
                    {e.summary}
                  </p>
                  {e.detail && (
                    <p className="mt-0.5 truncate text-[0.75rem] text-ink-muted">
                      {e.detail}
                    </p>
                  )}
                </div>
                <time
                  className="shrink-0 pt-0.5 text-[0.75rem] tabular-nums text-ink-faint"
                  dateTime={e.at}
                >
                  {time(e.at)}
                </time>
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}
