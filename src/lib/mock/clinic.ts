/**
 * Mock data layer.
 *
 * Nothing here touches a database — it is a stand-in shaped like the API the
 * backend will expose, so swapping in `fetch()` later means replacing the
 * bodies of these functions and nothing else. Every timestamp is UTC and
 * derived from REPORT_DATE so server and client render identically.
 */
import type {
  ActivityEntry,
  Appointment,
  Doctor,
  ServicePopularity,
} from "@/lib/types";
import { withArabic } from "./localize";
import { APPOINTMENT_SERVICE_AR, DOCTOR_AR } from "./content-ar";

/** The clinic day this dashboard reports on. */
export const REPORT_DATE = "2026-11-20"; // Friday

const at = (time: string) => `${REPORT_DATE}T${time}:00.000Z`;

const DOCTORS_EN: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Amelia Hart",
    specialty: "Prosthodontics",
    avatar: "/images/doctors/amelia-hart.jpg",
    room: "Operatory 1",
    completed: 184,
    utilisation: 92,
    rating: 4.9,
    online: true,
  },
  {
    id: "d2",
    name: "Dr. Omar Khalid",
    specialty: "Oral Surgery",
    avatar: "/images/doctors/omar-khalid.jpg",
    room: "Operatory 3",
    completed: 166,
    utilisation: 88,
    rating: 4.8,
    online: true,
  },
  {
    id: "d3",
    name: "Dr. Lena Moreau",
    specialty: "Orthodontics",
    avatar: "/images/doctors/lena-moreau.jpg",
    room: "Operatory 2",
    completed: 151,
    utilisation: 81,
    rating: 4.9,
    online: true,
  },
  {
    id: "d4",
    name: "Dr. Samuel Reed",
    specialty: "Endodontics",
    avatar: "/images/doctors/samuel-reed.jpg",
    room: "Operatory 4",
    completed: 139,
    utilisation: 76,
    rating: 4.7,
    online: false,
  },
  {
    id: "d5",
    name: "Dr. Yasmin Haddad",
    specialty: "Paediatric Dentistry",
    avatar: "/images/doctors/yasmin-haddad.jpg",
    room: "Operatory 5",
    completed: 128,
    utilisation: 74,
    rating: 4.8,
    online: true,
  },
  {
    id: "d6",
    name: "Dr. David Chen",
    specialty: "Periodontics",
    avatar: "/images/doctors/david-chen.jpg",
    room: "Operatory 6",
    completed: 117,
    utilisation: 69,
    rating: 4.6,
    online: false,
  },
];

/**
 * Specialty and operatory resolve against the active language when read,
 * so the day view, the booking form and the clinician cards all follow the
 * interface. The clinicians' names are not translated.
 */
export const doctors: Doctor[] = withArabic(DOCTORS_EN, DOCTOR_AR);

export const doctorById = (id: string) => doctors.find((d) => d.id === id);

const APPOINTMENTS_EN: Appointment[] = [
  {
    id: "a1",
    patient: { id: "p1", name: "Clara Whitfield", avatar: "/images/patients/p01.jpg", age: 34, phone: "+1 415 221 0184" },
    doctorId: "d1",
    service: "Crown fitting",
    start: at("08:30"),
    durationMin: 45,
    status: "completed",
  },
  {
    id: "a2",
    patient: { id: "p2", name: "Daniel Okafor", avatar: "/images/patients/p02.jpg", age: 41, phone: "+1 415 884 2291" },
    doctorId: "d2",
    service: "Wisdom tooth extraction",
    start: at("09:15"),
    durationMin: 60,
    status: "completed",
  },
  {
    id: "a3",
    patient: { id: "p3", name: "Ingrid Larsen", avatar: "/images/patients/p03.jpg", age: 28, phone: "+1 628 110 7745" },
    doctorId: "d3",
    service: "Aligner review",
    start: at("10:00"),
    durationMin: 30,
    status: "in_progress",
  },
  {
    id: "a4",
    patient: { id: "p4", name: "Marco Bianchi", avatar: "/images/patients/p04.jpg", age: 52, phone: "+1 510 442 9930" },
    doctorId: "d4",
    service: "Root canal — session 2",
    start: at("10:30"),
    durationMin: 75,
    status: "checked_in",
  },
  {
    id: "a5",
    patient: { id: "p5", name: "Priya Raman", avatar: "/images/patients/p05.jpg", age: 31, phone: "+1 415 663 8812" },
    doctorId: "d1",
    service: "Composite veneers consult",
    start: at("11:00"),
    durationMin: 30,
    status: "confirmed",
    isNewPatient: true,
  },
  {
    id: "a6",
    patient: { id: "p6", name: "Thomas Alvarez", avatar: "/images/patients/p06.jpg", age: 45, phone: "+1 415 902 1176" },
    doctorId: "d5",
    service: "Paediatric check-up",
    start: at("11:30"),
    durationMin: 30,
    status: "confirmed",
  },
  {
    id: "a7",
    patient: { id: "p7", name: "Hannah Voss", avatar: "/images/patients/p07.jpg", age: 26, phone: "+1 628 337 4420" },
    doctorId: "d3",
    service: "Retainer scan",
    start: at("13:00"),
    durationMin: 30,
    status: "confirmed",
  },
  {
    id: "a8",
    patient: { id: "p8", name: "Jonas Pettersen", avatar: "/images/patients/p08.jpg", age: 38, phone: "+1 415 220 5563" },
    doctorId: "d2",
    service: "Implant placement",
    start: at("13:45"),
    durationMin: 90,
    status: "pending",
  },
  {
    id: "a9",
    patient: { id: "p9", name: "Rosa Delgado", avatar: "/images/patients/p01.jpg", age: 47, phone: "+1 510 771 3308" },
    doctorId: "d6",
    service: "Deep cleaning",
    start: at("15:00"),
    durationMin: 60,
    status: "confirmed",
  },
  {
    id: "a10",
    patient: { id: "p10", name: "Felix Brandt", avatar: "/images/patients/p04.jpg", age: 59, phone: "+1 415 448 1902" },
    doctorId: "d4",
    service: "Post-op review",
    start: at("16:00"),
    durationMin: 20,
    status: "cancelled",
  },
];

