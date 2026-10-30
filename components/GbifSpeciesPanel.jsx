"use client";

import { useEffect, useRef, useState } from "react";

import { useSiteSettings } from "@/components/SiteSettingsContext";
import { getPhotoCreditParts } from "@/lib/photoCredit";
import { useLeafletMap } from "@/lib/useLeafletMap";

/* =========================================================
   GBIF SPECIES PANEL
   ข้อมูลชนิดพืชจาก GBIF ใต้แผนที่จุดเก็บตัวอย่างในหน้า /plants/[id]
   - โหลดหลังเนื้อหาหลักแสดงแล้ว (component นี้ render เมื่อมีข้อมูลตัวอย่างแล้ว)
   - ระหว่างโหลดแสดง skeleton
   - data เป็น null / error / timeout → ซ่อนทั้งส่วนเงียบๆ
   - ส่วนย่อยที่ไม่มีข้อมูลซ่อนเฉพาะส่วนนั้น

   แผนที่ (https://techdocs.gbif.org/openapi/v2-maps.json, https://tile.gbif.org/ui/)
   - พื้นหลัง: tile.gbif.org/3857/omt (OpenMapTiles) style gbif-light / gbif-dark
   - ชั้นข้อมูล: api.gbif.org/v2/map/occurrence/density ตาม taxonKey แบบ hexagon
========================================================= */

const REQUEST_TIMEOUT_MS = 15000;

const BASEMAP_URL = (dark) =>
  `https://tile.gbif.org/3857/omt/{z}/{x}/{y}@1x.png?style=${dark ? "gbif-dark" : "gbif-light"}`;

const DENSITY_URL = (taxonKey) =>
  `https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?${new URLSearchParams({
    srs: "EPSG:3857",
    taxonKey: String(taxonKey),
    bin: "hex",
    hexPerTile: "40",
    style: "classic.poly",
  })}`;

const BASEMAP_ATTRIBUTION =
  '© <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const DENSITY_ATTRIBUTION =
  'Occurrence data © <a href="https://www.gbif.org" target="_blank" rel="noopener noreferrer">GBIF.org</a>';

const CLASSIFICATION_ORDER = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
];

/* ระดับที่เขียนตัวเอียง */
const ITALIC_RANKS = new Set(["genus", "species"]);

const COPY = {
  TH: {
    eyebrow: "GBIF",
    title: "ข้อมูลชนิดนี้จาก GBIF",
    genusLevel: "(ระดับสกุล)",
    loading: "กำลังโหลดข้อมูลจาก GBIF",
    acceptedName: "ชื่อที่ยอมรับในปัจจุบันคือ",
    classification: "ลำดับอนุกรมวิธาน",
    ranks: {
      kingdom: "อาณาจักร",
      phylum: "ไฟลัม",
      class: "ชั้น",
      order: "อันดับ",
      family: "วงศ์",
      genus: "สกุล",
      species: "ชนิด",
    },
    commonNames: "ชื่อสามัญ",
    thai: "ไทย",
    english: "อังกฤษ",
    occurrences: (world, thailand) =>
      [
        world !== null && `พบบันทึกทั่วโลก ${world} รายการ`,
        thailand !== null && `ในประเทศไทย ${thailand} รายการ`,
      ]
        .filter(Boolean)
        .join(" · "),
    mapTitle: "การกระจายพันธุ์ทั่วโลก",
    mapHint: "จุดหกเหลี่ยมแสดงพื้นที่ที่มีบันทึกการพบใน GBIF",
    photos: "รูปถ่าย",
    photosNote: "รูปจากแหล่งอื่นผ่าน GBIF ไม่ใช่ตัวอย่างของ herbarium นี้",
    photoLink: "เปิดบันทึกนี้บน GBIF (แท็บใหม่)",
    newTab: "(เปิดแท็บใหม่)",
    viewOnGbif: "ดูเพิ่มเติมบน GBIF",
  },
  EN: {
    eyebrow: "GBIF",
    title: "About this species (GBIF)",
    genusLevel: "(genus level)",
    loading: "Loading data from GBIF",
    acceptedName: "The currently accepted name is",
    classification: "Classification",
    ranks: {
      kingdom: "Kingdom",
      phylum: "Phylum",
      class: "Class",
      order: "Order",
      family: "Family",
      genus: "Genus",
      species: "Species",
    },
    commonNames: "Common names",
    thai: "Thai",
    english: "English",
    occurrences: (world, thailand) =>
      [
        world !== null && `${world} records worldwide`,
        thailand !== null && `${thailand} in Thailand`,
      ]
        .filter(Boolean)
        .join(" · "),
    mapTitle: "Global distribution",
    mapHint: "Hexagons show areas with occurrence records in GBIF",
    photos: "Photos",
    photosNote: "Photos from other sources via GBIF, not specimens of this herbarium",
    photoLink: "Open this record on GBIF (new tab)",
    newTab: "(opens in a new tab)",
    viewOnGbif: "View more on GBIF",
  },
};

