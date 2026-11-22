import type { MessageKey } from "../i18n";
/**
 * Staff accounts and the access history.
 *
 * Clinicians are not duplicated here: a user account that belongs to a
 * clinician carries their doctor id, and the name, photo and branch are read
 * from the doctor profile. Only non-clinical staff are defined outright.
 */
import type { Role } from "@/lib/access";
import { doctorProfiles } from "./doctors";
import { TODAY } from "./schedule";

export type UserStatus = "active" | "invited" | "suspended";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  status: UserStatus;
  branch: string;
  /** Set when this account belongs to a clinician. */
  doctorId?: string;
  lastActive?: string;
  twoFactor: boolean;
  createdOn: string;
}

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** The owner account this build signs in as. */
const OWNER: StaffUser = {
  id: "u-owner",
  name: "Dr. Mariam El-Nephely",
  email: "mariam@luceatdental.com",
  avatar: "/images/doctor-avatar.jpg",
  role: "clinic_owner",
  status: "active",
  branch: "Harbour Street",
  lastActive: TODAY,
  twoFactor: true,
  createdOn: "2017-02-01",
};

const NON_CLINICAL: StaffUser[] = [
  {
    id: "u-recep-1",
    name: "Hana Bergström",
    email: "hana.bergstrom@luceatdental.com",
    role: "receptionist",
    status: "active",
    branch: "Harbour Street",
    lastActive: TODAY,
    twoFactor: true,
    createdOn: "2022-08-15",
  },
  {
    id: "u-recep-2",
    name: "Tomás Ferreira",
    email: "tomas.ferreira@luceatdental.com",
    role: "receptionist",
    status: "active",
    branch: "Lindendal Clinic",
    lastActive: shiftDate(TODAY, -1),
    twoFactor: false,
    createdOn: "2024-03-04",
  },
  {
    id: "u-acct-1",
    name: "Priyanka Nair",
    email: "priyanka.nair@luceatdental.com",
    role: "accountant",
    status: "active",
    branch: "Harbour Street",
    lastActive: shiftDate(TODAY, -3),
    twoFactor: true,
    createdOn: "2021-11-22",
  },
  {
    id: "u-ai-1",
    name: "Joachim Weiss",
    email: "joachim.weiss@luceatdental.com",
    role: "ai_manager",
    status: "active",
    branch: "Harbour Street",
    lastActive: shiftDate(TODAY, -2),
    twoFactor: true,
    createdOn: "2025-06-09",
  },
  {
    id: "u-admin-1",
    name: "Ingrid Solberg",
    email: "ingrid.solberg@luceat.io",
    role: "super_admin",
    status: "active",
    branch: "Platform",
    lastActive: shiftDate(TODAY, -9),
    twoFactor: true,
    createdOn: "2017-01-12",
  },
  {
    id: "u-recep-3",
    name: "Dale Okonkwo",
    email: "dale.okonkwo@luceatdental.com",
    role: "receptionist",
    status: "invited",
    branch: "Lindendal Clinic",
    twoFactor: false,
    createdOn: shiftDate(TODAY, -4),
  },
  {
    id: "u-acct-2",
    name: "Marco Lenz",
    email: "marco.lenz@luceatdental.com",
    role: "accountant",
    status: "suspended",
    branch: "Harbour Street",
    lastActive: shiftDate(TODAY, -142),
    twoFactor: false,
    createdOn: "2020-05-18",
  },
];

const CLINICIAN_USERS: StaffUser[] = doctorProfiles.map((d, i) => ({
  id: `u-${d.id}`,
  name: d.name,
  email: d.email,
  avatar: d.avatar,
  role: "doctor" as Role,
  // A clinician on leave keeps an active account; an inactive clinician does
  // not, so the two states cannot drift apart.
  status: d.status === "inactive" ? "suspended" : "active",
  branch: d.branch,
  doctorId: d.id,
  lastActive:
    d.status === "active" ? shiftDate(TODAY, -(i % 3)) : shiftDate(TODAY, -21),
  twoFactor: i % 4 !== 0,
  createdOn: d.joined,
}));

export const staffUsers: StaffUser[] = [
  OWNER,
  ...CLINICIAN_USERS,
  ...NON_CLINICAL,
];

export const USER_STATUS_META: Record<
  UserStatus,
  { labelKey: MessageKey; chip: string }
> = {
  active: {
    labelKey: "userStatus.active",
    chip: "bg-status-confirmed-bg text-status-confirmed",
  },
  invited: {
    labelKey: "userStatus.invited",
    chip: "bg-status-checkedin-bg text-status-checkedin",
  },
  suspended: {
    labelKey: "userStatus.suspended",
    chip: "bg-status-noshow-bg text-status-noshow",
  },
};

/* --------------------------------------------------------- access history */

export type HistoryKind =
  | "sign_in"
  | "sign_in_failed"
  | "role_changed"
  | "permission_changed"
  | "user_invited"
  | "user_suspended"
  | "record_opened";

export interface HistoryEntry {
  id: string;
  at: string;
  time: string;
  actor: string;
  kind: HistoryKind;
  detail: string;
  ip?: string;
}

export const accessHistory: HistoryEntry[] = [
  {
    id: "h1",
    at: TODAY,
    time: "09:42",
    actor: "Dr. Mariam El-Nephely",
    kind: "sign_in",
    detail: "Signed in from San Francisco, CA",
    ip: "198.51.100.24",
  },
  {
    id: "h2",
    at: TODAY,
    time: "09:18",
    actor: "Hana Bergström",
    kind: "sign_in",
    detail: "Signed in from San Francisco, CA",
    ip: "198.51.100.31",
  },
  {
    id: "h3",
    at: TODAY,
    time: "08:55",
    actor: "Dr. Amelia Hart",
    kind: "record_opened",
    detail: "Opened the medical record for LD-4100",
    ip: "198.51.100.17",
  },
  {
    id: "h4",
    at: shiftDate(TODAY, -1),
    time: "16:20",
    actor: "Dr. Mariam El-Nephely",
    kind: "permission_changed",
    detail: "Removed “Export records” from Doctor",
  },
  {
    id: "h5",
    at: shiftDate(TODAY, -1),
    time: "11:07",
    actor: "Tomás Ferreira",
    kind: "sign_in_failed",
    detail: "Three failed attempts, then a successful sign-in",
    ip: "203.0.113.76",
  },
  {
    id: "h6",
    at: shiftDate(TODAY, -4),
    time: "14:02",
    actor: "Dr. Mariam El-Nephely",
    kind: "user_invited",
    detail: "Invited dale.okonkwo@luceatdental.com as Receptionist",
  },
  {
    id: "h7",
    at: shiftDate(TODAY, -12),
    time: "10:35",
    actor: "Ingrid Solberg",
    kind: "role_changed",
    detail: "Changed Priyanka Nair from Receptionist to Accountant",
  },
  {
    id: "h8",
    at: shiftDate(TODAY, -142),
    time: "17:44",
    actor: "Dr. Mariam El-Nephely",
    kind: "user_suspended",
    detail: "Suspended Marco Lenz — left the practice",
  },
];
