# Image asset manifest — Luceat Dental

Every image in this folder is a **real photograph downloaded locally** (28 files,
~1.0 MB total). Nothing is a placeholder, a generated gradient, or a hotlink.

## Source & licence

All photographs come from **Unsplash** under the
[Unsplash License](https://unsplash.com/license): free for commercial and
non-commercial use, no permission or attribution required. They are stored
locally rather than hotlinked so production never depends on a third-party CDN.

Re-download or verify the whole set with:

```bash
bash scripts/fetch-assets.sh
```

The script skips files already present and prints `FAIL` (and deletes the
partial file) for anything that does not return HTTP 200 — so a broken URL can
never silently become a broken image.

## Selection rules applied

1. Every photo was chosen for topical relevance (dentistry, clinical settings,
   healthcare professionals) — no generic filler.
2. Portraits were screened for background saturation with
   `node scripts/inspect-portraits.mjs`; one studio shot on a bright red
   backdrop was rejected and replaced because it clashed with the palette.
3. Crops are fixed per role (`crop=faces` for people, 16:9 for banners,
   1:1 for thumbnails) so aspect ratios stay consistent across the UI.
4. Delivered through `next/image`, which serves AVIF/WebP at the rendered size.

## Inventory

| Path | Role | Rendered at |
| --- | --- | --- |
| `doctors/*.jpg` (8) | Clinician avatars and profile cards | 400×400 |
| `patients/p01–p08.jpg` | Patient avatars in schedules and lists | 200×200 |
| `scenes/operatory.jpg` | Dashboard welcome banner | 1200×675 |
| `scenes/chairside.jpg` | Treatment / procedure imagery | 1200×675 |
| `scenes/waiting-room.jpg` | Module headers, empty states | 800×560 |
| `scenes/equipment.jpg` | Clinic / facility sections | 800×560 |
| `scenes/xray-review.jpg` | Medical records, imaging | 800×560 |
| `scenes/xray-panoramic.jpg` | Dental chart, radiographs | 800×560 |
| `scenes/tooth-model.jpg` | Treatment plans, patient education | 800×560 |
| `scenes/smile.jpg` | Outcome / marketing surfaces | 800×560 |
| `services/*.jpg` (4) | Service catalogue thumbnails | 320×320 |

## Note on patient imagery

The `patients/` portraits are stock photographs of models used to make the
interface realistic during development. They are **not** patient data. Before
production they must be replaced by either real patient photos captured with
documented consent, or by the initials fallback that `<Avatar>` already renders
when `src` is absent or fails to load.
