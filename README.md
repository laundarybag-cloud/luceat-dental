# Luceat Dental — Clinic Suite

A practice-management front end for a dental clinic, built as a working
demonstration: scheduling, the patient register, clinical records, treatment
plans, billing, a knowledge base and an AI assistant console, across fourteen
modules.

**Fully bilingual — English and Arabic, with correct right-to-left layout.**

> No backend is connected. Every figure on screen is derived from one set of
> fixtures, and anything that would need a server says so plainly instead of
> pretending to save.

---

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

```bash
npm run build && npm start   # production build
npx tsc --noEmit             # typecheck
npx next lint --dir src      # lint
```

Requires Node 20 or newer.

## What is in it

| Module | What it does |
| --- | --- |
| Overview | Clinic-wide KPIs, today's chair-side schedule, revenue and outcome charts, derived alerts |
| Appointments | Day, week and month views; booking with conflict and rota checks |
| Patients | Register, full profile, dental chart, history, documents, notes |
| Doctors | Directory, profiles, working rotas, service assignments |
| Services | Catalogue with pricing, duration and clinician coverage |
| Medical Records | Clinical notes, diagnoses, imaging, access log, role-gated |
| Treatment Plans | Multi-session sequencing with costs and scheduling |
| Payments | Invoices derived from delivered treatment, payments, refunds, revenue analysis |
| Knowledge Centre | Articles the patient assistant may answer from, with clinical approval |
| AI Assistant | Conversation review, outcomes, safety rules, knowledge coverage |
| Reports | Revenue, appointments, clinicians, services, patients, assistant |
| Users | Team accounts, roles, permission matrix, access history |
| Settings | Clinic hours, booking rules, identity, notifications |
| Notifications | Derived alert feed, delivery log and rules |

## How it is put together

**One source of truth.** Invoices are derived from completed appointments and
delivered treatment-plan sessions rather than stored separately; a service's
assigned clinicians are derived from the doctor profiles; the dashboard,
reports and alerts all read the same fixtures. Two screens cannot disagree,
because there is only one number.

**Honest about its limits.** Where an action would need a server — saving a
clinical note, emailing an invoice, creating a staff account — the form still
validates, and then says clearly that nothing was stored. The one export that
is real (Reports → CSV) says so too.

**Permissions are a UI concern, and say so.** The role switcher changes what
the interface shows. The records screen states in as many words that this is
not a security boundary until a backend enforces the same rules.

## Bilingual support

Switch language from the globe in the top bar. The choice is remembered and
sets direction, typography and formatting together.

- **Interface copy** lives in `src/locales/`. `en.ts` is the source of truth
  and `ar.ts` is typed against it, so adding an English string without its
  Arabic pair is a **compile error** — both languages stay complete by
  construction, not by discipline.
- **Clinic content** — service names, treatment labels, specialties, plan
  titles — lives with the data in `src/lib/mock/content-ar.ts`, because in a
  connected build that text comes from the API, which is where a clinic edits
  its own catalogue.
- Dates, numbers and currency follow the active language through `Intl`.
  Arabic uses `ar-EG` with **Latin digits**: this is a panel full of tabular
  money and times, and mixing numeral systems down a column makes totals hard
  to compare. That is standard in medical and financial software in Egypt.
- Direction is not separately settable — it follows the language.

People's names are not translated. A record stores a name once and shows it as
given.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Recharts · Radix primitives

`DEVELOPMENT_PROGRESS.md` records the design decisions and the trade-offs
behind them, including the ones still outstanding.
