# Luceat Dental — development progress

Last updated: 2026-11-20

## Status

| | |
| --- | --- |
| Design system | **Done** (v1) |
| App shell (sidebar, top bar, command palette) | **Done** |
| Module 01 — Dashboard | **Done**, reviewed in-browser |
| Module 02 — Doctors | **Done**, reviewed in-browser |
| Module 03 — Patients | **Done**, reviewed in-browser |
| Module 04 — Appointments | **Done**, reviewed in-browser |
| Module 05 — Services | **Done**, reviewed in-browser |
| Module 06 — Medical Records | **Done**, reviewed in-browser |
| Module 07 — Treatment Plans | **Done**, reviewed in-browser |
| Module 08 — Payments & Invoices | **Done**, reviewed in-browser |
| Module 09 — AI Knowledge Center | **Done**, reviewed in-browser |
| Module 10 — AI Assistant Management | **Done**, reviewed in-browser |
| Module 12 — Users & Roles | **Done**, reviewed in-browser |
| Modules 11, 13, 14 | Not started — honest placeholder routes in place |

## Stack

Next.js 15.5.29 (App Router) · React 19 · TypeScript · Tailwind CSS v4
(CSS-first `@theme`) · Radix UI primitives · Recharts 2 · Lucide icons ·
`next/font` (Inter + Cairo).

shadcn/ui was **not** installed as a dependency. Its composition pattern is
followed — Radix primitives wrapped in local, fully-owned components under
`src/components/ui` — but every component is written against the Luceat tokens
rather than generic shadcn defaults, which is what the brief asked for.

## Design decisions

- **Tokens only.** Colour, type, radius, shadow and easing live in
  `src/app/globals.css` under `@theme`. Components reference token utilities
  (`text-ink-muted`, `rounded-card`), never raw hex. Changing the brand is a
  one-file edit.
- **Grey ramp is accessibility-driven.** `ink / soft / muted / faint` are tuned
  to 15.9 / 8.6 / 5.5 / 4.6 : 1 on white, so even 11px metadata clears WCAG AA.
  The first draft failed at 2.54:1 and was corrected after measuring the live
  DOM.
- **Restraint over decoration.** One shadow level for cards, a second only for
  overlays. No glassmorphism except the banner action, no gradients except the
  banner scrim and chart fills. Gold is reserved for revenue, ratings, the
  active nav marker and "new patient" — nowhere else.
- **Dense, small type.** Body is 14px, metadata 12px, the largest number on the
  page is 26px. Premium SaaS reads as quiet and information-dense, not large.
- **Logical properties everywhere** (`ps-*`, `-start-*`, `text-end`) so Arabic
  RTL is a `dir` flip rather than a second stylesheet.
- **Figures are bidi-isolated** (`[data-metric]`) so "4 / 6" and "$243.8k" do
  not reorder in RTL.

## Components built

`Button` (6 variants × 5 sizes) · `Card` / `CardHeader` / `CardTitle` /
`CardBody` / `CardFooter` / `Eyebrow` · `StatusBadge` (all 7 appointment
statuses) · `Badge` · `Avatar` (5 sizes, initials fallback, presence dot) ·
`AvatarStack` · `Tooltip` · `Menu` · `Tabs` · `Separator` · `Skeleton` ·
`EmptyState` · `Progress` · `LuceatMark` / `LuceatWordmark` ·
`CommandPalette` · `ModulePlaceholder` · `KpiCard` (with inline SVG sparkline) ·
`RevenueChart` · `AppointmentOutcomesChart` · dashboard panels.

## Module 01 — what is on the dashboard

Doctor welcome hero with Dr. Mariam El-Nephely's own photograph · 4 primary KPI tiles with
sparklines and period deltas · 4 secondary stats (completed, cancelled,
awaiting confirmation, chairs in use) · revenue vs. target area chart with a
6M/12M range toggle · stacked appointment-outcome bar chart · today's schedule
with live-row highlighting, filter and per-row action menu · attention-required
alerts · doctor performance with utilisation and ratings · popular services
with photography · activity timeline.

## Review pass — defects found in the running app and fixed

The dashboard was run, screenshotted and measured in the browser (DOM
inspection, not just eyeballing). Found and fixed:

1. **Lucide icon components passed server → client** — runtime error, page
   would not render. `KpiCard` now takes a `ReactNode`.
2. **tailwind-merge silently dropped classes.** It read the custom type scale
   (`text-small`, `text-section`, …) as *colour* utilities, so every element
   combining a named size with a colour lost one of them — the top bar's "New"
   button rendered with invisible text (1.22:1). Fixed by teaching
   `extendTailwindMerge` the font-size group. This was corrupting typography
   across the whole app, not just one button.
3. **Contrast failures:** secondary text 4.06:1 and metadata 2.54:1 against
   white. Grey ramp retuned; gold badge text moved to a new `gold-600`
   (3.3:1 → 5.1:1).
4. **Chart y-axis labels clipped** by the SVG surface ("$280k" cut to "|280k").
   Negative chart margins replaced with explicit axis width + tick margin.
5. **Banner photography invisible** at 0.28 opacity under a flat scrim — the
   brief's "real imagery" requirement was effectively unmet. Rebuilt as a
   directional scrim: opaque behind the copy, clearing to the photograph.
6. **Service bars were meaningless** (`share × 3`). Now scaled against the
   top service, with the bookings and trend columns given fixed widths so the
   right edge stops being ragged.
7. **RTL: sidebar pushed off-screen on desktop.** The `rtl:` variant outranks
   the `lg:` media query by specificity, so the off-canvas transform never
   released. Scoped to `max-lg:`.
8. Secondary stat tiles used a 70%-opacity surface — inconsistent white against
   the KPI row. Made solid.

## Hero review pass (doctor welcome section)

Built from the supplied photo at `public/images/doctor.jpg` (946×1600, converted
from the uploaded WebP) plus a face-cropped `doctor-avatar.jpg` (400×400) for the
sidebar and top bar. The shell account identity now reads Dr. Mariam El-Nephely.
Defects found in the browser and fixed:

- Arabic name `dir="rtl"` pushed the line to the far right, away from the
  heading it belongs to. Removed — bidi already orders the glyphs.
