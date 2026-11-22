import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  Sparkles,
  FileHeart,
  ClipboardList,
  Receipt,
  BookOpen,
  Bot,
  Bell,
  BarChart3,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { MessageKey } from "@/locales/en";

export interface NavItem {
  /** Message key, resolved at render time by the active locale. */
  label: MessageKey;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: MessageKey;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "nav.group.clinic",
    items: [
      { label: "nav.overview", href: "/", icon: LayoutDashboard },
      { label: "nav.appointments", href: "/appointments", icon: CalendarDays, badge: "12" },
      { label: "nav.patients", href: "/patients", icon: Users },
      { label: "nav.doctors", href: "/doctors", icon: Stethoscope },
      { label: "nav.services", href: "/services", icon: Sparkles },
    ],
  },
  {
    label: "nav.group.clinical",
    items: [
      { label: "nav.medicalRecords", href: "/medical-records", icon: FileHeart },
      { label: "nav.treatmentPlans", href: "/treatment-plans", icon: ClipboardList },
      { label: "nav.payments", href: "/payments", icon: Receipt },
    ],
  },
  {
    label: "nav.group.intelligence",
    items: [
      { label: "nav.knowledge", href: "/knowledge", icon: BookOpen },
      { label: "nav.assistant", href: "/ai-assistant", icon: Bot, badge: "14" },
      { label: "nav.reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "nav.group.administration",
    items: [
      { label: "nav.notifications", href: "/notifications", icon: Bell },
      { label: "nav.users", href: "/users", icon: ShieldCheck },
      { label: "nav.settings", href: "/settings", icon: Settings },
    ],
  },
];

export const findNavItem = (pathname: string): NavItem | undefined =>
  navigation
    .flatMap((g) => g.items)
    .find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)));
