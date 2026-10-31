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
     ยกเว้นรูปจาก iNaturalist ใช้ไฟล์ small ของ iNaturalist เอง
     รูปใหญ่ (largeUrl) ใช้ 800x / large ของ iNaturalist
     ไม่เก็บ URL ไฟล์เต็ม เพื่อไม่ให้ถูกนำไปแสดงตรงๆ

   cache (Next 16 แบบไม่เปิด Cache Components)
   - fetch ในไฟล์นี้: cache: "force-cache" + next.revalidate 7 วัน
     (docs/01-app/03-api-reference/04-functions/fetch.md) เก็บเฉพาะคำตอบ 200
   - checkName(): ห่อด้วย unstable_cache 7 วัน เพราะแก้ fetch ใน lib/gbif.js ไม่ได้
     (docs/01-app/02-guides/caching-without-cache-components.md)
     ถ้า checkName throw จะไม่ถูก cache
   - ผลที่ล้ม (timeout / HTTP error / network) จำไว้ 15 นาทีในหน่วยความจำของ server
     (withFailureCache) ระหว่างนั้นไม่ยิง GBIF ซ้ำ ไม่ต้องรอ timeout ทุกครั้งที่เปิดหน้า
     เก็บแยกจาก cache ผลสำเร็จ และเกิดได้เฉพาะเมื่อยังไม่มีผลสำเร็จใน cache
     (cache hit / ค่าเก่าที่รอ revalidate ไม่ยิง network จึงไม่ล้ม) ผลสำเร็จลบรายการที่ล้มออก

   timeout ต่อคำขอ: 5 วินาที ยกเว้นค้นรูป (mediaType=StillImage) 15 วินาที
   เพราะ GBIF ใช้ 5–23 วินาทีสำหรับคำขอนี้ (วัดเมื่อ ต.ค. 2026)

   ส่วนที่ล้มเพราะ GBIF ส่งกลับใน unavailable (เช่น ["photos"], ["name"] เมื่อตรวจชื่อไม่ได้)
   ให้ route ตั้ง Cache-Control สั้น และให้ test แยกจากผลผิด (หน้าเว็บไม่ใช้ค่านี้)
========================================================= */

const GBIF_API = "https://api.gbif.org";

const GBIF_SITE = "https://www.gbif.org";

const CACHE_SECONDS = 604800;

const FETCH_TIMEOUT_MS = 5000;

const PHOTO_FETCH_TIMEOUT_MS = 15000;

/* อายุของผลที่ล้ม (ทั้งใน server และ Cache-Control ของ route) */
export const FAILURE_CACHE_SECONDS = 900;

/* จำนวนรายการที่ล้มที่จำได้สูงสุด (เกินแล้วลบรายการเก่าสุด) */
const MAX_FAILURE_ENTRIES = 1000;

const USER_AGENT = "virtual-herbarium (Naresuan University)";

const MAX_VERNACULAR_PER_LANGUAGE = 5;

const MAX_PHOTOS = 6;

/* ดึง occurrence ที่มีรูปมากกว่าที่ใช้ เผื่อข้ามรูปที่ไม่มี license */
const PHOTO_SEARCH_LIMIT = 30;

/* ความกว้างรูปจาก image cache ของ GBIF (สูงสุดที่ GBIF ให้คือ 1200) */
const THUMBNAIL_WIDTH = 300;

const LARGE_WIDTH = 800;

/* รูปตัวอย่างหนึ่งรูป: license ที่เปิดกว้างกว่ามาก่อน */
const LICENSE_RANKS = [
  { pattern: /^(CC0|Public Domain)/, rank: 0 },
  { pattern: /^CC BY(?!-NC)/, rank: 1 },
  { pattern: /^CC BY-NC/, rank: 2 },
];