- `self-end` on the portrait threw it against the right edge once the hero
  stacked on mobile. Scoped to `md:self-end`; portrait now centres exactly.
- Figure-led strings ("18 of 36 appointments done") reordered under RTL;
  hero facts now carry `dir="auto"`.
- Dropped a redundant "On shift" chip — the status fact already says it.

## Verified

- Renders clean at 1440, 1280, tablet and 375px.
- No horizontal overflow at any width tested.
- Arabic RTL: sidebar, nav accents, breadcrumbs, chevrons and figures all flip
  correctly.
- `tsc --noEmit` clean; production build clean.
- Command palette: ⌘/Ctrl-K, live filtering, arrow-key navigation, routing,
  and a designed empty state.

## Known gaps

- **Recharts does not mirror in RTL** — the axis stays on the left. Acceptable
  for now; revisit when Arabic copy lands.
- Loading skeletons exist for the dashboard route only.
- No dark theme yet. Tokens are structured for it (one `@media` block), but it
  is unbuilt and untested — do not claim support.
- Mock data only. `src/lib/mock/clinic.ts` is shaped like the eventual API;
  nothing writes anywhere. No component pretends a save succeeded.
- Patient portraits are stock models — see `public/images/ASSETS.md`.

## Module 04 — Appointments

New primitives: `Dialog`, `Drawer` (inline-end side sheet), `Select`, `Field`,
`Input`, `Textarea`, `ToastProvider`/`useToast`.

Domain logic lives in `src/lib/schedule.ts` as pure functions with no React and
no data source, so the slot and conflict rules move to the server unchanged:
`findConflict`, `findHoursProblem`, `availableSlots`, plus UTC date helpers and
formatters. Clinic hours are Mon–Fri 08:00–18:00, Saturday 09:00–14:00, closed
Sunday; slots are 15 minutes.

`src/lib/mock/schedule.ts` generates ~300 appointments for the week of
16–22 Nov 2026 from a fixed seed (mulberry32), so server and client render the
same bytes. The generator calls the same `findConflict` the UI does, so the
fixture itself contains no double-bookings.

**Double-booking prevention** is enforced in one place: a chair is taken if any
*blocking* appointment for that doctor overlaps the window. Cancelled and
no-show slots free the chair again. The rule runs three times — live as you
type in the form (with the Book button disabled and free slots suggested),
on save in the store, and when reactivating a cancelled appointment.

Implemented: day view (one column per clinician, half-hour click-to-book
strips, now-line, lane-splitting for overlaps), week view, month view
(six-week grid, overflow "+N more", click a date to drop into the day),
filters (clinician, service, multi-select status, text search), detail drawer
with status progression / reschedule / cancel, create-and-edit dialog with
validation, toasts with undo, loading skeleton and two empty states.

### Review pass — defects found in the running app and fixed

1. **Week view was unusable.** Six clinicians on one time axis split into
   eight lanes of unreadable slivers. Rewritten: the whole-clinic week is now
   a per-day agenda of chips, and the hour-by-hour timeline appears when you
   filter to a single clinician — which is how practice software behaves. The
   toolbar says so rather than leaving the user to guess.
2. **Hour rail misaligned** — the 08:00 label was clipped off the top of the
   grid. Labels are now absolutely positioned on their own hour line.
3. **Patient names truncated away** in week chips: the doctor label consumed
   the row at ~130px. Month keeps a one-line chip with no doctor; the week got
   a two-line chip carrying time, patient, service and clinician.
4. **No feedback when a day has no gap.** A conflicting booking with no
   alternative showed an empty space. It now explains that the clinician has
   no gap that long and what to try instead.
5. **RTL bidi:** phone numbers rendered "4016 304 415 1+" and time ranges
   reversed to "08:20 – 08:00". Both isolated with `dir="ltr"`.
6. "Closed on Suns" — short weekday name pluralised. Now "Sundays".
7. Drawer footer: dropped `ms-auto` on Cancel so the wrap reads deliberate.

### Verified

Day, week and month at 1440, 1280 and 375; no horizontal page overflow
(calendars scroll inside their card). Conflict rejection exercised in the UI:
booking a 90-minute root canal with Dr. Hart at 09:00 is refused against her
08:45–10:15 implant, with the Book button disabled. Reschedule offers only
genuinely free starts. RTL drawer enters from the left. `tsc` clean, ESLint
clean, production build of all 18 routes clean.

## Module 03 — Patients

New shared primitive: `DataTable` — column-driven, sortable, paginated, with
per-column responsive hiding and a pluggable empty state. Modules 02, 05, 08
and 12 should use it rather than growing their own tables.

Two routes: `/patients` (register) and `/patients/[id]` (profile, statically
generated per patient). The profile carries all nine tabs the brief lists:
overview, medical history, appointments, dental chart, treatment plans,
prescriptions, documents & X-rays, payments and notes.

**Dental chart** (`src/lib/dental.ts` + `dental-chart.tsx`) uses FDI two-digit
notation (ISO 3950) across all 32 permanent teeth, arranged as maxilla and
mandible with a midline divider. Tooth glyphs differ by type — molars,
premolars and anteriors have distinct silhouettes — so the arch reads
anatomically. Eight conditions, each with a swatch, a legend count and a
description; selecting a tooth opens its record and lets a clinician chart a
finding. The chart is shared, ready for Module 06 to reuse.

`src/lib/mock/patients.ts` builds 20 full records from a fixed seed:
demographics, allergies with severity, conditions, medications, per-tooth
chart, treatment plans, prescriptions, documents, a billing ledger and
clinical notes.

### Review pass — defects found in the running app and fixed

1. **The register looked synthetic and a filter was unreachable.** Last visit
   was always taken from the one-week appointment book, so every patient
   showed 19 or 20 Nov, only two statuses ever appeared, and "Recall overdue"
   could never match — a filter option guaranteed to return nothing. Most
   patients now carry a longer history; only recent attenders are dated from
   the book. Four statuses now occur naturally, including overdue.
2. **Records contradicted themselves.** A patient marked inactive since
   July 2025 had treatment-plan steps completed in September 2026 and a stage
   booked for next week. Plan steps, ledger entries, documents, prescriptions
   and notes are now anchored to each patient's own last visit, and a lapsed
   patient's plan shows as stalled rather than progressing.
