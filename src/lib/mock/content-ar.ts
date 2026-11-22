/**
 * The Arabic half of the fixture content. See ./localize.ts for why this is
 * kept out of `src/locales`.
 *
 * Patient and clinician names stay as written. A person's name is not copy
 * to be translated — a record stores the name once and shows it as given,
 * and a register that transliterated its patients would be wrong in a real
 * clinic as well as in this one.
 */
import type { Doctor } from "../types";
import type { Service } from "./schedule";
import type { ArabicFields } from "./localize";

/* ------------------------------------------------------- service catalogue */

export const SERVICE_AR: ArabicFields<Service> = {
  sv1: { name: "فحص دوري وتنظيف", category: "وقائي" },
  sv2: { name: "تبييض الأسنان", category: "تجميلي" },
  sv3: { name: "حشو تجميلي", category: "ترميمي" },
  sv4: { name: "علاج عصب", category: "علاج الجذور" },
  sv5: { name: "تركيب تاج", category: "تركيبات" },
  sv6: { name: "زراعة سن", category: "جراحة الفم" },
  sv7: { name: "مراجعة تقويم شفاف", category: "تقويم" },
  sv8: { name: "تنظيف عميق", category: "علاج اللثة" },
  sv9: { name: "فحص أطفال", category: "طب أسنان الأطفال" },
  sv10: { name: "أشعة رقمية وتصوير", category: "تشخيص" },
  sv11: { name: "تخدير وريدي", category: "جراحة الفم" },
  sv12: { name: "تركيب واقي ليلي", category: "تركيبات" },
};

/** Catalogue descriptions, keyed by the same service id. */
export const SERVICE_DESCRIPTION_AR: Record<string, string> = {
  sv1: "فحص شامل مع تنظيف وتلميع، وفحص لسرطان الفم وخطة عناية شخصية. يُنصح به كل ستة أشهر.",
  sv2: "تبييض في العيادة مع قوالب مخصصة للمتابعة في المنزل. يشمل تقييم درجة اللون ومراجعة الحساسية.",
  sv3: "ترميم بمادة مركبة بلون السن للتسوس أو الكسر، مطابق للون المينا المحيطة.",
  sv4: "علاج لبّ السن بمساعدة المجهر لإزالة اللب الملتهب وإغلاق القناة. يكتمل عادة على زيارتين.",
  sv5: "تاج خزفي مصمم رقميًا، يُصنع ويُركَّب لترميم سن متضرر أو معالَج عصبيًا.",
  sv6: "زرعة من التيتانيوم تُوضع تحت تخدير موضعي، مع فترة التئام قبل تركيب التاج النهائي.",
  sv7: "مراجعة تقدّم لمرضى التقويم الشفاف، تشمل فحص الملاءمة والتعديلات والمجموعة التالية من القوالب.",
  sv8: "تقليح تحت اللثة وتسوية الجذور لعلاج أمراض اللثة، يُجرى بالربع تحت تخدير موضعي.",
  sv9: "فحص ملائم للأطفال مع طلاء الفلورايد وتقييم سد الشقوق، في زيارة بإيقاع يناسب الصغار.",
  sv10: "صور أشعة رقمية منخفضة الجرعة ومسح داخل الفم، تُقرأ في اليوم نفسه وتُحفظ في ملف المريض.",
  sv11: "تخدير وريدي للمرضى القلقين وللعمليات الجراحية الأطول، يُقدَّم بحضور طبيب ثانٍ مدرَّب.",
  sv12: "واقي ليلي مصبوب خصيصًا لعلاج صرير الأسنان، يُؤخذ من مسح داخل الفم ويُركَّب في زيارة ثانية.",
};

/* ------------------------------------------------------- clinician records */

/** Specialty and operatory. The clinicians' names are left as written. */
export const DOCTOR_AR: ArabicFields<Doctor> = {
  d1: { specialty: "تركيبات", room: "غرفة العلاج 1" },
  d2: { specialty: "جراحة الفم", room: "غرفة العلاج 3" },
  d3: { specialty: "تقويم", room: "غرفة العلاج 2" },
  d4: { specialty: "علاج الجذور", room: "غرفة العلاج 4" },
  d5: { specialty: "طب أسنان الأطفال", room: "غرفة العلاج 5" },
  d6: { specialty: "علاج اللثة", room: "غرفة العلاج 6" },
};

/** Job titles on the clinician profile, matched on the English title. */
export const DOCTOR_TITLE_AR: Record<string, string> = {
  "Lead Prosthodontist": "استشاري التركيبات الأول",
  "Consultant Oral Surgeon": "استشاري جراحة الفم",
  Orthodontist: "أخصائي تقويم",
  Endodontist: "أخصائي علاج جذور",
  "Paediatric Dentist": "أخصائي طب أسنان الأطفال",
  Periodontist: "أخصائي لثة",
};

