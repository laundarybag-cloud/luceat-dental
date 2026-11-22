/**
 * Patient assistant: conversations, the unanswered queue and safety rules.
 *
 * Every metric on the module is derived from these conversations rather than
 * stated as a number, and every assistant turn that used the knowledge base
 * names the article ids it drew on — rendered through the same publish gate
 * the Knowledge Center enforces.
 */
import type { KnowledgeCategory } from "@/lib/knowledge";
import { TODAY } from "./schedule";

export type ConversationStatus =
  | "active"
  | "resolved"
  | "escalated"
  | "unresolved";

export type ConversationTopic =
  | "Booking"
  | "Aftercare"
  | "Pricing"
  | "Clinic info"
  | "Symptoms"
  | "Policies";

export interface Message {
  id: string;
  from: "patient" | "assistant" | "staff";
  at: string;
  text: string;
  /** Knowledge articles this answer drew on. */
  articleIds?: string[];
  /** A real action the assistant took on the clinic's systems. */
  action?: {
    kind: "booked" | "rescheduled" | "cancelled" | "handoff";
    detail: string;
  };
  /** Set when a safety rule changed what the assistant said. */
  safetyRuleId?: string;
}

export interface Conversation {
  id: string;
  ref: string;
  patientName: string;
  patientId?: string;
  avatar?: string;
  topic: ConversationTopic;
  status: ConversationStatus;
  startedAt: string;
  channel: "Web chat" | "WhatsApp" | "SMS";
  messages: Message[];
  /** Patient rating, 1–5, when given. */
  rating?: number;
  feedback?: string;
  bookingMade: boolean;
  handoffReason?: string;
}