3. **Header counted alerts wrongly** — "0 clinical alerts" printed above a
   panel listing a current medication. The count now matches what the panel
   shows.
4. **Dental chart was undersized**, teeth too small to read and missing teeth
   barely distinguishable. Teeth enlarged, missing teeth drawn as dashed
   outlines with a slash.
5. Condition picker truncated "Treatment p…" — conditions gained a short
   label for tight controls while the legend keeps the full one.
6. A charted finding printed a raw ISO date among formatted ones.

### Verified

Register and profile at 1440 and 375 with no horizontal page overflow (the
table hides columns by breakpoint rather than scrolling the page). Charting a
finding updates the tooth, the legend counts and the record panel, and says
plainly that it is session-only. Sorting and pagination exercised. `tsc`
clean, ESLint clean, production build of all 38 routes clean (20 patient
pages prerendered).

## Module 02 — Doctors

`src/lib/mock/doctors.ts` holds six full clinician profiles: contact details,
registration number, qualifications, specialties, languages, branch, default
slot length, assigned services and a **week rota** (per-day start, end and
break).

### The rota is real, not decorative

This module's point was to make scheduling data mean something. The rota now
drives three things that previously assumed clinic-wide hours:

1. **The appointment fixture is generated from it.** Each clinician is only
   booked on their own working days, inside their own hours, never through
   their break, and only for services they are assigned. A clinician on leave
   generates no appointments at all.
2. **Booking validates against it.** `findAvailabilityProblem()` in
   `src/lib/schedule.ts` rejects a booking on a non-working day, outside the
   clinician's hours, or overlapping their break — and a clinician on leave is
   refused outright. The check runs live in the form, again in the store, and
   when listing reschedule slots.
3. **The day view shows it.** A clinician who is off that day, or on leave,
   gets a hatched column labelled with the reason instead of a silently empty
   one.

Directory: card grid and table view (toggle), search, status and branch
filters, both built on the shared `DataTable`. Profile: four tabs — overview,
working schedule, services, appointments — plus derived stats. The add/edit
form covers photo, identity, specialty, branch, default slot length, a
day-by-day rota editor and service assignment, with validation that blocks
a clinician with no working days or no services.

### Review pass — defects found in the running app and fixed

1. **A schedule summary that hid a day off.** Dr Khalid's card read
   "Mon–Fri 08:00–17:00" although he does not work Wednesdays — the range
   collapsed non-consecutive days. With the booking rules now enforcing the
   rota, the card would have contradicted the rejection the user got. Ranges
   only collapse genuinely consecutive days now.
2. **"Dr. Omar Khalid does not work Weds."** — short weekday name plus "s".
   Now uses the long form.
3. **A misleading follow-up.** Rejecting a Wednesday booking also showed
   "There is no 30 min gap left in that clinician's day", which was false —
   the day was not full, he was not working. Availability results now carry
   the reason kind and that hint only appears for a genuine clash.

### Verified

Rota enforcement exercised end to end: Wednesday 18 Nov shows Dr Khalid "Not
working today" and Dr Reed "On leave"; booking Dr Khalid on that Wednesday is
refused with the Book button disabled. Directory, profile and form at 1440 and
375 with no page overflow. `tsc` clean, ESLint clean, production build of all
44 routes clean (6 doctor pages prerendered).

## Module 05 — Services

`src/lib/mock/catalogue.ts` enriches the booking records in `schedule.ts`
(name, category, duration, price) with description, photography, active flag
and chair turnaround. **Clinician assignments are derived from the doctor
profiles, not stored twice** — the catalogue and the rota cannot disagree
about who provides what.

`isBookable()` is the module's spine: a service is bookable only when it is
active *and* at least one available clinician provides it. That drives the
card badges, the table status column, the "needs attention" tile, a dedicated
filter, and the appointment form, where services another clinician does not
provide — or that have been withdrawn — are now listed but disabled with the
reason.

Six new photographs were sourced and verified for the treatments that had
none (filling, root canal, crown, implant, aligner, paediatric), added to
`scripts/fetch-assets.sh` so the set stays reproducible. Two catalogue-only
services (IV sedation, night guard fitting) carry **no image on purpose** and
render a designed "No photograph yet" tile — an honest empty state rather than
a borrowed stock photo — and they exercise the unassigned and inactive cases.

Delete is a confirmation that leads with the consequence: it counts the
appointments already using the service, says deleting would leave them without
a treatment, and recommends marking it inactive instead.

### Review pass — defects found in the running app and fixed

1. **"Delete service" opened the edit dialog.** Radix portals its menu outside
   the table row, but React still bubbles the click through the component
   tree, so the row's own click handler fired behind the menu. Fixed once in
   the shared `DataTable`, which now ignores clicks whose target is not a real
   DOM descendant of the row. **The doctors table had the same latent bug** —
   "Edit schedule" would have navigated to the profile instead — and was fixed
   by the same change.
2. Unused import left after refactoring the catalogue header.

### Verified

Card and table views, category management, the create/edit form and the delete
confirmation all exercised in the browser; the delete dialog correctly reports
53 appointments against the routine check-up. Services page at 1440 and 375
with no page overflow. `tsc` clean, ESLint clean, production build of all 44
routes clean.

## Module 06 — Medical Records

Two instructions in the brief shaped this module: records must be protected
by role-based permissions, and AI output must never read as an approved
diagnosis.

### Access control

`src/lib/access.ts` holds six roles and a permission matrix — the same table
Module 12 will render and edit. `RoleProvider` exposes `can()` app-wide and a
`RoleSwitcher` stands in for the sign-in this build does not have yet; it is
labelled as a demonstration control, not a feature.

Gating is real rather than cosmetic: a receptionist sees an explanation of
what their role excludes instead of an empty page, a super admin can read and
audit a record but **cannot chart findings, write notes or record a
diagnosis** (platform administration is not clinical authorship), and the
workspace shows each role its own permission list. An `EnforcementNotice`
states plainly that this is a UI boundary until the backend enforces the same
rules — the screen never implies clinical data is secured.

### AI safety