/* basisOfRecord ที่เป็นตัวอย่างแห้ง/ตัวอย่างเก็บ (ไม่ใช่รูปต้นจริง) */
const PRESERVED_BASIS = new Set([
  "PRESERVED_SPECIMEN",
  "FOSSIL_SPECIMEN",
  "MATERIAL_SAMPLE",
  "MATERIAL_CITATION",
]);

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
   FAILURE CACHE
   key → เวลาหมดอายุ (ms)
========================================================= */

const failures = new Map();

function hasRecentFailure(key) {
  const expiresAt = failures.get(key);

  if (!expiresAt) return false;

  if (expiresAt > Date.now()) return true;

  failures.delete(key);

  return false;
}

function rememberFailure(key) {
  failures.delete(key);

  if (failures.size >= MAX_FAILURE_ENTRIES) {
    failures.delete(failures.keys().next().value);
  }

  failures.set(key, Date.now() + FAILURE_CACHE_SECONDS * 1000);
}

/* ล้มภายใน 15 นาที → throw ทันทีโดยไม่เรียก task */
async function withFailureCache(key, task) {
  if (hasRecentFailure(key)) {
    throw new Error(`GBIF failed within the last ${FAILURE_CACHE_SECONDS / 60} minutes (cached)`);
  }

  try {
    const result = await task();

    failures.delete(key);

    return result;
  } catch (error) {
    rememberFailure(key);

    throw error;
  }
}

/* =========================================================
   FETCH
========================================================= */