function formatCount(value) {
  return Number.isFinite(value) ? value.toLocaleString("en-US") : null;
}

export default function GbifSpeciesPanel({ botanicalName, language }) {
  const t = language === "EN" ? COPY.EN : COPY.TH;

  const name = String(botanicalName ?? "").trim();

  /* { forName, data } เมื่อโหลดเสร็จ, data = null คือไม่แสดง */
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!name) return;

    const controller = new AbortController();

    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    fetch(`/api/gbif/species?${new URLSearchParams({ name })}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        setResult({ forName: name, data: body?.ok ? body.data || null : null });
      })
      .catch(() => {
        /* timeout หรือเครือข่ายล่ม: ซ่อนเงียบๆ (ยกเว้นตอน unmount ที่ไม่ต้องทำอะไร) */
        if (!controller.signal.aborted || controller.signal.reason !== "unmount") {
          setResult({ forName: name, data: null });
        }
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      window.clearTimeout(timer);
      controller.abort("unmount");
    };
  }, [name]);

  if (!name) return null;

  /* ผลของชื่อเดิม (เช่นเปลี่ยนหน้าแล้ว) ถือว่ายังโหลดอยู่ */
  const loaded = result && result.forName === name ? result : null;

  if (!loaded) {
    return <PanelSkeleton t={t} />;
  }

  if (!loaded.data) return null;

  return <PanelContent data={loaded.data} t={t} />;
}

/* =========================================================
   CONTENT
========================================================= */

function PanelContent({ data, t }) {
  const isGenus = data.level === "genus";

  const classification = CLASSIFICATION_ORDER.map((rank) => [
    rank,
    data.classification?.[rank] || null,
  ]).filter(([, value]) => value);

  const thaiNames = data.vernacularNames?.th || [];
  const englishNames = data.vernacularNames?.en || [];

  const world = formatCount(data.occurrenceCount);
  const thailand = formatCount(data.occurrenceCountTH);

  const photos = data.photos || [];

  return (
    <section
      data-gbif-panel
      aria-labelledby="gbif-species-title"
      className="mt-16 md:mt-20"
    >
      <p className="vh-eyebrow flex items-center gap-3">
        <span className="h-px w-6 bg-ochre" />
        {t.eyebrow}
      </p>

      <h2
        id="gbif-species-title"
        className="vh-display mt-3 text-[1.9rem] md:text-[2.4rem]"
      >
        {t.title}
        {isGenus && (
          <span className="ml-2 align-middle text-[1rem] text-muted md:text-[1.15rem]">
            {t.genusLevel}
          </span>
        )}
      </h2>

      {data.scientificName && (
        <p className="vh-binomial mt-2 break-words text-[1.05rem] text-ink-soft">
          {data.scientificName}
        </p>
      )}

      <div className="vh-panel mt-7 overflow-hidden">
        {/* 2. ชื่อพ้อง */}

        {data.acceptedName && (
          <div
            data-gbif-accepted
            className="m-5 flex items-start gap-3 rounded-[6px] border border-ochre/35 bg-ochre-soft px-4 py-3 text-[14px] leading-6 text-ochre md:m-6"
          >
            <InfoIcon className="mt-1 h-4 w-4 shrink-0" />

            <p className="min-w-0">
              {t.acceptedName}{" "}
              <span className="vh-binomial break-words text-[15px]">
                {data.acceptedName}
              </span>
            </p>
          </div>
        )}

        <dl className="divide-y divide-rule border-b border-rule">
          {/* 3. อนุกรมวิธาน */}

          {classification.length > 0 && (
            <InfoRow label={t.classification}>
              <ol
                aria-label={t.classification}
                className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-ink"
              >
                {classification.map(([rank, value], index) => (
                  <li key={rank} className="flex min-w-0 items-center gap-1.5">
                    {index > 0 && (
                      <span aria-hidden="true" className="text-faint">
                        ›
                      </span>
                    )}

                    <span
                      title={t.ranks[rank]}
                      className={
                        ITALIC_RANKS.has(rank)
                          ? "vh-binomial break-words text-[15px]"
                          : "break-words"
                      }
                    >
                      {value}
                    </span>
                  </li>
                ))}
              </ol>
            </InfoRow>
          )}

          {/* 4. ชื่อสามัญ ไทยก่อนอังกฤษ */}

          {(thaiNames.length > 0 || englishNames.length > 0) && (
            <InfoRow label={t.commonNames}>
              <div className="space-y-1 text-[14px] leading-6 text-ink">
                {thaiNames.length > 0 && (
                  <p>
                    <span className="mr-2 text-[12px] text-faint">{t.thai}</span>
                    {thaiNames.join(", ")}
                  </p>
                )}

                {englishNames.length > 0 && (
                  <p>
                    <span className="mr-2 text-[12px] text-faint">{t.english}</span>
                    {englishNames.join(", ")}
                  </p>
                )}
              </div>
            </InfoRow>
          )}
        </dl>

        {/* 5. จำนวนบันทึก */}

        {(world !== null || thailand !== null) && (
          <p
            data-gbif-counts
            className="px-5 pt-5 font-mono text-[13px] tabular-nums text-ink-soft md:px-6"
          >
            {t.occurrences(world, thailand)}
          </p>
        )}

        {/* 6. แผนที่การกระจายพันธุ์ */}

        {data.taxonKey && <DistributionMap taxonKey={data.taxonKey} t={t} />}

        {/* 7. รูปถ่าย */}

        {photos.length > 0 && <PhotoStrip photos={photos} t={t} />}

        {/* 8. ลิงก์ GBIF */}

        {data.gbifUrl && (
          <div className="border-t border-rule px-5 py-4 md:px-6">
            <a
              href={data.gbifUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vh-btn vh-btn-outline vh-btn-sm"
            >
              {t.viewOnGbif}
              <ExternalIcon className="h-3.5 w-3.5" />
              <span className="sr-only">{t.newTab}</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="grid gap-1.5 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 md:px-6">
      <dt className="vh-eyebrow !text-[10px] sm:pt-1">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/* =========================================================
   MAP (คนละตัวกับแผนที่จุดเก็บตัวอย่าง)
========================================================= */

function DistributionMap({ taxonKey, t }) {
  const containerRef = useRef(null);

  const baseLayerRef = useRef(null);

  const { darkMode } = useSiteSettings();

  const { map } = useLeafletMap(containerRef, {
    options: {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      worldCopyJump: true,
      minZoom: 0,
      maxZoom: 10,
    },

    setup: (L, createdMap) => {
      /* มุมมองทั้งโลก: เลือก zoom ที่โลกกว้างไม่เกินแผนที่มากนัก (กันโลกซ้ำหลายรอบบนจอกว้าง) */
      const width = containerRef.current?.clientWidth || 256;

      const zoom = Math.max(0, Math.min(2, Math.floor(Math.log2(width / 256))));

      createdMap.setView([20, 10], zoom);

      const dark = document.documentElement.classList.contains("dark");

      baseLayerRef.current = L.tileLayer(BASEMAP_URL(dark), {
        maxZoom: 10,
        attribution: BASEMAP_ATTRIBUTION,
      }).addTo(createdMap);

      L.tileLayer(DENSITY_URL(taxonKey), {
        maxZoom: 10,
        attribution: DENSITY_ATTRIBUTION,
      }).addTo(createdMap);
    },
  });

  /* สลับโหมดมืดระหว่างเปิดหน้า: เปลี่ยนเฉพาะแผนที่พื้นหลัง */
  useEffect(() => {
    if (!map || !baseLayerRef.current) return;

    baseLayerRef.current.setUrl(BASEMAP_URL(darkMode));
  }, [map, darkMode]);

  return (
    <div className="pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-3 md:px-6">
        <h3 className="font-serif text-[1.2rem] text-ink">{t.mapTitle}</h3>

        <p className="text-[13px] text-muted">{t.mapHint}</p>
      </div>

      <div
        ref={containerRef}
        data-gbif-map
        aria-label={t.mapTitle}
        /* tile ของชั้นข้อมูลโปร่งใส ต้องลบพื้นหลังของ img จาก globals.css ไม่ให้ทับแผนที่พื้นหลัง */
        className="relative z-0 h-[240px] w-full border-y border-rule sm:h-[260px] md:h-[320px] [&_img.leaflet-tile]:bg-transparent"
      />
    </div>
  );
}

/* =========================================================
   PHOTOS
========================================================= */

function PhotoStrip({ photos, t }) {
  /* index ของรูปที่โหลดไม่ขึ้น → ซ่อนทั้งการ์ด */
  const [failed, setFailed] = useState(() => new Set());

  const visible = photos.filter((_, index) => !failed.has(index));

  if (visible.length === 0) return null;

  return (
    <div className="pt-5">
      <div className="px-5 md:px-6">
        <h3 className="font-serif text-[1.2rem] text-ink">{t.photos}</h3>

        <p className="mt-1 text-[13px] text-muted">{t.photosNote}</p>
      </div>

      <ul
        data-gbif-photos
        className="mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-5 md:px-6"
      >
        {photos.map((photo, index) =>
          failed.has(index) ? null : (
            <li
              key={photo.occurrenceUrl || photo.thumbnailUrl}
              className="w-[180px] shrink-0 snap-start sm:w-[200px]"
            >
              <a
                href={photo.occurrenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.photoLink}
                className="block overflow-hidden rounded-[4px] border border-rule bg-paper-deep"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={() =>
                    setFailed((current) => new Set(current).add(index))
                  }
                  className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-[1.03]"
                />
              </a>

              <PhotoCredit photo={photo} />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function PhotoCredit({ photo }) {
  const { language } = useSiteSettings();

  const parts = getPhotoCreditParts(photo, language);

  if (parts.length === 0) return null;

  return (
    <p className="mt-1.5 break-words text-[11.5px] leading-[1.45] text-muted">
      {parts.map((part, index) => (
        <span key={`${part.text}-${index}`}>
          {index > 0 && <span className="text-faint"> · </span>}

          {part.href ? (
            <a
              href={part.href}
              target="_blank"
              rel="noopener noreferrer license"
              className="underline underline-offset-2 hover:text-ink"
            >
              {part.text}
            </a>
          ) : (
            part.text
          )}
        </span>
      ))}
    </p>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function PanelSkeleton({ t }) {
  return (
    <section
      data-gbif-skeleton
      aria-busy="true"
      aria-label={t.loading}
      className="mt-16 md:mt-20"
    >
      <div className="h-3 w-16 animate-pulse rounded bg-rule" />

      <div className="mt-4 h-8 w-72 max-w-full animate-pulse rounded bg-rule" />

      <div className="vh-panel mt-7 space-y-4 p-5 md:p-6">
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-rule" />
        <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-rule" />
        <div className="h-[200px] w-full animate-pulse rounded bg-rule" />
      </div>

      <span className="sr-only">{t.loading}</span>
    </section>
  );
}

/* =========================================================
   ICONS
========================================================= */

function InfoIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
    </svg>
  );
}

function ExternalIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 5h5v5" />
      <path d="M19 5 11 13" />
      <path d="M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
    </svg>
  );
}