Assistant output and diagnoses are **separate types**, not one list with a
flag. A `Diagnosis` carries an ICD-10 code, a status and a named clinician;
an `AssistantSuggestion` carries none of those — only what the patient said,
where it came from and a confidence signal. The panel sits apart from the
record, is tinted differently, is captioned "Not a diagnosis", and states
that only a clinician who has examined the patient can record one. Confirming
does not copy assistant text into the record: it opens a blank diagnosis
entry for the clinician to write themselves.

Seven tabs: diagnoses, dental chart (reusing Module 03's chart, now with a
working read-only mode), medical history, clinical notes, imaging and
documents, treatment history, and an access log showing who opened the record.

### Review pass — defects found in the running app and fixed

1. **The shell contradicted the gate.** Viewing as Receptionist, the sidebar
   still read "Clinic Owner" while the page refused access. The account block
   in the sidebar and top bar now reflects the active role.
2. **The read-only chart path was unreachable.** Every role that could view a
   record could also edit it, so the read-only mode could never be shown or
   tested. Fixed in the model rather than the view: super admin is now
   read-only for clinical authorship, which is also the safer posture.
3. **Dental chart pushed its detail panel off the page** in the narrower
   workspace column — a grid track with `min-width: auto` that could not
   shrink. Fixed in the shared chart, which fixes the patients module too.
4. **Horizontal page overflow on mobile** (809px at a 375px viewport): the
   seven-tab strip, as a grid child, sized to its widest content. Same
   root cause, fixed with `min-w-0`.

### Verified

Access gate exercised across roles: receptionist blocked with an explanation,
doctor able to chart, super admin read-only with the banner shown. Assistant
observations render as clearly non-clinical and their actions are disabled for
roles without `records.diagnosis.confirm`. Index and workspace at 1440 and 375
with no page overflow. `tsc` clean, ESLint clean, production build of all 64
routes clean (20 record pages prerendered).

## Module 12 — Users & Roles

Three tabs: team accounts, the permission matrix and the access history.

### The matrix is live, not a mock-up

The obvious way to build a permission screen is to render a grid that edits
its own copy of the data while the real gates read a constant — a screen that
looks like administration and administers nothing. Instead the matrix moved
into `RoleProvider`, and `can()` now reads **that** rather than the shipped
constant. Toggling a cell changes what the running application allows:
granting "View medical records" to Receptionist and switching role opens
Module 06 for them immediately; removing it closes it again.

Because the toggles are real, the editor has a guard: removing a permission
from the role you are currently signed in as — where it would lock you out of
the screen you are on — is refused with an explanation rather than performed.
The header shows when the matrix differs from the shipped defaults and offers
a reset, and every toast says the change is session-only.

Team accounts are not duplicated from the clinicians: a user account that
belongs to a clinician carries their doctor id and reads name, photo and
branch from the doctor profile, so the two cannot drift. Suspending a
clinician's login explicitly does **not** cancel their appointments — the
dialog says so and points at the Doctors module, because conflating the two
would be the easy wrong behaviour.

The list carries role, branch, 2FA state, last active and status, with a
"Without 2FA" tile that names the risk rather than scoring it. Access history
covers sign-ins, failed sign-ins, role and permission changes, invitations,
suspensions and every time a clinical record was opened.

### Review pass

No visual defects this round — the module is built from primitives already
hardened in Modules 02–06 (`DataTable`, dialogs, tabs with `min-w-0`), and the
click-through fix from Module 05 meant the row menus behaved from the start.
One unused import removed.

### Verified

The live matrix exercised end to end: granted Receptionist access in Module
12, switched role, and Medical Records opened for them; the lockout guard
refused to remove it again and explained why; reset restored the defaults.
Users list, matrix and history at 1440 and 375 with no page overflow. `tsc`
clean, ESLint clean, production build of all 64 routes clean.

## Module 07 — Treatment Plans

### Scheduling a step is a real booking

The point of this module was to connect planning to the calendar rather than
render a timeline. `ScheduleStepDialog` does not define its own availability
logic: it calls the same `availableSlots`, `findHoursProblem`,
`findAvailabilityProblem` and `findConflict` the appointment book uses, so a
plan session can never be scheduled into a slot the calendar would reject.
The clinician list is narrowed to those who actually provide that service,
and booking updates the step, the session counts and the next-to-book panel.

### Costs derive, they are not typed in

Plan steps now carry a `serviceId`, and each step's cost is the catalogue
price for that service — so a price change in Module 05 moves every plan
total, and nothing can quietly disagree. The detail view shows plan value,
invoiced, remaining and chair time, all computed in `src/lib/treatment.ts`
rather than recalculated per view.

The plan builder sequences procedures from the catalogue with live totals and
chair time, restricts the list to what the chosen clinician provides, and
warns when changing clinician strands a procedure they do not offer.

A fourth plan state was added beyond the obvious three: **"Needs
scheduling"** — started, but with nothing booked to continue it. That is the
state a practice actually loses revenue to, and it gets its own filter and
index tile.

### Review pass — defects found in the running app and fixed

1. **Every plan looked identical.** One five-step template meant all twelve
   plans showed the same $1,820 value and 2/5 progress. Five realistic
   archetypes now vary length, services and value ($650–$2,950).
2. **A plan contradicted itself**: "Crown fitting — booked" sat above
   "Implant placement — not scheduled". The progress draw was inside the
   step `map`, so each step rolled its own position. Drawn once per plan now,
   and the sequence is always in order.
3. **The clinician select rendered blank** when the plan's own clinician does
   not provide that service — a value with no matching option, while slots
   were computed for an unselectable doctor. It now falls back to a clinician
   who provides it.

### Verified

Booked a real session end to end: picked a free 08:30 slot on 23 November,
the step moved to Scheduled with the clinician and time recorded, and the
sessions and next-to-book panels updated. Index, detail, builder and
scheduling dialog at 1440 and 375 with no page overflow. `tsc` clean, ESLint
clean, production build of all 74 routes clean (12 plan pages prerendered).

## Module 08 — Payments & Invoices

### Invoices are derived, not invented

