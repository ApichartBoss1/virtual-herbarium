import "server-only";

import { createHash } from "node:crypto";

import { unstable_cache } from "next/cache";

import { checkName } from "@/lib/gbif";
import { getLicenseLabel, getLicenseUrl } from "@/lib/photoCredit";

/* =========================================================
   GBIF SPECIES INFO (ฝั่ง server เท่านั้น)
   ข้อมูลชนิดพืชจาก GBIF สำหรับหน้าแสดงผล

   endpoint ที่ใช้ (ตรวจกับ https://techdocs.gbif.org/openapi/checklistbank.json
   และ https://techdocs.gbif.org/openapi/occurrence.json)
   - checkName() ใน lib/gbif.js  → /v2/species/match, /v1/parser/name, /v1/species/suggest
   - GET /v1/species/{usageKey}                   classification
   - GET /v1/species/{usageKey}/vernacularNames   ชื่อสามัญ (language เป็นรหัส 3 ตัว เช่น tha, eng)
   - GET /v1/occurrence/search?taxonKey=&limit=0  นับ occurrence (เพิ่ม country=TH สำหรับไทย)
   - GET /v1/occurrence/search?taxonKey=&mediaType=StillImage  รูปถ่าย
   - รูปขนาดย่อ (https://techdocs.gbif.org/en/openapi/images)
     /v1/image/cache/300x/occurrence/{key}/media/{md5(identifier)}
     ยกเว้นรูปจาก iNaturalist ใช้ไฟล์ medium ของ iNaturalist เอง
     ไม่เก็บ URL ไฟล์เต็ม เพื่อไม่ให้ถูกนำไปแสดงตรงๆ

   cache (Next 16 แบบไม่เปิด Cache Components)
   - fetch ในไฟล์นี้: cache: "force-cache" + next.revalidate 7 วัน
     (docs/01-app/03-api-reference/04-functions/fetch.md) เก็บเฉพาะคำตอบ 200
   - checkName(): ห่อด้วย unstable_cache 7 วัน เพราะแก้ fetch ใน lib/gbif.js ไม่ได้
     (docs/01-app/02-guides/caching-without-cache-components.md)
     ถ้า checkName throw จะไม่ถูก cache
========================================================= */

const GBIF_API = "https://api.gbif.org";

const GBIF_SITE = "https://www.gbif.org";

const CACHE_SECONDS = 604800;

const FETCH_TIMEOUT_MS = 5000;

const USER_AGENT = "virtual-herbarium (Naresuan University)";

const MAX_VERNACULAR_PER_LANGUAGE = 5;

const MAX_PHOTOS = 6;

/* ดึง occurrence ที่มีรูปมากกว่าที่ใช้ เผื่อข้ามรูปที่ไม่มี license */
const PHOTO_SEARCH_LIMIT = 30;

/* ความกว้างรูปย่อจาก image cache ของ GBIF (สูงสุดที่ GBIF ให้คือ 1200) */
const THUMBNAIL_WIDTH = 300;

/* language ของ GBIF เป็น ISO 639-2 */
const VERNACULAR_LANGUAGES = { tha: "th", eng: "en" };

/* result ที่แสดงข้อมูลได้ ("spelling" / "not_found" ไม่เดาชื่อแทนผู้ชม) */
const SHOWN_RESULTS = new Set(["ok", "synonym", "genus_only"]);

const CLASSIFICATION_RANKS = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
];

/* =========================================================
   FETCH
========================================================= */

async function fetchGbif(path, params = {}) {
  const query = new URLSearchParams(params).toString();

  const response = await fetch(`${GBIF_API}${path}${query ? `?${query}` : ""}`, {
    cache: "force-cache",
    next: { revalidate: CACHE_SECONDS },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`GBIF HTTP ${response.status} for ${path}`);
  }

  return response.json();
}

/* ส่วนที่ล้มเหลวเป็น null ส่วนอื่นยังคืนได้ */
async function settle(label, task) {
  try {
    return await task();
  } catch (error) {
    console.warn(`GBIF species ${label} unavailable:`, error?.message || error);

    return null;
  }
}

const cachedCheckName = unstable_cache(
  async (name) => checkName({ botanical_name: name }),
  ["gbif-check-name-v1"],
  { revalidate: CACHE_SECONDS },
);

/* =========================================================
   PARTS
========================================================= */

async function getClassification(key) {
  const data = await fetchGbif(`/v1/species/${key}`);

  return {
    usage: data,
    classification: Object.fromEntries(
      CLASSIFICATION_RANKS.map((rank) => [rank, data?.[rank] || null]),
    ),
  };
}

