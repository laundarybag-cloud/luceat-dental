/**
 * Service catalogue.
 *
 * `services` in ./schedule.ts stays the canonical booking record (id, name,
 * category, duration, price) because the appointment book reads it. This
 * module enriches those entries for the catalogue screen and derives the
 * assigned clinicians from the doctor profiles, so the two can never disagree
 * about who provides what.
 */
import { services, type Service } from "./schedule";
import { doctorProfiles } from "./doctors";
import { withArabic, type ArabicFields } from "./localize";
import { SERVICE_AR, SERVICE_DESCRIPTION_AR } from "./content-ar";

export interface CatalogueEntry extends Service {
  description: string;
  image: string;
  active: boolean;
  /** Preparation and turnaround time the chair needs beyond the appointment. */
  bufferMin: number;
  /** Derived — never stored twice. */
  doctorIds: string[];
}

const DETAIL: Record<
  string,
  { description: string; image: string; active: boolean; bufferMin: number }
> = {
  sv1: {
    description:
      "Full examination, scale and polish, with oral-cancer screening and a personalised hygiene plan. Recommended every six months.",
    image: "/images/services/checkup.jpg",
    active: true,
    bufferMin: 5,
  },
  sv2: {
    description:
      "In-chair whitening with custom trays for at-home maintenance. Includes a shade assessment and sensitivity review.",
    image: "/images/services/whitening.jpg",
    active: true,
    bufferMin: 10,
  },
  sv3: {
    description:
      "Tooth-coloured composite restoration for decay or chipping, shade-matched to the surrounding enamel.",
    image: "/images/services/filling.jpg",
    active: true,
    bufferMin: 5,
  },
  sv4: {
    description:
      "Microscope-assisted endodontic treatment to remove infected pulp and seal the canal. Usually completed over two visits.",
    image: "/images/services/rootcanal.jpg",
    active: true,
    bufferMin: 15,
  },
  sv5: {
    description:
      "Digitally designed ceramic crown, milled and fitted to restore a damaged or root-treated tooth.",
    image: "/images/services/crown.jpg",
    active: true,
    bufferMin: 10,
  },
  sv6: {
    description:
      "Titanium implant placed under local anaesthetic, with a healing period before the final crown is fitted.",
    image: "/images/services/implant.jpg",
    active: true,
    bufferMin: 20,
  },
  sv7: {
    description:
      "Progress review for clear aligner patients, including fit checks, refinements and the next set of trays.",
    image: "/images/services/aligner.jpg",
    active: true,
    bufferMin: 5,
  },
  sv8: {
    description:
      "Subgingival scaling and root planing for gum disease, delivered by quadrant under local anaesthetic.",
    image: "/images/services/hygiene.jpg",
    active: true,
    bufferMin: 10,
  },
  sv9: {
    description:
      "Child-friendly examination with fluoride varnish and fissure-sealant assessment, in a visit paced for young patients.",
    image: "/images/services/paediatric.jpg",
    active: true,
    bufferMin: 5,
  },
  sv10: {
    description:
      "Low-dose digital radiographs and intraoral scanning, reported the same day and stored to the patient record.",
    image: "/images/services/imaging.jpg",
    active: true,
    bufferMin: 5,
  },
  // No photography for these two yet. An empty string is honest — the card
  // renders a designed "no image" tile rather than a borrowed stock photo.
  sv11: {
    description:
      "Intravenous sedation for anxious patients and longer surgical procedures, delivered with a trained second clinician present.",
    image: "",
    active: true,
    bufferMin: 30,
  },
  sv12: {
    description:
      "Custom-moulded night guard for bruxism, taken from an intraoral scan and fitted at a second visit.",
    image: "",
    active: false,
    bufferMin: 5,
  },
};

/**
 * Spreading a service copies the *current* value of its localized getters,
 * which at module load is the English one, so the catalogue re-attaches
 * them over the merged record. Name and category come from the shared
 * service entry; the long description belongs to the catalogue alone.
 */
const CATALOGUE_AR: ArabicFields<CatalogueEntry> = Object.fromEntries(
  services.map((s) => [
    s.id,
    { ...SERVICE_AR[s.id], description: SERVICE_DESCRIPTION_AR[s.id] },
  ])
);

export const catalogue: CatalogueEntry[] = withArabic(
  services.map((s) => ({
    ...s,
    ...DETAIL[s.id],
    doctorIds: doctorProfiles
      .filter((d) => d.serviceIds.includes(s.id))
      .map((d) => d.id),
  })),
  CATALOGUE_AR
);

export const catalogueById = (id: string) => catalogue.find((s) => s.id === id);

/** A service can only be booked if it is active and someone provides it. */
export const isBookable = (entry: CatalogueEntry) =>
  entry.active &&
  entry.doctorIds.some(
    (id) => doctorProfiles.find((d) => d.id === id)?.status === "active"
  );

export const bookableServiceIds = new Set(
  catalogue.filter(isBookable).map((s) => s.id)
);

export interface Category {
  name: string;
  /** Short line shown in category management. */
  blurb: string;
}

export const categories: Category[] = [
  { name: "Preventive", blurb: "Routine care that keeps patients out of the chair." },
  { name: "Cosmetic", blurb: "Elective treatments for appearance and confidence." },
  { name: "Restorative", blurb: "Repairing damaged or decayed teeth." },
  { name: "Endodontics", blurb: "Treatment of the pulp and root canal system." },
  { name: "Prosthodontics", blurb: "Crowns, bridges and prosthetic replacement." },
  { name: "Oral Surgery", blurb: "Surgical procedures including implants and extractions." },
  { name: "Orthodontics", blurb: "Alignment of teeth and jaws." },
  { name: "Periodontics", blurb: "Gum health and supporting structures." },
  { name: "Paediatric", blurb: "Care designed around children and teenagers." },
  { name: "Diagnostics", blurb: "Imaging and investigations that inform treatment." },
];

export const categoryStats = () =>
  categories.map((c) => {
    const items = catalogue.filter((s) => s.category === c.name);
    return {
      ...c,
      total: items.length,
      active: items.filter((s) => s.active).length,
      revenue: items.reduce((sum, s) => sum + s.price, 0),
    };
  });