Every invoice line is a completed appointment or a completed treatment-plan
session, priced from the service catalogue. Nothing in this module is a
separate ledger, so the money reconciles with the calendar and the plans by
construction — and the overview **proves it** rather than asserting it: a
reconciliation panel counts completed clinical items against invoice lines
and reports any that are unbilled (currently 147 appointments + 19 sessions
= 166 lines across 92 invoices, none missing).

That meant deleting the old random `ledger` and `balance` on the patient
record rather than leaving a second source of truth beside the real one.
`patientBalance()` is now the single answer to "what does this patient owe?",
used by the register, the patient profile and the billing module alike.

### What is there

Revenue overview with collected / outstanding / invoiced / refunded, an
invoiced-vs-collected bar chart, payment-method mix, and outstanding balances
bucketed by age. Invoice list with search, status and clinician filters.
Invoice detail showing each charge **with the clinical event that produced
it**, discounts, payments received, and refund state. Record-payment and
refund dialogs.

The one rule enforced in the UI: **you cannot receive more than is owed.** An
overpayment is a credit note, not a payment, and silently accepting one would
put the ledger out by the difference — so the field errors, the reason is
explained, and the button disables.

### Review pass — defects found in the running app and fixed

1. **The monthly chart read as broken** — one towering November bar beside
   near-empty months. The figures are correct (the appointment book covers a
   single week), so rather than disguise it the card now says so in its
   subtitle, which stops it being misread as a collapse in trading.
2. **Cramped mobile header**: "Payments & invoices" wrapped to three lines
   squeezed beside two buttons. The title now takes the full row below `sm`.

### Verified

Reconciliation reports nothing unbilled. Overpayment guard exercised: $500
against a $290 balance is refused with the reason and a disabled button.
Invoice detail shows the source clinical event per line. Overview, list and
detail at 1440 and 375 with no page overflow. `tsc` clean, ESLint clean,
production build of all 166 routes clean (92 invoice pages prerendered).

## Module 09 — AI Knowledge Center

### The publish gate is the module

The brief says only approved content may reach the patient-facing assistant,
so that rule is one function — `assistantCanUse()` in `src/lib/knowledge.ts` —
and every surface reads it instead of asking "is this published?" itself.

It has **two** conditions, not one. Published is necessary but not
sufficient: articles in a clinical category are withheld unless a clinician
has signed them off. An administrator publishing dental aftercare that no
clinician has read is precisely the failure the gate exists to prevent, so
the seed data includes exactly that case (a published gum-disease article
with no reviewer) and the index names it on the overview rather than hiding
it among the counts.

Fourteen articles across all nine categories, written as real clinic copy —
extraction aftercare, emergency guidance, sensitivity, cancellation policy,
fees, aligners, nervous patients — including an Arabic article that renders
right-to-left in the editor and preview.

The editor covers title, category (labelled clinical or not), language,
summary, body, tags, attachments, author, reviewer and version, with a
patient-facing preview. The body renderer is deliberately tiny — headings,
bullets, numbered steps and bold only — so published content cannot inject
markup into what the assistant serves.

### Connected to Module 06

Assistant observations in the medical record now cite knowledge articles by
id and render them **through the same gate**: a cited article that is not
being served appears struck through, so a clinician can see the assistant was
drawing on something now withheld.

### Review pass — defects found in the running app and fixed

1. **The one article needing attention was the one the workflow could not
   act on.** A published-but-unapproved clinical article offered only
   "Archive" — no route to approval. It now offers "Approve content",
   clinician-gated.
2. **It reported live citations while withheld** — "cited 51 times in the
   last 30 days" under a banner saying it was not being served. Now reads
   "before it was withheld — not being cited now".

### Verified

Approving the withheld article flips the banner to green, records the
reviewer and date, and removes it from the withheld list. A clinical article
cannot be published without sign-off; the button states why. The struck-
through citation renders in Module 06. Index and editor at 1440 and 375 with
no page overflow. `tsc` clean, ESLint clean, production build of all 166
routes clean.

### Known gap

Knowledge workflow state lives in the Knowledge Center page, so approving an
article there does not change Module 06's citations until the backend makes
the state shared. The gate logic is shared; only the mutable state is not.

## Module 10 — AI Assistant Management

Four tabs — conversations, unanswered questions, performance and safety —
over thirteen full transcripts. **Every metric is derived from those
conversations**, not stated: resolution rate, booking conversions,
escalations, satisfaction and topic mix are all computed in
`assistantMetrics()` from the same array the list renders.

### It depends on Module 09, visibly

Every assistant turn that used the knowledge base names the articles it drew
on, rendered through `assistantCanUse()` — the same gate the Knowledge Center
enforces. An article since withheld shows struck through in the transcript,
and the overview says so outright: *"1 of them is no longer served — past
answers used content the Knowledge Center now withholds."* That is a real
audit signal, not decoration: it tells a clinician an answer already given
rested on content the clinic has since pulled.

The unanswered queue is the other half of that loop. Fourteen questions
nothing published covers, each with how often it was asked, the conversations
it came from, and the category an article would belong in — so the queue
feeds the Knowledge Center rather than being a dead-end list.

### Safety settings are limits, not preferences

Seven rules, four of which **cannot be switched off**: never give a
diagnosis, escalate pain with swelling or bleeding, answer only from
published knowledge, and no prescribing. An assistant that can be configured
to give a diagnosis is not a safe assistant however the toggle is labelled,
so those four are locked and say so. Changing the rest needs clinical
permission. Where a rule changed what the assistant said, the transcript
shows which one fired.

Conversation detail also respects the access boundary: a role without
`records.view` can read the conversation but not the patient's identity.

### Review pass — defects found in the running app and fixed

1. **Ragged tab strip** — tabs containing icons rendered taller than
   text-only ones, so the labels sat on two different baselines. Icons
   dropped, matching every other tab strip in the app.
2. **The warning state was unreachable.** No conversation happened to cite a
   withheld article, so the "no longer served" path could never be seen. A
   bleeding-gums conversation citing the withheld gum-disease article now
   makes it real — and it matches the assistant observation Module 06
   already showed for the same patient.
3. **Mobile: a button squeezed the explanatory copy** into a one-word
   column. The text keeps a minimum width and the button wraps below.

### Verified

