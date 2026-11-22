"use client";

import * as React from "react";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { weekAppointments } from "@/lib/mock/schedule";
import { findAvailabilityProblem, findConflict, findHoursProblem } from "@/lib/schedule";
import { doctorProfileById } from "@/lib/mock/doctors";
import { useI18n } from "@/components/i18n/locale-context";

/**
 * In-memory appointment book.
 *
 * NOTE: this is session state only. Nothing is persisted and no request is
 * made — a reload restores the fixture. Every mutation returns a result the
 * caller must handle, so the UI can never report a save that did not happen.
 */

export type MutationResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; error: string };

export interface Draft {
  id?: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  start: string;
  durationMin: number;
  notes?: string;
  status?: AppointmentStatus;
}

interface Store {
  appointments: Appointment[];
  save: (draft: Draft) => MutationResult;
  setStatus: (id: string, status: AppointmentStatus) => MutationResult;
  reschedule: (id: string, start: string, doctorId?: string) => MutationResult;
  restore: (appointment: Appointment) => void;
}

const Ctx = React.createContext<Store | null>(null);

export function useAppointments() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAppointments must be used inside the provider");
  return ctx;
}

export function AppointmentsProvider({
  children,
  patients,
  services,
}: {
  children: React.ReactNode;
  patients: { id: string; name: string; avatar: string; age: number; phone: string }[];
  services: { id: string; name: string; durationMin: number }[];
}) {
  const { t } = useI18n();
  const [appointments, setAppointments] =
    React.useState<Appointment[]>(weekAppointments);

  const validate = React.useCallback(
    (
      list: Appointment[],
      candidate: { id?: string; doctorId: string; start: string; durationMin: number }
    ): string | null => {
      const hours = findHoursProblem(candidate);
      if (hours) return hours.reason;

      // The clinician's own rota: working days, hours and break.
      const doctor = doctorProfileById(candidate.doctorId);
      if (doctor && doctor.status !== "active") {
        return `${doctor.name} is ${doctor.status === "leave" ? "on leave" : "inactive"} and is not taking bookings.`;
      }
      const rota = findAvailabilityProblem(
        doctor?.schedule,
        doctor?.name ?? "This clinician",
        candidate
      );
      if (rota) return rota.reason;

      const clash = findConflict(list, candidate);
      if (clash) return clash.reason;
      return null;
    },
    []
  );

  const save = React.useCallback<Store["save"]>(
    (draft) => {
      const service = services.find((s) => s.id === draft.serviceId);
      const patient = patients.find((p) => p.id === draft.patientId);
      if (!service) return { ok: false, error: t("v.pickService") };
      if (!patient) return { ok: false, error: t("v.pickPatient") };

      const candidate = {
        id: draft.id,
        doctorId: draft.doctorId,
        start: draft.start,
        durationMin: draft.durationMin || service.durationMin,
      };
      const error = validate(appointments, candidate);
      if (error) return { ok: false, error };

      const next: Appointment = {
        id: draft.id ?? `ap-new-${Date.now()}`,
        patient,
        doctorId: draft.doctorId,
        service: service.name,
        serviceId: service.id,
        start: draft.start,
        durationMin: candidate.durationMin,
        status: draft.status ?? "pending",
        notes: draft.notes,
      };

      setAppointments((all) => {
        const without = draft.id ? all.filter((a) => a.id !== draft.id) : all;
        return [...without, next].sort((a, b) => a.start.localeCompare(b.start));
      });

      return { ok: true, appointment: next };
    },
    [appointments, patients, services, validate, t]
  );

  const setStatus = React.useCallback<Store["setStatus"]>(
    (id, status) => {
      const current = appointments.find((a) => a.id === id);
      if (!current) return { ok: false, error: t("v.apptNotFound") };

      // Re-activating a cancelled slot must re-check the chair.
      if (current.status === "cancelled" && status !== "cancelled") {
        const error = validate(appointments, { ...current, id });
        if (error) return { ok: false, error };
      }

      const next = { ...current, status };
      setAppointments((all) => all.map((a) => (a.id === id ? next : a)));
      return { ok: true, appointment: next };
    },
    [appointments, validate, t]
  );

  const reschedule = React.useCallback<Store["reschedule"]>(
    (id, start, doctorId) => {
      const current = appointments.find((a) => a.id === id);
      if (!current) return { ok: false, error: t("v.apptNotFound") };

      const candidate = {
        id,
        doctorId: doctorId ?? current.doctorId,
        start,
        durationMin: current.durationMin,
      };
      const error = validate(appointments, candidate);
      if (error) return { ok: false, error };

      const next: Appointment = {
        ...current,
        start,
        doctorId: candidate.doctorId,
        status: current.status === "cancelled" ? "pending" : current.status,
      };
      setAppointments((all) =>
        all
          .map((a) => (a.id === id ? next : a))
          .sort((x, y) => x.start.localeCompare(y.start))
      );
      return { ok: true, appointment: next };
    },
    [appointments, validate, t]
  );

  const restore = React.useCallback<Store["restore"]>((appointment) => {
    setAppointments((all) =>
      all
        .map((a) => (a.id === appointment.id ? appointment : a))
        .sort((x, y) => x.start.localeCompare(y.start))
    );
  }, []);

  const value = React.useMemo(
    () => ({ appointments, save, setStatus, reschedule, restore }),
    [appointments, save, setStatus, reschedule, restore]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
