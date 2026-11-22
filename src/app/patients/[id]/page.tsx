import { notFound } from "next/navigation";
import {
  appointmentsForPatient,
  patientById,
  patientRecords,
} from "@/lib/mock/patients";
import { PatientProfile } from "@/components/patients/patient-profile";

export function generateStaticParams() {
  return patientRecords.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = patientById(id);
  return {
    title: patient
      ? `${patient.name} — Luceat Dental`
      : "Patient — Luceat Dental",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = patientById(id);
  if (!patient) notFound();

  return (
    <PatientProfile
      patient={patient}
      appointments={appointmentsForPatient(id)}
    />
  );
}