/* ชื่อที่ GBIF รวมหลายชื่อไว้ในค่าเดียว ("Rain tree, Saman, ...") แยกเป็นรายชื่อ */
function splitVernacular(value) {
  return String(value || "")
    .split(/[,;]/)
    .map((name) => name.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

async function getVernacularNames(key) {
  const data = await fetchGbif(`/v1/species/${key}/vernacularNames`, {
    limit: "1000",
  });

  const names = { th: [], en: [] };

  const seen = { th: new Set(), en: new Set() };

  /* ชื่อที่ GBIF ระบุว่า preferred มาก่อน */
  const results = [...(data?.results || [])].sort(
    (a, b) => Number(Boolean(b?.preferred)) - Number(Boolean(a?.preferred)),
  );

  for (const item of results) {
    const language = VERNACULAR_LANGUAGES[String(item?.language || "").toLowerCase()];

    if (!language) continue;

    for (const name of splitVernacular(item.vernacularName)) {
      const dedupeKey = name.toLowerCase().replace(/[-\s]+/g, " ");

      if (
        names[language].length >= MAX_VERNACULAR_PER_LANGUAGE ||
        seen[language].has(dedupeKey)
      ) {
        continue;
      }

      seen[language].add(dedupeKey);

      names[language].push(name);
    }
  }

  return names;
}

async function getOccurrenceCount(key, country) {
  const data = await fetchGbif("/v1/occurrence/search", {
    taxonKey: String(key),
    limit: "0",
    ...(country ? { country } : {}),
  });

  return Number.isFinite(data?.count) ? data.count : null;
}

/*
 * iNaturalist: .../photos/123/original.jpg → .../photos/123/medium.jpg (กว้างไม่เกิน 500 px)
 * อื่นๆ: image cache ของ GBIF กว้าง 300 px
 */
function getThumbnail(occurrenceKey, identifier) {
  try {
    const url = new URL(identifier);

    /* inaturalist-open-data.s3.amazonaws.com, static.inaturalist.org */
    if (
      url.hostname.toLowerCase().includes("inaturalist") &&
      /\/original\.\w+$/i.test(url.pathname)
    ) {
      url.pathname = url.pathname.replace(/\/original(\.\w+)$/i, "/medium$1");

      return { thumbnailUrl: url.href, thumbnailSource: "inaturalist-medium" };
    }
  } catch {
    /* identifier ไม่ใช่ URL ที่ถูกต้อง ใช้ image cache ของ GBIF */
  }

  const hash = createHash("md5").update(identifier).digest("hex");

  return {
    thumbnailUrl: `${GBIF_API}/v1/image/cache/${THUMBNAIL_WIDTH}x/occurrence/${occurrenceKey}/media/${hash}`,
    thumbnailSource: "gbif-cache",
  };
}

/* รูปละ 1 รูปต่อ occurrence เพื่อให้หลากหลาย ข้ามรูปที่ไม่มี license */
async function getPhotos(key) {
  const data = await fetchGbif("/v1/occurrence/search", {
    taxonKey: String(key),
    mediaType: "StillImage",
    limit: String(PHOTO_SEARCH_LIMIT),
  });

  const photos = [];

  for (const occurrence of data?.results || []) {
    if (photos.length >= MAX_PHOTOS) break;

    const media = (occurrence?.media || []).find(
      (item) => item?.type === "StillImage" && item.identifier && item.license,
    );

    if (!media) continue;

    /* คลิกรูปแล้วไปหน้า occurrence บน GBIF ไม่ใช่ไฟล์เต็ม */
    photos.push({
      ...getThumbnail(occurrence.key, media.identifier),
      creator: media.creator || media.rightsHolder || null,
      license: media.license,
      licenseLabel: getLicenseLabel(media.license),
      licenseUrl: getLicenseUrl(media.license),
      publisher: media.publisher || occurrence.publisher || null,
      occurrenceUrl: `${GBIF_SITE}/occurrence/${occurrence.key}`,
    });
  }

  return photos;
}

/* =========================================================
   SPECIES INFO
   คืน null เมื่อไม่ควรแสดง (spelling / not_found) หรือตรวจชื่อไม่ได้
   ไม่ throw ออกไป
========================================================= */

export async function getSpeciesInfo(botanicalName) {
  const name = String(botanicalName ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) return null;

  let check;

  try {
    check = await cachedCheckName(name);
  } catch (error) {
    console.warn("GBIF name check unavailable:", error?.message || error);

    return null;
  }

  if (!check || !SHOWN_RESULTS.has(check.result) || !check.gbif) {
    return null;
  }

  const { gbif } = check;

  const isGenus = check.result === "genus_only";

  /* ชื่อพ้อง → ใช้ key ของชื่อที่ยอมรับ */
  const taxonKey =
    check.result === "synonym" && gbif.acceptedUsageKey
      ? gbif.acceptedUsageKey
      : gbif.usageKey;

  if (!taxonKey) return null;

  const [taxon, vernacularNames, occurrenceCount, occurrenceCountTH, photos] =
    await Promise.all([
      settle("classification", () => getClassification(taxonKey)),
      settle("vernacular names", () => getVernacularNames(taxonKey)),
      settle("occurrence count", () => getOccurrenceCount(taxonKey)),
      settle("occurrence count (TH)", () => getOccurrenceCount(taxonKey, "TH")),
      settle("photos", () => getPhotos(taxonKey)),
    ]);

  const rank = taxon?.usage?.rank || gbif.rank || null;

  return {
    result: check.result,
    level: isGenus ? "genus" : String(rank || "species").toLowerCase(),
    matchedName: gbif.scientificName,
    status: gbif.status,
    acceptedName: check.result === "synonym" ? gbif.acceptedName : null,
    taxonKey: Number(taxonKey),
    scientificName: taxon?.usage?.scientificName || gbif.scientificName,
    gbifUrl: `${GBIF_SITE}/species/${taxonKey}`,
    classification: taxon?.classification || null,
    vernacularNames,
    occurrenceCount,
    occurrenceCountTH,
    photos,
  };
}