Transcript drawer shows citations, the safety rule that fired, the action
taken and the staff follow-up. Overview amber state confirmed. Index,
transcript, queue, performance and safety at 1440 and 375 with no page
overflow. `tsc` clean, ESLint clean, production build of all 166 routes clean.

## Module 13 — Reports & Analytics

`src/lib/analytics.ts` + `src/components/reports/reports-module.tsx` +
`src/app/reports/page.tsx`.

Six tabs — Revenue, Appointments, Patients, Clinicians, Services, AI
assistant — over a date-range selector (7d / 30d / 90d / 12m / all time).

Nothing here holds its own copy of a number. Every figure is aggregated at
render time from the fixtures the other modules already read: invoices
(themselves derived from completed appointments and completed plan steps),
the appointment book, the patient register, clinician rotas, the service
catalogue and the assistant's conversations. Change a rota and the clinician
table moves with it.

**CSV export is real.** Four exports (revenue by service, appointments by
day, clinician performance, service popularity) build a CSV from the figures
on screen, hand it to the browser as a Blob and download it. The toast says
so in as many words, because elsewhere in this build a toast often confirms
something that only changed session state.

### Module 01 honesty pass

The dashboard was still asserting figures the data could not support:

- **KPIs were hardcoded strings** — "4,812 total patients", "$243.8k revenue"
  — against a 20-patient register. All four now come from `clinicHeadline()`,
  the same aggregation the reports read.
- **The deltas were decorative.** "+6.8% vs. last month" was a literal.
  Deltas are now computed period-over-period, and a card shows no delta chip
  at all where the comparison window holds no data — the appointment fixture
  covers one week, so there is no prior Friday to compare against. A
  degenerate delta (a near-empty prior window giving "+11,048%") is
  suppressed for the same reason.
- **The sparklines were invented series.** They are now the real monthly
  register, monthly registrations, daily bookings and daily invoiced values.
- **The revenue chart contradicted the rest of the build**, carrying a year
  of $200k months. It now plots invoiced against collected from the same
  invoices, with a line under it saying plainly why the months before October
  are empty.

### Review pass — defects found in the running app and fixed

1. **Two-bar "revenue trend" for a 30-day range.** The trend bucketed by
   month whatever the range was selected. It now buckets by day (7d/30d),
   week (90d) or month (12m/all), and the card title names the bucket.
2. **Charts skipped empty buckets**, so a gap of three weeks sat next to a
   gap of one day at the same width — the x-axis lied about the shape. Both
   the revenue trend and patient growth now fill every bucket in the window.
3. **"Patient growth, last 12 months" showed five years.** It took the last
   twelve *entries*, not months. It now runs continuously from the first
   registration, and the subtitle says so.
4. **The patient-growth x-axis was blank** — the series emitted `month` while
   the axis read `label`.
5. **A stacked chart with no key.** Appointment outcomes stacked four colours
   with nothing to identify them. Both charts carry a legend in the design
   system's own type scale.
6. **The appointments tab was one chart deep** against the revenue tab's
   four panels. Added demand by hour, derived from booking start times, with
   its own CSV export.
7. **The language switch did nothing.** "Switch to العربية" in the profile
   menu was a dead menu item while the whole suite carried RTL styling that
   nothing could trigger. It now flips `dir` and `lang` on the document, so
   RTL is genuinely exercisable. Interface copy is still English: this
   switches direction, not translation.

### Verified

Range selector changes every figure on every tab. CSV export downloads and
toasts, no console errors. Revenue, appointments, patients, clinicians and AI
tabs reviewed at 1440 and 375 with no page overflow, and in RTL at 1024.
Dashboard KPIs, hero facts and revenue chart confirmed consistent with the
reports. `tsc` clean, ESLint clean, production build clean.

## Module 11 — Notifications

`src/lib/notifications.ts`, `src/components/notifications/` (module, bell,
provider) + `src/app/notifications/page.tsx`.

Two things get called "notifications" in clinic software, and conflating them
is how a feed becomes both noisy and untrustworthy. This module keeps them
apart:

- **Needs attention** — conditions in the clinic, derived at render time from
  the appointment book, invoices, treatment plans, the patient register, the
  assistant's unanswered queue and the knowledge gate. Seven kinds, three
  severities. Nothing is stored: an alert disappears when the underlying state
  changes, not when somebody dismisses it. Marking one read says a human has
  seen it and the copy says exactly that, because "read" and "resolved" are
  not the same thing and an invoice marked read is still overdue.
- **Patient messages** — a delivery log of what was actually sent, derived
  from the appointment book: a confirmation when a booking was made, a
  reminder once its 24-hour window had passed, a notice when something was
  cancelled, a recall invitation for the overdue patients the desk got to.
  456 messages, 19 of them genuinely failed.
- **Reminder rules** — the four templates that generate those messages, each
  showing how many it actually produced, counted from the log.

### A feed is a leak vector

The design decision worth naming: a receptionist glancing at the bell must not
read a patient's clinical detail. Every alert therefore declares two
permissions — one to see the row, one to read the detail:

- Overdue-invoice alerts need `billing.view` to appear at all. Switching to
  Receptionist drops the count from 14 to 13, on the page **and** on the bell.
- Stalled-plan alerts stay visible to everyone, because booking the next
  session is reception's job — but the detail reads "Detail hidden — needs
  View medical records" instead of naming the treatment.

Contact details are masked throughout (`+1 415 ••• 4770`, `h•••@gmail.com`).
A delivery log is not a contact list.

### Honest about what does not happen

"Resend" on a failed message says plainly that no messaging provider is wired
up and the log is unchanged, rather than showing a success toast. Pausing a
rule stops it generating new messages for the session and says it does not
rewrite the log, which is what an audit of patient contact requires.

### Review pass — defects found in the running app and fixed

1. **Two states were unreachable.** The first build produced zero failed
   messages and zero recall alerts, so the "Failed" badge and the recall alert
   could never be seen. Two named patients now have wrong contact details, and
   the recall rule is paused so half the overdue patients were never invited —
   which is the condition the alert exists to catch.
2. **The failure reason contradicted the channel** — "carrier rejected the
   number" on an email. Reasons are now per channel.