/** Branch names. */
export const BRANCH_AR: Record<string, string> = {
  "Harbour Street": "شارع الهاربر",
  "Lindendal Clinic": "عيادة ليندندال",
};

/** Languages a clinician speaks. */
export const LANGUAGE_AR: Record<string, string> = {
  English: "الإنجليزية",
  Arabic: "العربية",
  French: "الفرنسية",
  German: "الألمانية",
  Spanish: "الإسبانية",
  Mandarin: "الصينية",
};

/* --------------------------------------------------------- knowledge base */

/** Article categories, matched on the English label. */
export const ARTICLE_CATEGORY_AR: Record<string, string> = {
  "Appointment Policies": "سياسات المواعيد",
  "Clinic Information": "معلومات العيادة",
  "Dental Conditions": "حالات الأسنان",
  "Dental Services": "خدمات الأسنان",
  "Emergency Guidelines": "إرشادات الطوارئ",
  "Frequently Asked Questions": "الأسئلة الشائعة",
  "Post-Operative Instructions": "تعليمات ما بعد العملية",
  "Pricing Information": "معلومات الأسعار",
  "Treatment Instructions": "تعليمات العلاج",
};

/* ------------------------------------------------------------ appointments */

/**
 * Appointments carry the treatment as free text rather than a catalogue
 * reference — some labels are session-specific ("Root canal — session 2")
 * and two of them have no catalogue entry at all. They are matched on the
 * English label here rather than by id, which is the honest way to localize
 * data shaped like this; if the appointment record ever grows a required
 * `serviceId`, this map can go.
 */
export const APPOINTMENT_SERVICE_AR: Record<string, string> = {
  "Aligner review": "مراجعة تقويم شفاف",
  "Composite veneers consult": "استشارة قشور تجميلية",
  "Crown fitting": "تركيب تاج",
  "Deep cleaning": "تنظيف عميق",
  "Implant placement": "زراعة سن",
  "Paediatric check-up": "فحص أطفال",
  "Post-op review": "مراجعة بعد العملية",
  "Retainer scan": "مسح مثبّت التقويم",
  "Root canal — session 2": "علاج عصب — الجلسة الثانية",
  "Wisdom tooth extraction": "خلع ضرس العقل",
  "Routine check-up & clean": "فحص دوري وتنظيف",
  "Teeth whitening": "تبييض الأسنان",
  "Composite filling": "حشو تجميلي",
  "Root canal therapy": "علاج عصب",
  "Digital X-ray & imaging": "أشعة رقمية وتصوير",
  "IV sedation": "تخدير وريدي",
  "Night guard fitting": "تركيب واقي ليلي",
};

/* ----------------------------------------------------- treatment plans */

/**
 * Plan titles and the name of each session, matched on the English label.
 * Both are generated from a handful of archetypes, so the same dozen or so
 * strings cover every plan in the fixture.
 */
export const PLAN_TITLE_AR: Record<string, string> = {
  "Clear aligner course": "برنامج تقويم شفاف",
  "Full-mouth rehabilitation": "تأهيل الفم الكامل",
  "Implant and crown — 36": "زراعة وتاج — 36",
  "Periodontal stabilisation": "تثبيت حالة اللثة",
  "Upper-left quadrant restoration": "ترميم الربع العلوي الأيسر",
};

export const PLAN_STEP_AR: Record<string, string> = {
  "Aligner fitting": "تركيب التقويم الشفاف",
  "Baseline charting and imaging": "تسجيل الحالة الأولية والتصوير",
  "Composite filling": "حشو تجميلي",
  "Composite restoration": "ترميم تجميلي",
  "Crown fitting": "تركيب تاج",
  "Deep cleaning — lower quadrants": "تنظيف عميق — الربعان السفليان",
  "Deep cleaning — upper quadrants": "تنظيف عميق — الربعان العلويان",
  "Diagnostics and imaging": "التشخيص والتصوير",
  "Implant placement": "زراعة سن",
  "Maintenance review": "مراجعة صيانة",
  "Periodontal therapy": "علاج اللثة",
  "Progress review — stage 2": "مراجعة التقدم — المرحلة 2",
  "Progress review — stage 3": "مراجعة التقدم — المرحلة 3",
  "Records and intraoral scan": "التسجيلات والمسح داخل الفم",
  "Retention review": "مراجعة التثبيت",
  "Review appointment": "موعد مراجعة",
  "Root canal therapy": "علاج عصب",
  "Scale and polish": "تقليح وتلميع",
};
