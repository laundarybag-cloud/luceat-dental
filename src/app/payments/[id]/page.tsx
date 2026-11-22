import { notFound } from "next/navigation";
import { invoiceById, invoices } from "@/lib/mock/billing";
import { InvoiceDetail } from "@/components/payments/invoice-detail";

export function generateStaticParams() {
  return invoices.map((i) => ({ id: i.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = invoiceById(id);
  return {
    title: invoice
      ? `${invoice.number} — ${invoice.patientName}`
      : "Invoice — Luceat Dental",
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = invoiceById(id);
  if (!invoice) notFound();
  return <InvoiceDetail invoice={invoice} />;
}