3. **One alert per failed message** buried everything else under two
   patients. Failures group by person: "13 messages to Hannah Voss failed".
4. **Rows looked like duplicates.** Two reminders to the same patient on the
   same day both read "Appointment reminder". Each row now carries what the
   message was about.
5. **The delivery outcome scrolled off** once subjects widened the table — the
   one column people scan for. Widths capped and the channel column drops
   earlier.
6. **"Paused" above "3 sent from this rule"** read as a contradiction. A
   paused rule now says "3 sent before it was paused", which is also the story
   of why those recall alerts exist.
7. **Raw ISO dates** ("Last seen 2026-05-03") against formatted dates
   everywhere else.
8. **Mobile squeezed every alert title** onto two lines beside the read
   toggle. The toggle moves into the metadata line below `sm`.

### Two dead controls, now real

- **The topbar bell** was a button that did nothing with a hardcoded "3
  unread" in its aria-label. It is now a dropdown reading the same provider
  the page does, so the badge, the page and the role gate cannot disagree.
- **The dashboard's "Attention required" panel** carried its own three
  invented alerts — unsigned X-ray consent forms, an operatory service window
  — that no data supported and the centre knew nothing about. It now shows the
  top four of the same derived alerts with a link to the rest. The old fixture
  and its type are deleted rather than left lying around as a second source of
  truth.

### Verified

Role switch to Receptionist confirmed in the browser: billing alert gone from
page and bell, clinical detail redacted on the rows that remain. Filters,
unread-only, mark-read/unread, mark-all-read and both empty-state branches
exercised. Delivery log sorts, paginates (38 pages) and searches; the drawer
shows the real message and the real failure reason. Reviewed at 1440, at 375
with no page overflow, and in RTL at 1024. `tsc` clean, ESLint clean,
production build clean.

## Module 14 — Settings

`src/lib/settings.ts`, `src/components/settings/` + `src/app/settings/page.tsx`.

A settings page is where fake toggles go to die, so this one holds a small
number of controls that genuinely change behaviour, and says plainly of
anything that does not. Five tabs: Clinic, Scheduling, Language, Access,
About this build.

The store is a tiny external store read through `useSyncExternalStore`, not
React context, because the pure scheduling functions read it too and two
copies of that state would be exactly the drift this build avoids.

### What is actually wired

- **Clinic profile** — the name drives the sidebar wordmark and the
  breadcrumb root; the name and phone number are written into the messages
  patients receive, so renaming the clinic rewrites the delivery log's
  wording. Validated on save, with Discard and Restore defaults.
- **Opening hours**, per day, open or closed — feed the out-of-hours check
  the booking form runs, the free-slot search, and the span of the day and
  week grids. The grid was a fixed 08:00–18:00, so widening the hours would
  have clipped appointments; it now derives its span from the widest hours
  the clinic is ever open. Verified live: setting Monday to 06:00 redrew the
  schedule from 06:00, with the hours Friday is closed correctly greyed.
- **Slot granularity** — the interval of the alternative times offered when a
  chosen slot clashes. Verified at 60 minutes: the reschedule panel dropped
  to a single hourly option.
- **Reading direction** — the switch added in Module 13, in its proper home.

Closing before opening is corrected rather than accepted, since it would make
every booking that day fail with no visible reason.

### What it says rather than fakes

- **Interface language** is marked "English only". The direction switch is
  real; translated strings do not exist, and the page says switching would
  show English text in an Arabic layout.
- **Access** shows the live permission set for the signed-in role, reading the
  matrix Module 12 owns, and links there rather than offering a second place
  to edit it. Reminder rules, assistant safety rules and the service
  catalogue are linked for the same reason.