async function fetchGbif(path, params = {}, { timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const query = new URLSearchParams(params).toString();

  const url = `${GBIF_API}${path}${query ? `?${query}` : ""}`;

  return withFailureCache(url, async () => {
    const response = await fetch(url, {
      cache: "force-cache",
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`GBIF HTTP ${response.status} for ${path}`);
    }

    return response.json();
  });
}

/* ส่วนที่ล้มเหลวเป็น null และเพิ่มชื่อส่วนลงใน unavailable ส่วนอื่นยังคืนได้ */
async function settle(part, task, unavailable) {
  try {
    return await task();
  } catch (error) {
    console.warn(`GBIF species ${part} unavailable:`, error?.message || error);

    unavailable.push(part);

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
 * iNaturalist: .../photos/123/original.jpg → .../photos/123/small.jpg (ด้านยาวไม่เกิน 240 px)
 *              รูปใหญ่ใช้ large.jpg (ด้านยาวไม่เกิน 1024 px)
 * อื่นๆ: image cache ของ GBIF กว้าง 300 px / 800 px
 */
function getImageUrls(occurrenceKey, identifier) {
  try {
    const url = new URL(identifier);

    /* inaturalist-open-data.s3.amazonaws.com, static.inaturalist.org */
    if (
      url.hostname.toLowerCase().includes("inaturalist") &&
      /\/original\.\w+$/i.test(url.pathname)
    ) {
      const sized = (size) =>
        new URL(url.pathname.replace(/\/original(\.\w+)$/i, `/${size}$1`), url).href;

      return {
        thumbnailUrl: sized("small"),
        largeUrl: sized("large"),
        thumbnailSource: "inaturalist-small",
      };
    }
  } catch {
    /* identifier ไม่ใช่ URL ที่ถูกต้อง ใช้ image cache ของ GBIF */
  }

  const hash = createHash("md5").update(identifier).digest("hex");

  const cached = (width) =>
    `${GBIF_API}/v1/image/cache/${width}x/occurrence/${occurrenceKey}/media/${hash}`;

  return {
    thumbnailUrl: cached(THUMBNAIL_WIDTH),
    largeUrl: cached(LARGE_WIDTH),
    thumbnailSource: "gbif-cache",
  };
}

/* occurrence ที่มีรูป (ใช้ร่วมกันทั้งแถบรูปและรูปตัวอย่าง จึงยิงคำขอเดียว) */
async function searchPhotoOccurrences(key) {
  const data = await fetchGbif(
    "/v1/occurrence/search",
    {
      taxonKey: String(key),
      mediaType: "StillImage",
      limit: String(PHOTO_SEARCH_LIMIT),
    },
    { timeoutMs: PHOTO_FETCH_TIMEOUT_MS },
  );

  return data?.results || [];
}

/* รูปแรกของ occurrence ที่มี license (ไม่มี license → null) */
function toPhoto(occurrence) {
  const media = (occurrence?.media || []).find(
    (item) => item?.type === "StillImage" && item.identifier && item.license,
  );

  if (!media) return null;

  const { largeUrl, ...thumbnail } = getImageUrls(occurrence.key, media.identifier);

  /* คลิกรูปแล้วไปหน้า occurrence บน GBIF ไม่ใช่ไฟล์เต็ม */
  return {
    photo: {
      ...thumbnail,
      creator: media.creator || media.rightsHolder || null,
      license: media.license,
      licenseLabel: getLicenseLabel(media.license),
      licenseUrl: getLicenseUrl(media.license),
      /* ไม่มี publisher (เช่นตัวอย่างพรรณไม้แห้งบางชุด) → ใช้ชื่อชุดข้อมูลแทน */
      publisher:
        media.publisher || occurrence.publisher || occurrence.datasetName || null,
      occurrenceUrl: `${GBIF_SITE}/occurrence/${occurrence.key}`,
    },
    largeUrl,
    preserved: PRESERVED_BASIS.has(occurrence.basisOfRecord),
  };
}

/* รูปละ 1 รูปต่อ occurrence เพื่อให้หลากหลาย ข้ามรูปที่ไม่มี license */
function pickPhotos(occurrences) {
  return occurrences
    .map(toPhoto)
    .filter(Boolean)
    .slice(0, MAX_PHOTOS)
    .map((item) => item.photo);
}

function licenseRank(label) {
  return LICENSE_RANKS.find(({ pattern }) => pattern.test(label || ""))?.rank ??
    LICENSE_RANKS.length;
}

/*
 * รูปตัวอย่างหนึ่งรูปสำหรับรายการที่ไม่มีรูป
 * รูปต้นจริงก่อนตัวอย่างแห้ง แล้วเรียงตาม license CC0 > CC BY > CC BY-NC > อื่นๆ
 * ลำดับเท่ากันใช้ลำดับเดิมของ GBIF
 */
function pickExamplePhoto(occurrences, level) {
  const best = occurrences
    .map(toPhoto)
    .filter(Boolean)
    .map((item, index) => ({ ...item, index }))
    .sort(
      (a, b) =>
        Number(a.preserved) - Number(b.preserved) ||
        licenseRank(a.photo.licenseLabel) - licenseRank(b.photo.licenseLabel) ||
        a.index - b.index,
    )[0];

  if (!best) return null;

  const { photo, largeUrl } = best;

  return {
    thumbnailUrl: photo.thumbnailUrl,
    largeUrl,
    creator: photo.creator,
    licenseLabel: photo.licenseLabel,
    licenseUrl: photo.licenseUrl,
    publisher: photo.publisher,
    occurrenceUrl: photo.occurrenceUrl,
    level,
  };
}

/* =========================================================
   TAXON
   ตรวจชื่อด้วย checkName แล้วเลือก taxonKey ที่ใช้แสดง
   คืน null เมื่อไม่ควรแสดง (spelling / not_found)
   throw เมื่อตรวจชื่อไม่ได้ (GBIF ล่ม หรือล้มภายใน 15 นาที)
========================================================= */

async function resolveTaxon(botanicalName) {
  const name = String(botanicalName ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) return null;

  const check = await withFailureCache(`check-name:${name}`, () =>
    cachedCheckName(name),
  );

  if (!check || !SHOWN_RESULTS.has(check.result) || !check.gbif) {
    return null;
  }

  const { gbif } = check;

  /* ชื่อพ้อง → ใช้ key ของชื่อที่ยอมรับ */
  const taxonKey =
    check.result === "synonym" && gbif.acceptedUsageKey
      ? gbif.acceptedUsageKey
      : gbif.usageKey;

  if (!taxonKey) return null;

  return { check, gbif, taxonKey, isGenus: check.result === "genus_only" };
}

/* level ของรูป/ข้อมูล: genus เมื่อระบุถึงสกุล ไม่งั้นใช้ rank จาก GBIF */
function getLevel(isGenus, rank) {
  return isGenus ? "genus" : String(rank || "species").toLowerCase();
}

/* =========================================================
   EXAMPLE PHOTO
   รูปเดียวสำหรับรายการที่ไม่มีรูป (/api/gbif/photo)
   ดึงเฉพาะ occurrence ที่มีรูป ไม่ดึงชื่อสามัญหรือจำนวนบันทึก
   คืน { data, unavailable } ไม่ throw ออกไป
   - data null เมื่อไม่ควรแสดง ไม่มีรูปที่มี license หรือ GBIF ล่ม
   - unavailable: ["name"] ตรวจชื่อไม่ได้, ["photos"] ค้นรูปไม่ได้
========================================================= */

export async function getExamplePhoto(botanicalName) {
  let taxon;

  try {
    taxon = await resolveTaxon(botanicalName);
  } catch (error) {
    console.warn("GBIF name check unavailable:", error?.message || error);

    return { data: null, unavailable: ["name"] };
  }

  if (!taxon) return { data: null, unavailable: [] };

  let occurrences;

  try {
    occurrences = await searchPhotoOccurrences(taxon.taxonKey);
  } catch (error) {
    console.warn("GBIF photo unavailable:", error?.message || error);

    return { data: null, unavailable: ["photos"] };
  }

  return {
    data: pickExamplePhoto(occurrences, getLevel(taxon.isGenus, taxon.gbif.rank)),
    unavailable: [],
  };
}

/* =========================================================
   SPECIES INFO
   คืน { data, unavailable } ไม่ throw ออกไป
   - data null เมื่อไม่ควรแสดง (spelling / not_found) หรือตรวจชื่อไม่ได้ (unavailable ["name"])
   - ส่วนที่ล้มเป็น null และชื่อส่วนอยู่ใน unavailable
     (classification, vernacularNames, occurrenceCount, occurrenceCountTH, photos)
   examplePhoto: รูปเดียวกับ /api/gbif/photo (จาก occurrence ชุดเดียวกับ photos)
   ให้หน้ารายละเอียดใช้แทนรูปได้โดยไม่ต้องยิงคำขอเพิ่ม
========================================================= */

export async function getSpeciesInfo(botanicalName) {
  let resolved;

  try {
    resolved = await resolveTaxon(botanicalName);
  } catch (error) {
    console.warn("GBIF name check unavailable:", error?.message || error);

    return { data: null, unavailable: ["name"] };
  }

  if (!resolved) return { data: null, unavailable: [] };

  const { check, gbif, taxonKey, isGenus } = resolved;

  const unavailable = [];

  const [taxon, vernacularNames, occurrenceCount, occurrenceCountTH, occurrences] =
    await Promise.all([
      settle("classification", () => getClassification(taxonKey), unavailable),
      settle("vernacularNames", () => getVernacularNames(taxonKey), unavailable),
      settle("occurrenceCount", () => getOccurrenceCount(taxonKey), unavailable),
      settle("occurrenceCountTH", () => getOccurrenceCount(taxonKey, "TH"), unavailable),
      settle("photos", () => searchPhotoOccurrences(taxonKey), unavailable),
    ]);

  const rank = taxon?.usage?.rank || gbif.rank || null;

  const level = getLevel(isGenus, rank);

  const data = {
    result: check.result,
    level,
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
    photos: occurrences ? pickPhotos(occurrences) : null,
    examplePhoto: occurrences ? pickExamplePhoto(occurrences, level) : null,
  };

  /* เรียงชื่อส่วนให้ผลเหมือนเดิมทุกครั้ง (Promise.all เสร็จไม่เรียงลำดับ) */
  return { data, unavailable: unavailable.sort() };
}
