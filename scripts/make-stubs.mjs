// Generates honest "not built yet" route stubs for every nav destination that
// has no module implementation, so navigation never dead-ends in a 404.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const modules = [
  ["appointments", "MODULE 04", "Appointments", "Day, week and month scheduling with conflict-free slot booking.", ["Daily / weekly / monthly calendar", "Doctor and service filters", "Appointment detail drawer", "Create, reschedule, cancel", "Slot conflict prevention", "Seven appointment statuses"]],
  ["patients", "MODULE 03", "Patients", "Searchable patient register with a tabbed clinical profile.", ["Filterable patient table", "Overview and medical history", "Dental chart", "Treatment plans", "Documents and X-rays", "Payments and notes"]],
  ["doctors", "MODULE 02", "Doctors", "Clinician directory, schedules and service assignments.", ["Profile cards and table view", "Qualifications and specialties", "Working schedule editor", "Service assignments", "Branch assignment", "Appointment statistics"]],
  ["services", "MODULE 05", "Services", "The treatment catalogue patients and the assistant both read from.", ["Service cards with imagery", "Categories and pricing", "Duration configuration", "Doctor assignment", "Active / inactive state", "Create, edit, delete"]],
  ["medical-records", "MODULE 06", "Medical Records", "Protected clinical record with an interactive dental chart.", ["Diagnoses and allergies", "Current medications", "Per-tooth dental chart", "Clinical notes", "X-ray and document upload", "Role-based access control"]],
  ["treatment-plans", "MODULE 07", "Treatment Plans", "Multi-session treatment planning with a progress timeline.", ["Plan overview and costing", "Procedure breakdown", "Session progress timeline", "Completed vs remaining", "Treatment notes", "Patient-facing summary"]],
  ["payments", "MODULE 08", "Payments & Invoices", "Revenue, invoicing and reconciliation for the practice.", ["Revenue overview", "Outstanding balances", "Invoice listing", "Payment methods", "Discounts and refunds", "Financial analytics"]],
  ["knowledge", "MODULE 09", "AI Knowledge Center", "The approved source of truth the patient assistant answers from.", ["Article editor and versioning", "Nine content categories", "Draft / review / publish flow", "Attachments and tags", "English and Arabic content", "Clinical approval gate"]],
  ["ai-assistant", "MODULE 10", "AI Assistant", "Oversight of every patient conversation the assistant handles.", ["Conversation inbox", "Knowledge sources cited", "Unanswered question queue", "Booking conversion metrics", "Human handoff and escalation", "Safety configuration"]],
  ["notifications", "MODULE 11", "Notifications", "Reminders, confirmations and delivery tracking.", ["Notification centre", "Reminder templates", "Booking confirmations", "Cancellation notices", "Follow-up reminders", "Delivery status log"]],
  ["users", "MODULE 12", "User Management", "Staff accounts, roles and the permission matrix.", ["User listing and invites", "Six clinic roles", "Permission matrix", "Activate / deactivate", "Role assignment", "Access history"]],
  ["reports", "MODULE 13", "Reports & Analytics", "Exportable reporting across clinical and financial activity.", ["Revenue reports", "Appointment and no-show rates", "Patient growth", "Doctor performance", "Service popularity", "CSV and PDF export"]],
  ["settings", "MODULE 14", "Settings", "Clinic configuration, policies and branding.", ["Clinic profile and branding", "Working hours and branches", "Booking and cancellation policy", "Payment settings", "Language and RTL", "Security and AI configuration"]],
];

for (const [slug, module, title, summary, scope] of modules) {
  const dir = `src/app/${slug}`;
  const file = `${dir}/page.tsx`;
  if (existsSync(file)) continue;
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    file,
    `import { ModulePlaceholder } from "@/components/shell/module-placeholder";

export const metadata = { title: "${title} — Luceat Dental" };

export default function Page() {
  return (
    <ModulePlaceholder
      module="${module}"
      title="${title}"
      summary="${summary}"
      scope={${JSON.stringify(scope)}}
    />
  );
}
`
  );
  console.log("created", file);
}
