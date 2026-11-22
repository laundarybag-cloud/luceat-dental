import type { MessageKey } from "./i18n";
/**
 * Roles and permissions.
 *
 * Medical records are the first surface in the app with a real access
 * boundary, so the matrix lives here rather than inside a component — Module
 * 12 (Users & Roles) will render and edit this same table.
 *
 * This is a UI-level boundary only. Until the backend enforces the same rules
 * on every request, it protects against the wrong screen being shown, not
 * against a determined user. The records screen says so rather than implying
 * clinical data is secured.
 */

export type Role =
  | "super_admin"
  | "clinic_owner"
  | "doctor"
  | "receptionist"
  | "accountant"
  | "ai_manager";

export type Permission =
  | "records.view"
  | "records.chart.edit"
  | "records.notes.add"
  | "records.diagnosis.confirm"
  | "records.documents.view"
  | "records.export"
  | "records.audit.view"
  | "billing.view"
  | "schedule.manage";

export const ROLE_META: Record<
  Role,
  { labelKey: MessageKey; descriptionKey: MessageKey; chip: string }
> = {
  super_admin: {
    labelKey: "role.super_admin",
    descriptionKey: "role.super_admin.desc2",
    chip: "bg-status-progress-bg text-status-progress",
  },
  clinic_owner: {
    labelKey: "role.clinic_owner",
    descriptionKey: "role.clinic_owner.description",
    chip: "bg-forest-50 text-forest-700",
  },
  doctor: {
    labelKey: "role.doctor",
    descriptionKey: "role.doctor.description",
    chip: "bg-status-checkedin-bg text-status-checkedin",
  },
  receptionist: {
    labelKey: "role.receptionist",
    descriptionKey: "role.receptionist.desc2",
    chip: "bg-status-pending-bg text-status-pending",
  },
  accountant: {
    labelKey: "role.accountant",
    descriptionKey: "role.accountant.desc2",
    chip: "bg-gold-100 text-gold-600",
  },
  ai_manager: {
    labelKey: "role.ai_manager",
    descriptionKey: "role.ai_manager.description",
    chip: "bg-status-noshow-bg text-status-noshow",
  },
};

const MATRIX: Record<Role, Permission[]> = {
  // Platform administration is not clinical authorship: a super admin can
  // see and audit a record but cannot chart findings, write clinical notes
  // or record a diagnosis. Only someone who examined the patient does that.
  super_admin: [
    "records.view",
    "records.documents.view",
    "records.export",
    "records.audit.view",
    "billing.view",
    "schedule.manage",
  ],
  clinic_owner: [
    "records.view",
    "records.chart.edit",
    "records.notes.add",
    "records.diagnosis.confirm",
    "records.documents.view",
    "records.export",
    "records.audit.view",
    "billing.view",
    "schedule.manage",
  ],
  doctor: [
    "records.view",
    "records.chart.edit",
    "records.notes.add",
    "records.diagnosis.confirm",
    "records.documents.view",
    "schedule.manage",
  ],
  receptionist: ["schedule.manage"],
  accountant: ["billing.view"],
  ai_manager: [],
};

export const can = (role: Role, permission: Permission) =>
  MATRIX[role].includes(permission);

export const permissionsFor = (role: Role) => MATRIX[role];

/** Every role, in the order Module 12 will list them. */
export const ROLES: Role[] = [
  "super_admin",
  "clinic_owner",
  "doctor",
  "receptionist",
  "accountant",
  "ai_manager",
];

export const ALL_PERMISSIONS: Permission[] = [
  "records.view",
  "records.chart.edit",
  "records.notes.add",
  "records.diagnosis.confirm",
  "records.documents.view",
  "records.export",
  "records.audit.view",
  "billing.view",
  "schedule.manage",
];

export const PERMISSION_LABEL: Record<Permission, string> = {
  "records.view": "View medical records",
  "records.chart.edit": "Record dental chart findings",
  "records.notes.add": "Write clinical notes",
  "records.diagnosis.confirm": "Confirm diagnoses",
  "records.documents.view": "View imaging and documents",
  "records.export": "Export records",
  "records.audit.view": "View the access log",
  "billing.view": "View billing",
  "schedule.manage": "Manage the appointment book",
};