- **About this build** is a plain two-column account of what is real (every
  figure derived, overlaps prevented in logic, permissions gating real
  content, the assistant's publishing gate, working CSV export) and what is
  not (no database or API, nothing is ever sent, no real patient data, a
  one-week appointment fixture, no authentication, no dark theme, charts that
  do not mirror in RTL).

### Review pass — defects found in the running app and fixed

1. **The slot setting's description overclaimed.** It said the booking form
   offers start times on that interval; the form takes a free time entry, and
   the interval only governs the alternatives suggested when a time will not
   work. Reworded to what the code does.
2. **The breadcrumb root stayed "Luceat"** after the clinic was renamed.
3. **Bidi punctuation across the whole suite.** In right-to-left the full stop
   of every English sentence jumped to the front — ".Clinic configuration".
   Content blocks now use `unicode-bidi: plaintext`, so each paragraph takes
   its direction from its own first strong character. Scoped to page content
   and dialogs: applied to the chrome as well it dragged the sidebar's group
   headings away from the items they label.
4. **A memo lied about why it re-ran.** The notification feed listed
   `settings` as a dependency it never read, to force a rebuild after a
   rename. The derivations now take settings as an argument, so the
   dependency is real rather than suppressed.

### Verified

Renaming the clinic updated the sidebar, the breadcrumb and the wording of a
message in the delivery log, in one session without a reload. Opening hours
redrew the schedule grid; slot granularity changed the reschedule options.
Restore defaults returns everything. Reviewed at 1440, at 375 with no page
overflow, and in RTL at 1024. `tsc` clean, ESLint clean, production build
clean.

## All fourteen modules are built

No `ModulePlaceholder` remains in `src/app`. The suite covers Dashboard,
Doctors, Patients, Appointments, Services, Medical Records, Treatment Plans,
Payments, AI Knowledge Center, AI Assistant, Notifications, Users & Roles,
Reports & Analytics and Settings.

The rule the build was held to throughout: **one source of truth, proven in
the running app.** Invoices derive from completed appointments and treatment
sessions; reports, dashboard KPIs and the alert feed all read those same
fixtures; the permission matrix Module 12 edits is the one every gate asks;
the publishing gate in Module 09 is the one the assistant obeys in Module 10
and the one the alert feed reports. Where a figure could not be derived
honestly it was removed or labelled, not invented — the dashboard's fake
deltas, its invented year of revenue and its three fictional alerts were all
deleted once a real source existed.

Two review habits caught most of the defects: reading the rendered page
rather than the code, and treating an **unreachable state as a bug**. Several
rounds found UI paths the data could never produce — a withheld article with
no route to approval, a read-only chart nobody could reach, a "Failed"
delivery badge with no failures behind it — and each was fixed in the data,
not hidden in the view.

Known limitations, stated in the app itself under Settings › About this
build: all mutations are session state; there is no backend, authentication
or messaging provider; patient data is generated from a fixed seed; the
appointment book covers 16–22 November 2026; interface copy is English only;
Recharts does not mirror in RTL; there is no dark theme.

## Bilingual localization (in progress)

`src/lib/i18n/` + `src/locales/` + `src/components/i18n/`.

**Architecture.** `en.ts` is the source of truth, flat dotted keys. `ar.ts` is
typed `Record<MessageKey, string>`, so adding an English key without its
Arabic pair is a **compile error** — "every new module supports both
languages" is a build rule, not a convention. `t()` interpolates `{named}`
placeholders and is callable outside React, because the scheduling helpers
and the notification derivations also produce user-visible strings.

A small external store holds the locale (`useSyncExternalStore`, server
snapshot always English so hydration cannot mismatch). The remembered choice
is applied in a layout effect, which sets `lang`, `dir` and the Cairo face on
the document — one place, so CSS logical properties and the `rtl:` variants
follow. The choice persists in `localStorage`.

**Decisions worth recording.** Arabic uses `ar-EG-u-nu-latn`: Latin digits in
an Arabic interface, because this panel is full of tabular money and times
and mixing numeral systems down a column makes totals hard to compare.
Direction is not independently settable — it follows the language, so the old
direction toggle became a real language switcher. USD is normalised to `$`:
both `en-GB` and `ar-EG` render it `US$`, which reads as an exchange rate
rather than a price.

**Translated and verified in both languages: all fourteen areas.** Navigation,
topbar, command palette and the shared sortable table; Dashboard, Appointments,
Patients, Doctors, Services, Medical Records, Treatment Plans, Payments,
Knowledge Centre, AI Assistant, Reports, Users, Settings and Notifications.
1,215 keys in each file.

**What this pass changed beyond the wording.** Several things were stored as
English strings in one place and read from many, so translating them once
fixed every module at the same time, and removed drift that was already there:

- `STATUS_STYLE` (appointment status), `PATIENT_STATUS_META`,
  `DOCTOR_STATUS_META`, `USER_STATUS_META`, `PLAN_STATUS_META`,
  `STEP_STATUS_META` and `ROLE_META` now carry a `MessageKey` rather than a
  label, so a status reads identically wherever it appears and a new status
  cannot ship half-translated.
- Date and number formatting is locale-aware in `schedule.ts`, `analytics.ts`,
  `settings.ts` and `mock/billing.ts`. These each had `Intl.DateTimeFormat("en-GB")`
  frozen at module load, which is why chart axes stayed English in an Arabic
  page. They are now built per call, because the locale can change while the
  page is open.
- Weekday names come from `Intl` instead of hardcoded `DAY_NAMES` /
  `DAY_SHORT` arrays, so Arabic gets real weekday names.
- USD is normalised to `$`: both `en-GB` and `ar-EG` render it `US$`, which
  reads as an exchange rate rather than a price.

**Deliberately left in English.** Fixture content is data, not interface copy:
patient and clinician names, service names, article titles, branch names, and
the phone and email format examples in form placeholders. Route `metadata`
titles (the browser tab) are produced by server components, which cannot read
a client-side locale choice; moving those would mean putting the locale in the
URL or a cookie.

**Tooling.** `scripts/` holds the passes used here, kept because the same job
recurs whenever a module is added: `i18n-add-keys.mjs` (append to both files,
same order), `extract-strings.mjs` (list what is still hardcoded in a module),
`auto-i18n.mjs` (replace by position — attribute, object value, JSX text or
bare literal — and report anything it could not place), `headers-i18n.mjs`
(table headers only, deliberately narrow because words like "Status" and
"Date" are also object keys), `add-hook.mjs` and `prune-hooks.mjs`.

### Fixture content in Arabic

Interface copy lives in `src/locales`; the clinic's own content — service
names, treatment labels, specialties, plan titles — lives with the data, in
`src/lib/mock/content-ar.ts`, resolved by `src/lib/mock/localize.ts`. The
split is deliberate: in a connected build that content comes back from the
API already in the caller's language, because that is where a clinic edits
its own catalogue. Keeping them apart stops the locale files filling up with
one clinic's price list.

Translated: the twelve catalogue services (name, category and the long
description), every treatment label on an appointment, clinician specialties
and operatories, job titles, branches, spoken languages, article categories,
and the treatment-plan titles and session names.

**Not translated, deliberately:** people's names. A record stores a name once
and shows it as given; a register that transliterated its patients would be
wrong in a real clinic too. Also the phone and email format examples in form
placeholders, which carry no language.

**How it works, and the trap in it.** The Arabic values are attached as
getters, so `service.name` keeps working at its ~130 existing call sites and
resolves at read time. The cost is that spreading a record copies the value
the getter returns, freezing it — `localize.ts` documents this as THE ONE
RULE, and all three places that hit it (the catalogue, the generated plans,
and a plan cloned into component state) are written against it. The third
uses `relocalizePlan`.

**One real bug this surfaced.** Resolving language outside React meant a
late-hydrating subtree could read Arabic while React was still matching it
against the English HTML the server sent — a hydration mismatch that
regenerated the page client-side. The locale store now holds the switch
until the frame after hydration (`ready` in `src/lib/i18n/locale.ts`), so
the server's markup and the first client render always agree. Verified
against a production build with a clean console.

The honest limitation: the server still renders English and the page swaps
to Arabic on load, so an Arabic user sees a brief flash. Removing it means
putting the locale in a cookie and reading it in the root layout, which
makes the 166 static pages dynamic. That is the right fix for production and
was not worth it for a demo.

### Note on the move to D:

The project now lives at `D:\projects\luceat-dental`. Two traps when the
session moved: `.claude/launch.json` is hidden and was not copied, so the
preview tool kept starting the **old** copy on C: and served stale code for
some time; and `node_modules` did not copy either. Both are restored. If a
change appears not to take effect, check which directory the dev server is
actually running from before suspecting the code.
