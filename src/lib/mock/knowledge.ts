/**
 * Knowledge base content.
 *
 * Written as real clinic copy rather than lorem ipsum, because the whole
 * point of the module is that a patient-facing assistant answers from it.
 * Clinical articles name the clinician who approved them.
 */
import type { ArticleStatus, KnowledgeCategory } from "@/lib/knowledge";
import { TODAY } from "./schedule";

export interface Attachment {
  id: string;
  name: string;
  kind: "pdf" | "image";
  sizeKb: number;
}

export interface Article {
  id: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  /** Markdown-lite: "## " headings and "- " bullets. */
  body: string;
  tags: string[];
  language: "en" | "ar";
  status: ArticleStatus;
  authorId: string;
  reviewerId?: string;
  reviewedOn?: string;
  created: string;
  updated: string;
  version: number;
  attachments: Attachment[];
  /** How often the assistant has cited it in the last 30 days. */
  citations: number;
}

const shiftDate = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const articles: Article[] = [
  {
    id: "kb-1",
    title: "After a tooth extraction",
    category: "Post-Operative Instructions",
    summary:
      "What to do in the first 24 hours and the days after a tooth is removed.",
    body: `## The first hour
- Keep firm pressure on the gauze pad for 30–45 minutes without changing it.
- Some oozing is normal for several hours. Heavy, bright-red bleeding is not.

## The first 24 hours
- Do not rinse, spit forcefully, use a straw or smoke. These dislodge the clot.
- Eat soft, cool food. Chew on the other side.
- Take pain relief as directed before the anaesthetic wears off.

## From day two
- Rinse gently with warm salt water (a teaspoon in a glass) after meals.
- Brush the rest of your mouth normally, avoiding the socket itself.

## Call the clinic if
- Bleeding soaks a fresh gauze pad after an hour of firm pressure.
- Pain worsens from day three rather than easing — this can be a dry socket.
- You develop a fever, or swelling that makes swallowing difficult.`,
    tags: ["extraction", "aftercare", "bleeding", "dry socket"],
    language: "en",
    status: "published",
    authorId: "d2",
    reviewerId: "d2",
    reviewedOn: shiftDate(TODAY, -40),
    created: shiftDate(TODAY, -180),
    updated: shiftDate(TODAY, -40),
    version: 4,
    attachments: [
      { id: "at-1", name: "Extraction aftercare leaflet.pdf", kind: "pdf", sizeKb: 240 },
    ],
    citations: 86,
  },
  {
    id: "kb-2",
    title: "تعليمات ما بعد خلع السن",
    category: "Post-Operative Instructions",
    summary: "النسخة العربية من تعليمات العناية بعد خلع السن.",
    body: `## الساعة الأولى
- اضغط على الشاش بثبات لمدة ٣٠ إلى ٤٥ دقيقة دون تغييره.
- نزول قليل من الدم أمر طبيعي لعدة ساعات.

## أول ٢٤ ساعة
- تجنب المضمضة والبصق بقوة واستخدام الشاليموه والتدخين.
- تناول طعاماً طرياً وبارداً، وامضغ من الجهة الأخرى.

## اتصل بالعيادة إذا
- استمر النزيف بغزارة بعد ساعة من الضغط المستمر.
- ازداد الألم بعد اليوم الثالث بدلاً من أن يخف.`,
    tags: ["خلع", "عناية", "عربي"],
    language: "ar",
    status: "published",
    authorId: "d5",
    reviewerId: "d2",
    reviewedOn: shiftDate(TODAY, -36),
    created: shiftDate(TODAY, -90),
    updated: shiftDate(TODAY, -36),
    version: 2,
    attachments: [],
    citations: 31,
  },
  {
    id: "kb-3",
    title: "Sensitive teeth: why it happens and what helps",
    category: "Dental Conditions",
    summary:
      "Explains cold and sweet sensitivity, common causes, and when it needs an appointment.",
    body: `## What sensitivity feels like
A short, sharp twinge when you drink something cold, breathe cold air, or eat
something sweet. It stops within a few seconds.

## Common causes
- Receding gums exposing the root surface.
- Worn enamel from grinding or very firm brushing.
- A cracked filling or early decay.
- Recent whitening or a deep clean — usually settles within two weeks.

## What helps at home
- A desensitising toothpaste, smeared on the sensitive area at night and not rinsed off.
- A soft brush and gentle technique.
- Avoiding acidic drinks immediately before brushing.

## Book an appointment if
- The pain lingers for more than 30 seconds after the trigger is removed.
- It wakes you at night, or throbs on its own.
- One specific tooth is far worse than the others.`,
    tags: ["sensitivity", "enamel", "gum recession"],
    language: "en",
    status: "published",
    authorId: "d6",
    reviewerId: "d6",
    reviewedOn: shiftDate(TODAY, -22),
    created: shiftDate(TODAY, -120),
    updated: shiftDate(TODAY, -22),
    version: 3,
    attachments: [],
    citations: 64,
  },
  {
    id: "kb-4",
    title: "Booking, changing and cancelling an appointment",
    category: "Appointment Policies",
    summary:
      "How much notice we need, what happens if you are late, and our cancellation fee.",
    body: `## Giving notice
We ask for **48 hours' notice** to change or cancel an appointment. That lets
us offer the time to someone waiting.

## Late arrival
If you arrive more than 10 minutes late we may need to shorten or rebook the
appointment, so the clinicians stay on time for everyone after you.

## Missed appointments
A missed appointment without notice is charged at 50% of the treatment fee.
We waive this the first time, and in genuine emergencies — just tell us.

## Reminders
We send a reminder 48 hours and again 2 hours before. You can reply to
reschedule, or use the booking link in the message.`,
    tags: ["cancellation", "late", "no-show", "reminders"],
    language: "en",
    status: "published",
    authorId: "u-recep-1",
    created: shiftDate(TODAY, -210),
    updated: shiftDate(TODAY, -15),
    version: 6,
    attachments: [],
    citations: 142,
  },
  {
    id: "kb-5",
    title: "What treatment costs and how payment works",
    category: "Pricing Information",
    summary:
      "Published fees, written estimates, insurance and payment in instalments.",
    body: `## Estimates
Every treatment plan comes with a written estimate before anything starts.
The estimate holds for 90 days.

## Our published fees
- Routine check-up and clean — $120
- Digital X-ray and imaging — $110
- Composite filling — from $180
- Crown fitting — from $820

## Insurance
We are not tied to one insurer. We give you an itemised invoice to claim
against, and can submit directly for several major providers.

## Paying in stages
Longer treatment plans can be paid session by session as the work is done.
Ask at reception — there is no interest and no credit check.`,
    tags: ["fees", "insurance", "estimate", "payment plan"],
    language: "en",
    status: "published",
    authorId: "u-acct-1",
    created: shiftDate(TODAY, -160),
    updated: shiftDate(TODAY, -9),
    version: 5,
    attachments: [
      { id: "at-2", name: "Fee schedule 2026.pdf", kind: "pdf", sizeKb: 180 },
    ],
    citations: 118,
  },
  {
    id: "kb-6",
    title: "Dental emergencies: what to do right now",
    category: "Emergency Guidelines",
    summary:
      "Knocked-out teeth, uncontrolled bleeding, facial swelling and severe pain.",
    body: `## Call 911 or go to A&E, not the clinic
- Swelling that affects your breathing or swallowing.
- Bleeding that will not stop after 20 minutes of firm pressure.
- A suspected broken jaw or a head injury.

## A knocked-out adult tooth — act within the hour
1. Hold the tooth by the crown, never the root.
2. If dirty, rinse briefly in milk or saline. Do not scrub it.
3. Put it back in the socket if you can, and bite gently on a clean cloth.
4. If you cannot, keep it in milk — not water — and come straight in.

## Severe toothache
Take your usual pain relief at the normal dose and call us at opening. If it
is out of hours, the voicemail gives the on-call number.

## Lost filling or crown
Not usually urgent. Keep the area clean and call during opening hours.`,
    tags: ["emergency", "avulsed tooth", "swelling", "out of hours"],
    language: "en",
    status: "published",
    authorId: "d2",
    reviewerId: "d2",
    reviewedOn: shiftDate(TODAY, -55),
    created: shiftDate(TODAY, -240),
    updated: shiftDate(TODAY, -55),
    version: 7,
    attachments: [],
    citations: 97,
  },
  {
    id: "kb-7",
    title: "Opening hours, parking and accessibility",
    category: "Clinic Information",
    summary: "Where to find us, when we are open and how to get in.",
    body: `## Opening hours
- Monday to Friday, 08:00–18:00
- Saturday, 09:00–14:00
- Closed Sunday

## Harbour Street
Street parking is metered until 18:00. There are two accessible bays directly
outside. Step-free entrance from the street, and a lift to the first floor.

## Lindendal Clinic
A small car park at the rear, free for patients for two hours. Entirely on
one level.

## Getting in touch
Reception answers from 07:45. Outside those hours the voicemail gives the
on-call number for genuine emergencies.`,
    tags: ["hours", "parking", "accessibility", "branches"],
    language: "en",
    status: "published",
    authorId: "u-recep-2",
    created: shiftDate(TODAY, -300),
    updated: shiftDate(TODAY, -30),
    version: 4,
    attachments: [],
    citations: 73,
  },
  {
    id: "kb-8",
    title: "Clear aligners: what the course involves",
    category: "Dental Services",
    summary:
      "How aligner treatment runs, how long it takes and what is expected of the patient.",
    body: `## Before starting
A full assessment with records, photographs and an intraoral scan. We show you
a simulation of the expected result before you commit.

## Wearing them
- 20 to 22 hours a day. Out for eating and drinking anything but water.
- Each set is worn for 7 to 10 days, as directed.
- Clean them with cool water and a soft brush — never hot water.

## Appointments
A review every 6 to 8 weeks. Most courses run 6 to 18 months depending on how
much movement is needed.

## Afterwards
Retainers are not optional. Teeth drift back without them, usually within the
first year.`,
    tags: ["orthodontics", "aligners", "retainers"],
    language: "en",
    status: "published",
    authorId: "d3",
    reviewerId: "d3",
    reviewedOn: shiftDate(TODAY, -18),
    created: shiftDate(TODAY, -100),
    updated: shiftDate(TODAY, -18),
    version: 2,
    attachments: [],
    citations: 45,
  },
  {
    id: "kb-9",
    title: "Preparing for a root canal appointment",
    category: "Treatment Instructions",
    summary: "What to do before the visit and what to expect on the day.",
    body: `## Before you come
- Eat beforehand. Your mouth will be numb for two to three hours afterwards.
- Take your usual medication as normal unless we have told you otherwise.
- Tell us if you are taking a blood thinner or have had antibiotics recently.

## On the day
The tooth is numbed, isolated with a rubber dam, and the infected pulp is
removed. Most cases take 60 to 90 minutes. It should not hurt — tell the
clinician if you feel anything sharp.

## Afterwards
Mild tenderness for a few days is normal. Avoid biting hard on that tooth
until the permanent restoration is fitted.`,
    tags: ["endodontics", "root canal", "preparation"],
    language: "en",
    status: "in_review",
    authorId: "d4",
    created: shiftDate(TODAY, -12),
    updated: shiftDate(TODAY, -3),
    version: 1,
    attachments: [],
    citations: 0,
  },
  {
    id: "kb-10",
    title: "Teeth whitening: safety and expectations",
    category: "Dental Services",
    summary:
      "What in-chair whitening can and cannot achieve, and who it is unsuitable for.",
    body: `## What it can do
Lighten natural enamel stained by coffee, tea, red wine and tobacco, usually
by several shades.

## What it cannot do
Change the colour of crowns, veneers or fillings — they stay as they were, so
front restorations may need replacing afterwards to match.

## Not suitable if
- You are pregnant or breastfeeding.
- You are under 18.
- You have untreated decay or active gum disease — we treat those first.

## Sensitivity
Common for 24 to 48 hours. A desensitising gel is included and usually
settles it.`,
    tags: ["whitening", "cosmetic", "sensitivity"],
    language: "en",
    status: "draft",
    authorId: "d1",
    created: shiftDate(TODAY, -5),
    updated: shiftDate(TODAY, -1),
    version: 1,
    attachments: [],
    citations: 0,
  },
  {
    id: "kb-11",
    title: "Do you treat nervous patients?",
    category: "Frequently Asked Questions",
    summary: "What we offer patients who find dental visits difficult.",
    body: `## Yes — tell us when you book
We allow longer appointments for anxious patients so nothing is rushed, and
we agree a stop signal before we start.

## What we can offer
- A consultation with no treatment at all, just to talk and look around.
- Appointments at quieter times of day.
- Intravenous sedation for longer procedures, with a trained second clinician present.

## Bringing someone
You are welcome to bring a friend or family member into the room.`,
    tags: ["anxiety", "sedation", "first visit"],
    language: "en",
    status: "published",
    authorId: "u-recep-1",
    created: shiftDate(TODAY, -75),
    updated: shiftDate(TODAY, -20),
    version: 3,
    attachments: [],
    citations: 58,
  },
  {
    id: "kb-12",
    title: "Gum disease: stages and treatment",
    category: "Dental Conditions",
    summary:
      "From gingivitis to periodontitis, what changes and what treatment involves.",
    body: `## Gingivitis
Gums bleed when brushed and look red or puffy. Entirely reversible with
thorough cleaning at home and a professional clean.

## Periodontitis
The supporting bone starts to be lost. This is not reversible, but it can be
stopped. Treatment is deep cleaning below the gum line, quadrant by quadrant,
under local anaesthetic.

## Keeping it stable
Three-monthly maintenance visits, interdental brushes daily, and stopping
smoking if you smoke — it is the single biggest factor.`,
    tags: ["periodontitis", "gingivitis", "bleeding gums"],
    language: "en",
    status: "published",
    authorId: "d6",
    created: shiftDate(TODAY, -65),
    updated: shiftDate(TODAY, -6),
    version: 2,
    attachments: [],
    citations: 51,
  },
  {
    id: "kb-13",
    title: "Amalgam filling removal on request",
    category: "Treatment Instructions",
    summary:
      "Our position on replacing sound amalgam fillings when a patient asks.",
    body: `## Our position
We do not routinely remove sound amalgam fillings. There is no good evidence
that doing so improves health, and drilling out an intact filling removes
healthy tooth with it.

## When we will replace one
- The filling has fractured, is leaking, or there is decay underneath.
- The tooth needs a different restoration for structural reasons.
- You have a diagnosed allergy, confirmed by a specialist.

## If you still want it removed
We will discuss it with you, explain the trade-offs in writing, and refer you
if we are not the right practice for it.`,
    tags: ["amalgam", "mercury", "replacement"],
    language: "en",
    status: "archived",
    authorId: "d1",
    reviewerId: "d1",
    reviewedOn: shiftDate(TODAY, -140),
    created: shiftDate(TODAY, -200),
    updated: shiftDate(TODAY, -48),
    version: 3,
    attachments: [],
    citations: 0,
  },
  {
    id: "kb-14",
    title: "Children's first dental visit",
    category: "Frequently Asked Questions",
    summary: "When to bring a child, and what happens at the first appointment.",
    body: `## When
By their first birthday, or within six months of the first tooth appearing —
whichever comes first. Early visits are about familiarity, not treatment.

## What happens
A ride in the chair, a count of the teeth, and a look at how they are coming
through. Nothing that hurts. We keep it short and let them set the pace.

## What helps beforehand
Avoid words like "hurt", "needle" or "drill", even reassuringly. Children
hear the noun, not the reassurance.`,
    tags: ["children", "first visit", "paediatric"],
    language: "en",
    status: "in_review",
    authorId: "d5",
    created: shiftDate(TODAY, -8),
    updated: shiftDate(TODAY, -2),
    version: 1,
    attachments: [],
    citations: 0,
  },
];

export const articleById = (id: string) => articles.find((a) => a.id === id);
