import { notFound } from "next/navigation";
import { doctorProfileById, doctorProfiles } from "@/lib/mock/doctors";
import { weekAppointments } from "@/lib/mock/schedule";
import { DoctorProfileView } from "@/components/doctors/doctor-profile";

export function generateStaticParams() {
  return doctorProfiles.map((d) => ({ id: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = doctorProfileById(id);
  return {
    title: doctor ? `${doctor.name} — Luceat Dental` : "Doctor — Luceat Dental",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doctor = doctorProfileById(id);
  if (!doctor) notFound();

  return (
    <DoctorProfileView
      doctor={doctor}
      appointments={weekAppointments
        .filter((a) => a.doctorId === id)
        .sort((a, b) => a.start.localeCompare(b.start))}
    />
  );
}
