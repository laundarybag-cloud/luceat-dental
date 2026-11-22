export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  room: string;
  /** Appointments completed in the current reporting period. */
  completed: number;
  utilisation: number;
  rating: number;
  online: boolean;
}

export interface Patient {
  id: string;
  name: string;
  avatar: string;
  age: number;
  phone: string;
}

export interface Appointment {
  id: string;
  patient: Patient;
  doctorId: string;
  /** Display name, denormalised so lists need no second lookup. */
  service: string;
  serviceId?: string;
  start: string; // ISO, UTC
  durationMin: number;
  status: AppointmentStatus;
  isNewPatient?: boolean;
  notes?: string;
}

export interface ActivityEntry {
  id: string;
  kind: "booked" | "paid" | "record" | "cancelled" | "ai";
  actor: string;
  avatar?: string;
  summary: string;
  detail?: string;
  at: string; // ISO
}


export interface ServicePopularity {
  id: string;
  name: string;
  image: string;
  bookings: number;
  revenue: number;
  share: number;
  trend: number;
}
