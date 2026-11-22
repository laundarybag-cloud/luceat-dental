#!/usr/bin/env bash
# Luceat Dental — image asset fetcher.
# Downloads the curated Unsplash photo set into public/images so production
# serves local, optimized files instead of hotlinking a third-party CDN.
# All photos are from Unsplash (Unsplash License — free for commercial use,
# no attribution required). See public/images/ASSETS.md for the full manifest.
set -u
cd "$(dirname "$0")/.."

fetch () { # name | photo-id | params
  local out="$1" id="$2" params="$3"
  if [ -s "$out" ]; then echo "skip   $out"; return; fi
  local code
  code=$(curl -sS --max-time 60 -o "$out" -w "%{http_code}" \
    "https://images.unsplash.com/${id}?${params}&q=80&fm=jpg&auto=format")
  if [ "$code" = "200" ] && [ -s "$out" ]; then
    echo "ok     $out ($(wc -c < "$out") bytes)"
  else
    rm -f "$out"; echo "FAIL   $out (http $code)"
  fi
}

SQ="w=400&h=400&fit=crop&crop=faces"
SQS="w=200&h=200&fit=crop&crop=faces"
WIDE="w=1200&h=675&fit=crop"
CARD="w=800&h=560&fit=crop"

mkdir -p public/images/doctors public/images/patients public/images/scenes public/images/services

# ---- Doctors (professional healthcare portraits) ----
fetch public/images/doctors/amelia-hart.jpg   photo-1643297654416-05795d62e39c "$SQ"
fetch public/images/doctors/omar-khalid.jpg   photo-1637059824899-a441006a6875 "$SQ"
fetch public/images/doctors/lena-moreau.jpg   photo-1673865641073-4479f93a7776 "$SQ"
fetch public/images/doctors/samuel-reed.jpg   photo-1622253692010-333f2da6031d "$SQ"
fetch public/images/doctors/yasmin-haddad.jpg photo-1623854767648-e7bb8009f0db "$SQ"
fetch public/images/doctors/david-chen.jpg    photo-1645066928295-2506defde470 "$SQ"
fetch public/images/doctors/noor-saleh.jpg    photo-1758691462651-611d730c5272 "$SQ"
fetch public/images/doctors/elias-weber.jpg   photo-1758691463582-11aea602cd4a "$SQ"

# ---- Patients (consenting-adult stock portraits) ----
fetch public/images/patients/p01.jpg photo-1494790108377-be9c29b29330 "$SQS"
fetch public/images/patients/p02.jpg photo-1507003211169-0a1dd7228f2d "$SQS"
fetch public/images/patients/p03.jpg photo-1580489944761-15a19d654956 "$SQS"
fetch public/images/patients/p04.jpg photo-1531750026848-8ada78f641c2 "$SQS"
fetch public/images/patients/p05.jpg photo-1607990283143-e81e7a2c9349 "$SQS"
fetch public/images/patients/p06.jpg photo-1592234789031-94bf65f630ed "$SQS"
fetch public/images/patients/p07.jpg photo-1562337404-3044c84ac061 "$SQS"
fetch public/images/patients/p08.jpg photo-1757744705465-ea08b0ddc38a "$SQS"

# ---- Clinic scenes / banners / empty states ----
fetch public/images/scenes/operatory.jpg      photo-1704455306251-b4634215d98f "$WIDE"
fetch public/images/scenes/equipment.jpg      photo-1704455306925-1401c3012117 "$CARD"
fetch public/images/scenes/waiting-room.jpg   photo-1762625570087-6d98fca29531 "$CARD"
fetch public/images/scenes/xray-review.jpg    photo-1588776814546-1ffcf47267a5 "$CARD"
fetch public/images/scenes/xray-panoramic.jpg photo-1777445374290-eedda5be8e5b "$CARD"
fetch public/images/scenes/tooth-model.jpg    photo-1777793389944-f7165259a05c "$CARD"
fetch public/images/scenes/chairside.jpg      photo-1606811971618-4486d14f3f99 "$WIDE"
fetch public/images/scenes/smile.jpg          photo-1489278353717-f64c6ee8a4d2 "$CARD"

# ---- Service catalogue thumbnails ----
fetch public/images/services/whitening.jpg    photo-1677026010083-78ec7f1b84ed "w=320&h=320&fit=crop"
fetch public/images/services/checkup.jpg      photo-1606811841689-23dfddce3e95 "w=320&h=320&fit=crop"
fetch public/images/services/imaging.jpg      photo-1600170311833-c2cf5280ce49 "w=320&h=320&fit=crop"
fetch public/images/services/hygiene.jpg      photo-1730597842283-943c7986ee2c "w=320&h=320&fit=crop"

# ---- Service catalogue, remaining treatments (Module 05) ----
fetch public/images/services/filling.jpg    photo-1657470179447-0f5aa16daa91 "w=640&h=440&fit=crop"
fetch public/images/services/rootcanal.jpg  photo-1588776814546-daab30f310ce "w=640&h=440&fit=crop"
fetch public/images/services/crown.jpg      photo-1771442873035-474765b40ac6 "w=640&h=440&fit=crop"
fetch public/images/services/implant.jpg    photo-1777444270707-850bfe730c10 "w=640&h=440&fit=crop"
fetch public/images/services/aligner.jpg    photo-1609840114035-3c981b782dfe "w=640&h=440&fit=crop"
fetch public/images/services/paediatric.jpg photo-1758205307836-0829c799890b "w=640&h=440&fit=crop"
