"use client";

import {
  Users,
  UserPlus,
  CalendarDays,
  CircleDollarSign,
  CheckCircle2,
  CalendarX2,
} from "lucide-react";
import { clinicHeadline, kpiSeries } from "@/lib/analytics";
import { useI18n } from "@/components/i18n/locale-context";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  RevenueChart,
  AppointmentOutcomesChart,
} from "@/components/dashboard/charts";
import {
  ActivityFeed,
  AlertsPanel,
  DoctorPerformance,
  PopularServices,
  TodaySchedule,
  WelcomeBanner,
} from "@/components/dashboard/panels";

export default function OverviewPage() {
  const { t, fmt } = useI18n();
  // Derived from the same aggregations Module 13 reports from, so the
  // dashboard and the reports cannot disagree about the clinic's figures.
  const headline = clinicHeadline();
  // Series and deltas derived too: a card shows a delta chip only where a
  // comparison period actually holds data.
  const series = kpiSeries();

  return (
    <div className="space-y-5">
      <WelcomeBanner />

      {/* Primary metrics */}
      <section
        aria-label={t("dashboard.metrics.aria")}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label={t("dashboard.kpi.totalPatients")}
          value={fmt.number(headline.totalPatients)}
          sublabel={t("dashboard.kpi.onRegister")}
          delta={series.total.delta}
          icon={<Users />}
          spark={series.total.series}
        />
        <KpiCard
          label={t("dashboard.kpi.newPatients")}
          value={fmt.number(headline.newPatients)}
          sublabel={t("dashboard.kpi.joined60")}
          delta={series.newPatients.delta}
          icon={<UserPlus />}
          spark={series.newPatients.series}
        />
        <KpiCard
          label={t("dashboard.kpi.appointmentsToday")}
          value={fmt.number(headline.appointmentsToday)}
          sublabel={t("dashboard.kpi.acrossClinic")}
          delta={series.today.delta}
          icon={<CalendarDays />}
          spark={series.today.series}
        />
        <KpiCard
          label={t("dashboard.kpi.revenueMonth")}
          value={fmt.money(headline.revenue30d)}
          sublabel={t("dashboard.kpi.invoiced30")}
          delta={series.revenue.delta}
          icon={<CircleDollarSign />}
          accent="gold"
          spark={series.revenue.series}
        />
      </section>

      {/* Secondary metrics — deliberately quieter than the four above */}
      <section
        aria-label={t("dashboard.outcomesToday.aria")}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <SecondaryStat
          icon={<CheckCircle2 className="size-4 text-status-completed" />}
          label={t("dashboard.kpi.completedToday")}
          value={fmt.number(headline.completedToday)}
          detail={t("dashboard.kpi.percentOfList", {
            percent: fmt.percent(
              (headline.completedToday /
                Math.max(1, headline.appointmentsToday)) *
                100
            ),
          })}
        />
        <SecondaryStat
          icon={<CalendarX2 className="size-4 text-status-cancelled" />}
          label={t("dashboard.kpi.cancelledToday")}
          value={fmt.number(headline.cancelledToday)}
          detail={t("dashboard.kpi.chairReleased")}
        />
        <SecondaryStat
          icon={<CalendarDays className="size-4 text-status-checkedin" />}
          label={t("dashboard.kpi.awaiting")}
          value={fmt.number(headline.awaitingConfirmation)}
          detail={t("dashboard.kpi.remindersSent")}
        />
        <SecondaryStat
          icon={<Users className="size-4 text-forest-500" />}
          label={t("dashboard.kpi.chairsInUse")}
          value={`${fmt.number(headline.chairsInUse)} / ${fmt.number(
            headline.operatories
          )}`}
          detail={t("dashboard.kpi.treatingNow")}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <RevenueChart />
        </div>
        <div className="xl:col-span-2">
          <AppointmentOutcomesChart />
        </div>
      </section>

      {/* Operations */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TodaySchedule />
        </div>
        <div className="space-y-4">
          <AlertsPanel />
          <DoctorPerformance />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PopularServices />
        <ActivityFeed />
      </section>
    </div>
  );
}

function SecondaryStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3.5">
      <div className="flex items-center gap-2">
        {icon}
        <p className="truncate text-[0.75rem] font-medium text-ink-muted">
          {label}
        </p>
      </div>
      <p data-metric className="mt-1.5 text-title text-ink">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[0.75rem] text-ink-faint">{detail}</p>
    </div>
  );
}