/** Treatment labels follow the active language; see ./localize.ts. */
export const appointments: Appointment[] = withArabic(
  APPOINTMENTS_EN,
  Object.fromEntries(
    APPOINTMENTS_EN.map((a) => [
      a.id,
      { service: APPOINTMENT_SERVICE_AR[a.service] },
    ])
  )
);

export const upcomingAppointments = appointments.filter((a) =>
  ["confirmed", "pending", "checked_in"].includes(a.status)
);

export const activity: ActivityEntry[] = [
  {
    id: "e1",
    kind: "ai",
    actor: "Luceat Assistant",
    summary: "booked an appointment for Priya Raman",
    detail: "Composite veneers consult · 11:00 with Dr. Hart",
    at: at("09:48"),
  },
  {
    id: "e2",
    kind: "paid",
    actor: "Daniel Okafor",
    avatar: "/images/patients/p02.jpg",
    summary: "paid invoice #INV-2291",
    detail: "$1,240.00 · Visa ending 4417",
    at: at("09:31"),
  },
  {
    id: "e3",
    kind: "record",
    actor: "Dr. Amelia Hart",
    avatar: "/images/doctors/amelia-hart.jpg",
    summary: "added a clinical note for Clara Whitfield",
    detail: "Crown seated, occlusion checked",
    at: at("09:22"),
  },
  {
    id: "e4",
    kind: "cancelled",
    actor: "Felix Brandt",
    avatar: "/images/patients/p04.jpg",
    summary: "cancelled a 16:00 post-op review",
    detail: "Reason given: travelling",
    at: at("08:55"),
  },
  {
    id: "e5",
    kind: "booked",
    actor: "Reception",
    summary: "rescheduled Jonas Pettersen",
    detail: "Implant placement moved to 13:45",
    at: at("08:40"),
  },
];


export const services: ServicePopularity[] = [
  {
    id: "s1",
    name: "Routine check-up & clean",
    image: "/images/services/checkup.jpg",
    bookings: 412,
    revenue: 49440,
    share: 31,
    trend: 4.2,
  },
  {
    id: "s2",
    name: "Teeth whitening",
    image: "/images/services/whitening.jpg",
    bookings: 236,
    revenue: 70800,
    share: 18,
    trend: 11.7,
  },
  {
    id: "s3",
    name: "Digital imaging & X-ray",
    image: "/images/services/imaging.jpg",
    bookings: 198,
    revenue: 23760,
    share: 15,
    trend: -2.4,
  },
  {
    id: "s4",
    name: "Periodontal therapy",
    image: "/images/services/hygiene.jpg",
    bookings: 141,
    revenue: 38070,
    share: 11,
    trend: 6.1,
  },
];

/** Revenue and appointment volume, last 12 months. */
export const revenueSeries = [
  { month: "Dec", revenue: 182400, target: 180000, appointments: 611 },
  { month: "Jan", revenue: 168900, target: 185000, appointments: 574 },
  { month: "Feb", revenue: 191200, target: 185000, appointments: 638 },
  { month: "Mar", revenue: 204800, target: 195000, appointments: 672 },
  { month: "Apr", revenue: 198300, target: 195000, appointments: 659 },
  { month: "May", revenue: 221500, target: 205000, appointments: 714 },
  { month: "Jun", revenue: 214700, target: 205000, appointments: 701 },
  { month: "Jul", revenue: 232900, target: 215000, appointments: 748 },
  { month: "Aug", revenue: 226100, target: 215000, appointments: 733 },
  { month: "Sep", revenue: 248600, target: 225000, appointments: 791 },
  { month: "Oct", revenue: 261300, target: 235000, appointments: 824 },
  { month: "Nov", revenue: 243800, target: 245000, appointments: 788 },
];

/** Appointment outcomes by weekday, current week. */
export const weekdaySeries = [
  { day: "Mon", completed: 38, cancelled: 4, noShow: 2 },
  { day: "Tue", completed: 42, cancelled: 3, noShow: 1 },
  { day: "Wed", completed: 45, cancelled: 5, noShow: 3 },
  { day: "Thu", completed: 41, cancelled: 2, noShow: 2 },
  { day: "Fri", completed: 36, cancelled: 6, noShow: 1 },
  { day: "Sat", completed: 28, cancelled: 3, noShow: 2 },
  { day: "Sun", completed: 0, cancelled: 0, noShow: 0 },
];