const shift = (days: number) => {
  const d = new Date(`${TODAY}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const at = (days: number, time: string) => `${shift(days)}T${time}:00.000Z`;

export const conversations: Conversation[] = [
  {
    id: "cv-1",
    ref: "#2301",
    patientName: "Clara Whitfield",
    patientId: "pt1",
    avatar: "/images/patients/p01.jpg",
    topic: "Booking",
    status: "resolved",
    startedAt: at(0, "09:41"),
    channel: "Web chat",
    bookingMade: true,
    rating: 5,
    feedback: "Quicker than phoning. Had the time I wanted within a minute.",
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(0, "09:41"),
        text: "Hi, can I move my crown fitting next week to a morning?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(0, "09:41"),
        text: "Of course. Your crown fitting is Thursday 26 November at 14:30 with Dr. Hart. She has 09:15 and 11:00 free that morning — would either suit?",
        articleIds: ["kb-4"],
      },
      {
        id: "m3",
        from: "patient",
        at: at(0, "09:42"),
        text: "09:15 please",
      },
      {
        id: "m4",
        from: "assistant",
        at: at(0, "09:43"),
        text: "Done — Thursday 26 November, 09:15 with Dr. Hart. I've sent a confirmation and we'll remind you 48 hours before.",
        action: {
          kind: "rescheduled",
          detail: "Moved crown fitting to 26 Nov 09:15 with Dr. Amelia Hart",
        },
        articleIds: ["kb-4"],
      },
    ],
  },
  {
    id: "cv-2",
    ref: "#2300",
    patientName: "Daniel Okafor",
    patientId: "pt2",
    avatar: "/images/patients/p02.jpg",
    topic: "Symptoms",
    status: "escalated",
    startedAt: at(0, "08:12"),
    channel: "WhatsApp",
    bookingMade: false,
    handoffReason: "Pain with facial swelling — safety rule requires a clinician.",
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(0, "08:12"),
        text: "My face is swollen on the left side and it's throbbing since last night",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(0, "08:12"),
        text: "I'm sorry — that needs a clinician, not me. Swelling with pain can need urgent treatment. If it's affecting your breathing or swallowing, go to A&E now. Otherwise I'm passing this to the clinic and someone will call you shortly.",
        articleIds: ["kb-6"],
        safetyRuleId: "sr-2",
      },
      {
        id: "m3",
        from: "assistant",
        at: at(0, "08:12"),
        text: "Handed to the clinic team.",
        action: { kind: "handoff", detail: "Escalated to reception — urgent callback" },
      },
      {
        id: "m4",
        from: "staff",
        at: at(0, "08:26"),
        text: "Called the patient and booked an emergency slot at 11:15 with Dr. Khalid. — Hana",
      },
    ],
  },
  {
    id: "cv-3",
    ref: "#2299",
    patientName: "Visitor",
    topic: "Pricing",
    status: "resolved",
    startedAt: at(0, "07:55"),
    channel: "Web chat",
    bookingMade: false,
    rating: 4,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(0, "07:55"),
        text: "How much is a check up and clean?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(0, "07:56"),
        text: "A routine check-up and clean is $120. That covers the examination, scale and polish, and an oral-cancer screening. If anything further is needed you'd get a written estimate before any treatment starts.",
        articleIds: ["kb-5"],
      },
    ],
  },
  {
    id: "cv-4",
    ref: "#2298",
    patientName: "Ingrid Larsen",
    patientId: "pt3",
    avatar: "/images/patients/p03.jpg",
    topic: "Aftercare",
    status: "resolved",
    startedAt: at(-1, "19:22"),
    channel: "Web chat",
    bookingMade: false,
    rating: 5,
    feedback: "Reassuring at 11pm when I couldn't ring anyone.",
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-1, "19:22"),
        text: "I had a tooth out this afternoon and it's still oozing a bit. Is that normal?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-1, "19:23"),
        text: "Some oozing for several hours is normal. Bite firmly on clean gauze for 30–45 minutes without changing it, keep your head propped up, and avoid rinsing or using a straw today. If it soaks a fresh pad after an hour of firm pressure, that's not normal — call the clinic or the out-of-hours number.",
        articleIds: ["kb-1"],
      },
      {
        id: "m3",
        from: "patient",
        at: at(-1, "19:40"),
        text: "Stopped after the gauze. Thank you",
      },
    ],
  },
  {
    id: "cv-5",
    ref: "#2297",
    patientName: "Visitor",
    topic: "Symptoms",
    status: "unresolved",
    startedAt: at(-1, "16:04"),
    channel: "Web chat",
    bookingMade: false,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-1, "16:04"),
        text: "Do you do dental implants on finance over 24 months?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-1, "16:04"),
        text: "I can tell you that longer treatment plans can be paid session by session with no interest, but I don't have anything published about a 24-month finance arrangement. I've passed your question to the clinic so they can answer properly.",
        articleIds: ["kb-5"],
        safetyRuleId: "sr-3",
      },
    ],
  },
  {
    id: "cv-6",
    ref: "#2296",
    patientName: "Marco Bianchi",
    patientId: "pt4",
    avatar: "/images/patients/p04.jpg",
    topic: "Booking",
    status: "resolved",
    startedAt: at(-1, "11:30"),
    channel: "SMS",
    bookingMade: true,
    rating: 4,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-1, "11:30"),
        text: "need to cancel thursday",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-1, "11:31"),
        text: "Cancelled your aligner review on Thursday 26 November. That's more than 48 hours' notice so there's no charge. Would you like me to find another time?",
        articleIds: ["kb-4"],
        action: { kind: "cancelled", detail: "Cancelled aligner review, 26 Nov" },
      },
      {
        id: "m3",
        from: "patient",
        at: at(-1, "11:33"),
        text: "yes next week sometime",
      },
      {
        id: "m4",
        from: "assistant",
        at: at(-1, "11:33"),
        text: "Booked Tuesday 1 December at 10:00 with Dr. Moreau.",
        action: { kind: "booked", detail: "Aligner review, 1 Dec 10:00" },
      },
    ],
  },
  {
    id: "cv-7",
    ref: "#2295",
    patientName: "Visitor",
    topic: "Clinic info",
    status: "resolved",
    startedAt: at(-2, "14:10"),
    channel: "Web chat",
    bookingMade: false,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-2, "14:10"),
        text: "Is there parking at the Lindendal clinic?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-2, "14:10"),
        text: "Yes — a small car park at the rear, free for patients for two hours. That site is entirely on one level if step-free access matters.",
        articleIds: ["kb-7"],
      },
    ],
  },
  {
    id: "cv-8",
    ref: "#2294",
    patientName: "Priya Raman",
    patientId: "pt5",
    avatar: "/images/patients/p05.jpg",
    topic: "Symptoms",
    status: "escalated",
    startedAt: at(-2, "09:02"),
    channel: "Web chat",
    bookingMade: false,
    handoffReason: "Patient asked for a diagnosis — the assistant must not give one.",
    rating: 3,
    feedback: "Understandable but I'd hoped for an answer there and then.",
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-2, "09:02"),
        text: "I've got a white patch on my gum that won't go. Is it cancer?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-2, "09:02"),
        text: "I can't tell you what it is — that needs a clinician who can look at it. What I can do is get you seen quickly. Most white patches are harmless, but anything lasting more than two weeks should be examined. Shall I find you an appointment this week?",
        safetyRuleId: "sr-1",
      },
      {
        id: "m3",
        from: "patient",
        at: at(-2, "09:04"),
        text: "yes please",
      },
      {
        id: "m4",
        from: "assistant",
        at: at(-2, "09:05"),
        text: "I've asked the clinic to call you today to arrange it, as this should be seen soon rather than at the next free online slot.",
        action: { kind: "handoff", detail: "Escalated to reception — same-day callback" },
      },
    ],
  },
  {
    id: "cv-9",
    ref: "#2293",
    patientName: "Hannah Voss",
    patientId: "pt7",
    avatar: "/images/patients/p07.jpg",
    topic: "Policies",
    status: "resolved",
    startedAt: at(-3, "13:44"),
    channel: "Web chat",
    bookingMade: false,
    rating: 5,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-3, "13:44"),
        text: "What happens if I'm running late?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-3, "13:44"),
        text: "If you're more than 10 minutes late we may need to shorten or rebook, so the clinicians stay on time for everyone after you. Message us if you're held up — we'll do what we can.",
        articleIds: ["kb-4"],
      },
    ],
  },
  {
    id: "cv-10",
    ref: "#2292",
    patientName: "Visitor",
    topic: "Aftercare",
    status: "active",
    startedAt: at(0, "10:02"),
    channel: "Web chat",
    bookingMade: false,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(0, "10:02"),
        text: "How long until I can eat normally after a filling?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(0, "10:02"),
        text: "With a composite filling you can eat as soon as the numbness wears off — usually two to three hours. Take care not to bite your cheek while it's numb.",
        articleIds: ["kb-1"],
      },
      {
        id: "m3",
        from: "patient",
        at: at(0, "10:05"),
        text: "and can I drink coffee?",
      },
    ],
  },
  {
    id: "cv-11",
    ref: "#2291",
    patientName: "Jonas Pettersen",
    patientId: "pt8",
    avatar: "/images/patients/p08.jpg",
    topic: "Booking",
    status: "resolved",
    startedAt: at(-4, "08:50"),
    channel: "WhatsApp",
    bookingMade: true,
    rating: 5,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-4, "08:50"),
        text: "Can I get a check-up before the end of the month?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-4, "08:51"),
        text: "Yes — Dr. Chen has Tuesday 24 November at 10:30, or Friday 27 November at 15:00.",
        articleIds: ["kb-4"],
      },
      {
        id: "m3",
        from: "patient",
        at: at(-4, "08:52"),
        text: "Tuesday",
      },
      {
        id: "m4",
        from: "assistant",
        at: at(-4, "08:52"),
        text: "Booked — Tuesday 24 November, 10:30 with Dr. Chen.",
        action: { kind: "booked", detail: "Check-up, 24 Nov 10:30" },
      },
    ],
  },
  {
    id: "cv-13",
    ref: "#2289",
    patientName: "Daniel Okafor",
    patientId: "pt2",
    avatar: "/images/patients/p02.jpg",
    topic: "Symptoms",
    status: "resolved",
    startedAt: at(-6, "20:15"),
    channel: "Web chat",
    bookingMade: false,
    rating: 4,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-6, "20:15"),
        text: "My gums bleed every time I brush. Should I stop brushing that bit?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-6, "20:16"),
        text: "No — bleeding usually means that area needs more cleaning, not less. Keep brushing gently with a soft brush and clean between the teeth daily. If it is still bleeding after two weeks of that, book a check — it should be looked at.",
        articleIds: ["kb-12"],
      },
    ],
  },
  {
    id: "cv-12",
    ref: "#2290",
    patientName: "Visitor",
    topic: "Pricing",
    status: "unresolved",
    startedAt: at(-5, "17:31"),
    channel: "Web chat",
    bookingMade: false,
    messages: [
      {
        id: "m1",
        from: "patient",
        at: at(-5, "17:31"),
        text: "Do you take Delta Dental insurance?",
      },
      {
        id: "m2",
        from: "assistant",
        at: at(-5, "17:31"),
        text: "I know we're not tied to one insurer and can submit directly for several major providers, but I don't have a published list naming which. I've passed this to the clinic so you get an accurate answer.",
        articleIds: ["kb-5"],
        safetyRuleId: "sr-3",
      },
    ],
  },
];

/* ------------------------------------------------- unanswered questions */

export interface UnansweredQuestion {
  id: string;
  question: string;
  askedCount: number;
  lastAsked: string;
  /** Where a new article would belong. */
  suggestedCategory: KnowledgeCategory;
  conversationRefs: string[];
}

export const unanswered: UnansweredQuestion[] = [
  {
    id: "uq-1",
    question: "Do you offer finance over 12 or 24 months?",
    askedCount: 9,
    lastAsked: shift(-1),
    suggestedCategory: "Pricing Information",
    conversationRefs: ["#2297", "#2281", "#2265"],
  },
  {
    id: "uq-2",
    question: "Which insurers can you bill directly?",
    askedCount: 7,
    lastAsked: shift(-5),
    suggestedCategory: "Pricing Information",
    conversationRefs: ["#2290", "#2274"],
  },
  {
    id: "uq-3",
    question: "Do you treat patients under general anaesthetic?",
    askedCount: 6,
    lastAsked: shift(-2),
    suggestedCategory: "Dental Services",
    conversationRefs: ["#2288", "#2270"],
  },
  {
    id: "uq-4",
    question: "Is there a waiting list for implants?",
    askedCount: 5,
    lastAsked: shift(-3),
    suggestedCategory: "Dental Services",
    conversationRefs: ["#2286"],
  },
  {
    id: "uq-5",
    question: "Can I bring my child to my own appointment?",
    askedCount: 5,
    lastAsked: shift(-4),
    suggestedCategory: "Clinic Information",
    conversationRefs: ["#2284", "#2261"],
  },
  {
    id: "uq-6",
    question: "Do you offer veneers, and what do they cost?",
    askedCount: 4,
    lastAsked: shift(-2),
    suggestedCategory: "Dental Services",
    conversationRefs: ["#2287"],
  },
  {
    id: "uq-7",
    question: "What happens if I need treatment while pregnant?",
    askedCount: 4,
    lastAsked: shift(-6),
    suggestedCategory: "Treatment Instructions",
    conversationRefs: ["#2279"],
  },
  {
    id: "uq-8",
    question: "Are the Saturday appointments more expensive?",
    askedCount: 3,
    lastAsked: shift(-1),
    suggestedCategory: "Pricing Information",
    conversationRefs: ["#2296"],
  },
  {
    id: "uq-9",
    question: "Do you have a hygienist I can see without a dentist?",
    askedCount: 3,
    lastAsked: shift(-7),
    suggestedCategory: "Dental Services",
    conversationRefs: ["#2268"],
  },
  {
    id: "uq-10",
    question: "Can I get a copy of my X-rays to take abroad?",
    askedCount: 3,
    lastAsked: shift(-3),
    suggestedCategory: "Clinic Information",
    conversationRefs: ["#2283"],
  },
  {
    id: "uq-11",
    question: "Is nitrous oxide available for children?",
    askedCount: 2,
    lastAsked: shift(-5),
    suggestedCategory: "Dental Services",
    conversationRefs: ["#2276"],
  },
  {
    id: "uq-12",
    question: "Do you validate parking at Harbour Street?",
    askedCount: 2,
    lastAsked: shift(-8),
    suggestedCategory: "Clinic Information",
    conversationRefs: ["#2259"],
  },
  {
    id: "uq-13",
    question: "How soon after an implant can I fly?",
    askedCount: 2,
    lastAsked: shift(-4),
    suggestedCategory: "Post-Operative Instructions",
    conversationRefs: ["#2282"],
  },
  {
    id: "uq-14",
    question: "Can I pay someone else's invoice on their behalf?",
    askedCount: 2,
    lastAsked: shift(-9),
    suggestedCategory: "Pricing Information",
    conversationRefs: ["#2254"],
  },
];

/* ---------------------------------------------------------- safety rules */

export interface SafetyRule {
  id: string;
  title: string;
  description: string;
  /** What the assistant does when the rule fires. */
  behaviour: "refuse_and_escalate" | "escalate" | "withhold";
  enabled: boolean;
  /** Times it fired in the last 30 days. */
  triggered: number;
  /** Rules that must not be switched off. */
  locked?: boolean;
}

export const safetyRules: SafetyRule[] = [
  {
    id: "sr-1",
    title: "Never give a diagnosis",
    description:
      "The assistant does not name a condition, interpret symptoms or suggest what a patient has. It says a clinician must look, and offers an appointment.",
    behaviour: "refuse_and_escalate",
    enabled: true,
    triggered: 23,
    locked: true,
  },
  {
    id: "sr-2",
    title: "Escalate pain with swelling or bleeding",
    description:
      "Any mention of facial swelling, difficulty swallowing or uncontrolled bleeding is handed to a human immediately, with A&E advice given first.",
    behaviour: "refuse_and_escalate",
    enabled: true,
    triggered: 11,
    locked: true,
  },
  {
    id: "sr-3",
    title: "Answer only from published knowledge",
    description:
      "If nothing published covers the question, the assistant says so and routes it to the clinic rather than guessing. Withheld and draft articles are never used.",
    behaviour: "withhold",
    enabled: true,
    triggered: 38,
    locked: true,
  },
  {
    id: "sr-4",
    title: "No prescribing or medication advice",
    description:
      "The assistant will not recommend, adjust or comment on prescription medicines, including antibiotics and painkillers beyond the published aftercare dose.",
    behaviour: "refuse_and_escalate",
    enabled: true,
    triggered: 7,
    locked: true,
  },
  {
    id: "sr-5",
    title: "Hand over on request",
    description:
      "If a patient asks for a person, the assistant stops and hands over without trying to resolve the question first.",
    behaviour: "escalate",
    enabled: true,
    triggered: 19,
  },
  {
    id: "sr-6",
    title: "No clinical detail to unverified contacts",
    description:
      "Appointment and treatment detail is only given once the contact is matched to a patient record. Otherwise the assistant keeps to general information.",
    behaviour: "withhold",
    enabled: true,
    triggered: 14,
  },
  {
    id: "sr-7",
    title: "Decline out-of-hours emergencies",
    description:
      "Outside opening hours the assistant gives the on-call number rather than booking, so urgent cases are not left waiting for the morning.",
    behaviour: "escalate",
    enabled: false,
    triggered: 0,
  },
];

export const safetyRuleById = (id: string) =>
  safetyRules.find((r) => r.id === id);

/* ------------------------------------------------------------- analytics */

export const conversationById = (id: string) =>
  conversations.find((c) => c.id === id);

export function assistantMetrics() {
  const total = conversations.length;
  const resolved = conversations.filter((c) => c.status === "resolved").length;
  const active = conversations.filter((c) => c.status === "active").length;
  const escalated = conversations.filter((c) => c.status === "escalated").length;
  const unresolved = conversations.filter((c) => c.status === "unresolved").length;
  const bookings = conversations.filter((c) => c.bookingMade).length;
  const rated = conversations.filter((c) => typeof c.rating === "number");
  const satisfaction = rated.length
    ? rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length
    : 0;

  return {
    total,
    resolved,
    active,
    escalated,
    unresolved,
    bookings,
    conversionRate: total ? (bookings / total) * 100 : 0,
    resolutionRate: total ? (resolved / total) * 100 : 0,
    satisfaction,
    rated: rated.length,
    unansweredQuestions: unanswered.length,
    unansweredAsks: unanswered.reduce((s, q) => s + q.askedCount, 0),
  };
}

/** Conversations per day for the last 7 days, by outcome. */
export function dailySeries() {
  const days = Array.from({ length: 7 }, (_, i) => shift(-6 + i));
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
  });
  return days.map((d) => {
    const forDay = conversations.filter((c) => c.startedAt.startsWith(d));
    return {
      day: fmt.format(new Date(`${d}T00:00:00.000Z`)),
      resolved: forDay.filter((c) => c.status === "resolved").length,
      escalated: forDay.filter((c) => c.status === "escalated").length,
      unresolved: forDay.filter((c) => c.status === "unresolved").length,
    };
  });
}

/** Share of conversations by topic. */
export function topicMix() {
  const map = new Map<ConversationTopic, number>();
  for (const c of conversations) {
    map.set(c.topic, (map.get(c.topic) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

/** Which knowledge articles the assistant leans on most. */
export function articleUsage() {
  const map = new Map<string, number>();
  for (const c of conversations) {
    for (const m of c.messages) {
      for (const id of m.articleIds ?? []) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
  }
  return [...map.entries()]
    .map(([articleId, uses]) => ({ articleId, uses }))
    .sort((a, b) => b.uses - a.uses);
}

export const CONVERSATION_STATUS_META: Record<
  ConversationStatus,
  { label: string; chip: string }
> = {
  active: { label: "Active", chip: "bg-status-checkedin-bg text-status-checkedin" },
  resolved: { label: "Resolved", chip: "bg-status-completed-bg text-status-completed" },
  escalated: { label: "Escalated", chip: "bg-status-pending-bg text-status-pending" },
  unresolved: { label: "Unresolved", chip: "bg-status-cancelled-bg text-status-cancelled" },
};
