import { notFound } from "next/navigation";
import {
  appointmentsForPatient,
  patientById,
  patientRecords,
} from "@/lib/mock/patients";
import { recordFor } from "@/lib/mock/records";
import { RecordWorkspace } from "@/components/records/record-workspace";

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
      ? `${patient.name} — Medical record`
      : "Medical record — Luceat Dental",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = patientById(id);
  const record = recordFor(id);
  if (!patient || !record) notFound();

  return (
    <RecordWorkspace
      patient={patient}
      record={record}
      appointments={appointmentsForPatient(id)}
    />
  );
}
