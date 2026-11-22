import { notFound } from "next/navigation";
import { planById, planIndex } from "@/lib/mock/treatment-plans";
import { PlanDetail } from "@/components/treatment-plans/plan-detail";

export function generateStaticParams() {
  return planIndex.map((e) => ({ id: e.plan.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = planById(id);
  return {
    title: entry
      ? `${entry.plan.title} — ${entry.patient.name}`
      : "Treatment plan — Luceat Dental",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = planById(id);
  if (!entry) notFound();

  return <PlanDetail plan={entry.plan} patient={entry.patient} />;
}
