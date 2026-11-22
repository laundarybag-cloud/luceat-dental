/**
 * Bridges domain constants to message keys.
 *
 * The domain modules (`access.ts`, `notifications.ts`, `schedule.ts` …) keep
 * their own shapes — a role is still a role, not a translation concern — and
 * these mappers say what each value is called in the active language. That
 * keeps the dictionaries flat and the domain free of UI copy.
 */
import type { MessageKey } from "@/locales/en";
import type { Permission, Role } from "@/lib/access";
import type {
  AlertKind,
  AlertSeverity,
  Channel,
  DeliveryStatus,
  MessageTemplate,
} from "@/lib/notifications";

export const roleKey = (role: Role) => `role.${role}` as MessageKey;

export const roleDescriptionKey = (role: Role) =>
  `role.${role}.description` as MessageKey;

export const permissionKey = (permission: Permission) =>
  `permission.${permission}` as MessageKey;

export const alertKindKey = (kind: AlertKind) =>
  `notifications.kind.${kind}` as MessageKey;

export const severityKey = (severity: AlertSeverity) =>
  `notifications.severity.${severity}` as MessageKey;

export const channelKey = (channel: Channel) =>
  `notifications.channel.${channel}` as MessageKey;

export const deliveryKey = (status: DeliveryStatus) =>
  `notifications.delivery.${status}` as MessageKey;

export const templateKey = (template: MessageTemplate) =>
  `notifications.template.${template}` as MessageKey;

export const templateTimingKey = (template: MessageTemplate) =>
  `notifications.timing.${template}` as MessageKey;

/** `Date#getUTCDay()` index, 0 = Sunday. */
export const dayKey = (day: number) => `day.${day}` as MessageKey;
export const dayShortKey = (day: number) => `day.short.${day}` as MessageKey;
