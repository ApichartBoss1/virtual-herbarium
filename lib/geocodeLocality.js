/* =========================================================
   GEOCODE LOCALITY
   ค้นพิกัดโดยประมาณจากชื่อสถานที่ (locality) สำหรับเติมพิกัดอัตโนมัติ
   - ใช้ Nominatim แบบเดียวกับการค้นหาสถานที่ในหน้าเพิ่มรายการ
     (NEXT_PUBLIC_FORWARD_GEOCODING_URL, format=jsonv2)
   - นโยบาย Nominatim: ไม่เกิน 1 คำขอต่อวินาที ทุกคำขอผ่านตัวจำกัดอัตราร่วมกัน
   - ความสูงจาก Open-Meteo Elevation API ครั้งละไม่เกิน 100 จุด
   - ทุกคำขอมี timeout และลองใหม่ได้ 2 ครั้ง
   - ไม่แตะ DOM และฐานข้อมูล ทดสอบใน Node ได้
========================================================= */

import { applyLocalityFixes, findLocalityQueryRule } from "@/lib/localityFixes";

const FORWARD_GEOCODING_URL =
  process.env.NEXT_PUBLIC_FORWARD_GEOCODING_URL ||
  "https://nominatim.openstreetmap.org/search";

const ELEVATION_URL =
  process.env.NEXT_PUBLIC_ELEVATION_URL ||
  "https://api.open-meteo.com/v1/elevation";

/* เผื่อจาก 1,000 ms เล็กน้อย กันนาฬิกาคลาดเคลื่อน */
export const NOMINATIM_MIN_INTERVAL_MS = 1100;

export const REQUEST_TIMEOUT_MS = 15000;

export const REQUEST_RETRIES = 2;

export const MIN_UNCERTAINTY_M = 1000;

/* ใส่ความสูงเฉพาะพิกัดที่คลาดเคลื่อนไม่เกินนี้ */
export const ELEVATION_MAX_UNCERTAINTY_M = 5000;

export const ELEVATION_BATCH_SIZE = 100;

export const PRECISIONS = ["place", "district", "province", "country"];

/* =========================================================
   PROVINCES / COUNTRIES
========================================================= */

/* [ชื่ออังกฤษตาม OSM, ชื่อไทย] */
const THAI_PROVINCES = [
  ["Bangkok", "กรุงเทพ"],
  ["Amnat Charoen", "อำนาจเจริญ"],
  ["Ang Thong", "อ่างทอง"],
  ["Bueng Kan", "บึงกาฬ"],
  ["Buri Ram", "บุรีรัมย์"],
  ["Chachoengsao", "ฉะเชิงเทรา"],
  ["Chai Nat", "ชัยนาท"],
  ["Chaiyaphum", "ชัยภูมิ"],
  ["Chanthaburi", "จันทบุรี"],
  ["Chiang Mai", "เชียงใหม่"],
  ["Chiang Rai", "เชียงราย"],
  ["Chon Buri", "ชลบุรี"],
  ["Chumphon", "ชุมพร"],
  ["Kalasin", "กาฬสินธุ์"],
  ["Kamphaeng Phet", "กำแพงเพชร"],
  ["Kanchanaburi", "กาญจนบุรี"],
  ["Khon Kaen", "ขอนแก่น"],
  ["Krabi", "กระบี่"],
  ["Lampang", "ลำปาง"],
  ["Lamphun", "ลำพูน"],
  ["Loei", "เลย"],
  ["Lop Buri", "ลพบุรี"],
  ["Mae Hong Son", "แม่ฮ่องสอน"],
  ["Maha Sarakham", "มหาสารคาม"],
  ["Mukdahan", "มุกดาหาร"],
  ["Nakhon Nayok", "นครนายก"],
  ["Nakhon Pathom", "นครปฐม"],
  ["Nakhon Phanom", "นครพนม"],
  ["Nakhon Ratchasima", "นครราชสีมา"],
  ["Nakhon Sawan", "นครสวรรค์"],
  ["Nakhon Si Thammarat", "นครศรีธรรมราช"],
  ["Nan", "น่าน"],
  ["Narathiwat", "นราธิวาส"],
  ["Nong Bua Lam Phu", "หนองบัวลำภู"],
  ["Nong Khai", "หนองคาย"],
  ["Nonthaburi", "นนทบุรี"],
  ["Pathum Thani", "ปทุมธานี"],
  ["Pattani", "ปัตตานี"],
  ["Phang Nga", "พังงา"],
  ["Phatthalung", "พัทลุง"],
  ["Phayao", "พะเยา"],
  ["Phetchabun", "เพชรบูรณ์"],
  ["Phetchaburi", "เพชรบุรี"],
  ["Phichit", "พิจิตร"],
  ["Phitsanulok", "พิษณุโลก"],
  ["Phra Nakhon Si Ayutthaya", "พระนครศรีอยุธยา"],
  ["Phrae", "แพร่"],
  ["Phuket", "ภูเก็ต"],
  ["Prachin Buri", "ปราจีนบุรี"],
  ["Prachuap Khiri Khan", "ประจวบคีรีขันธ์"],
  ["Ranong", "ระนอง"],
  ["Ratchaburi", "ราชบุรี"],
  ["Rayong", "ระยอง"],
  ["Roi Et", "ร้อยเอ็ด"],
  ["Sa Kaeo", "สระแก้ว"],
  ["Sakon Nakhon", "สกลนคร"],
  ["Samut Prakan", "สมุทรปราการ"],
  ["Samut Sakhon", "สมุทรสาคร"],
  ["Samut Songkhram", "สมุทรสงคราม"],
  ["Saraburi", "สระบุรี"],
  ["Satun", "สตูล"],
  ["Si Sa Ket", "ศรีสะเกษ"],
  ["Sing Buri", "สิงห์บุรี"],
  ["Songkhla", "สงขลา"],
  ["Sukhothai", "สุโขทัย"],
  ["Suphan Buri", "สุพรรณบุรี"],
  ["Surat Thani", "สุราษฎร์ธานี"],
  ["Surin", "สุรินทร์"],
  ["Tak", "ตาก"],
  ["Trang", "ตรัง"],
  ["Trat", "ตราด"],
  ["Ubon Ratchathani", "อุบลราชธานี"],
  ["Udon Thani", "อุดรธานี"],
  ["Uthai Thani", "อุทัยธานี"],
  ["Uttaradit", "อุตรดิตถ์"],
  ["Yala", "ยะลา"],
  ["Yasothon", "ยโสธร"],
];

const THAILAND = { code: "th", name: "Thailand" };

/* ประเทศอื่นที่พบในข้อมูล ("Lao" เดี่ยวๆ เป็นชื่อหมู่บ้านในไทยได้ จึงไม่นับ) */
const OTHER_COUNTRIES = [
  { code: "kh", name: "Cambodia", pattern: /\b(cambodia|kampuchea)\b/i },
  { code: "la", name: "Laos", pattern: /\b(laos|lao pdr)\b/i },
  { code: "mm", name: "Myanmar", pattern: /\b(myanmar|burma)\b/i },
  { code: "vn", name: "Vietnam", pattern: /\b(vietnam|viet nam)\b/i },
  { code: "my", name: "Malaysia", pattern: /\bmalaysia\b/i },
  { code: "cn", name: "China", pattern: /\bchina\b/i },
];

/* ข้อความที่ไม่ใช่สถานที่ */
const NOT_A_PLACE = [
  /\bunknown\b/i,
  /\btissue culture\b/i,
  /^(n\/?a|none|nil|cultivated|unidentified|-+|\?+)$/i,
];

/* คำนำหน้าที่บอกตำแหน่งสัมพัทธ์ ตัดออกก่อนค้น */
const RELATIVE_PREFIX =
  /^(in front of|behind( of)?|beside( of)?|near( the)?|around|along( the)?|at|opposite( of| to)?|entrance to|off|just above|c\.\s*\d+\s*km\.?\s*\w+\s+of|walk way to)\s+/i;

/* ส่วนที่มีแต่คำทั่วไป ค้นแล้วมักได้ที่อื่น จึงข้าม */
const GENERIC_WORDS = new Set(
  "science park garden pond building faculty department of the area road trail dorm dormitory canteen gate plot station office house museum reservoir pool library forest village community moo m headquarters camping centre center training stream canal alley walk way and nu".split(" "),
);

/* ประเภทพื้นที่ท้ายชื่อ ตัดออกเมื่อค้นคู่กับจังหวัด */
const TYPE_SUFFIX = /\s+(subdistrict|district|province|tambon|amphoe|area|village)$/i;

/* =========================================================
   PREPARE
========================================================= */

const squash = (text) => text.toLowerCase().replace(/[\s-]+/g, "");

function findProvince(text) {
  const lower = text.toLowerCase();

  let found = null;

  THAI_PROVINCES.forEach(([english, thai]) => {
    const words = english.toLowerCase().split(" ");

    /* "Chon Buri" ตรงกับ "Chonburi" และ "Chon-Buri" ด้วย */
    const pattern = new RegExp(`\\b${words.join("[\\s-]*")}\\b`, "i");

    const match = pattern.exec(lower);

    const index = match ? match.index : text.indexOf(thai);

    /* ถ้าพบหลายจังหวัด ใช้ชื่อที่อยู่ท้ายสุด (ที่อยู่เรียงจากเล็กไปใหญ่) */
    if (index >= 0 && (!found || index >= found.index)) {
      found = { name: english, index };
    }
  });

  return found?.name || null;
}

function isGenericPart(part) {
  const words = part.toLowerCase().match(/[a-z]+/g) || [];

  return words.length === 0 || words.every((word) => GENERIC_WORDS.has(word));
}

/*
 * เตรียมข้อความก่อนค้น คืน
 * { skip, cleaned, country, province, rule, queries: [{ q, featureType?, level }] }
 * level: full | part | province | country (ใช้บอกว่าเจอที่ขั้นไหน)
 * rule: ข้อความจาก LOCALITY_QUERY_RULES ที่ใช้ค้นแทนข้อความเดิม (ไม่ตรงกฎเป็น null)
 */
export function prepareLocality(locality) {
  const original = String(locality ?? "").replace(/\s+/g, " ").trim();

  if (!original || !/[a-z฀-๿]/i.test(original)) {
    return { skip: "empty", cleaned: original, queries: [] };
  }

  const rule = findLocalityQueryRule(original);

  /* ตรงกฎ: ค้นด้วยข้อความที่กำหนด ไม่เจอค่อยค้นจังหวัดในข้อความนั้น */
  if (rule) {
    const ruleCountry =
      OTHER_COUNTRIES.find(({ pattern }) => pattern.test(rule)) || THAILAND;

    const ruleProvince = ruleCountry === THAILAND ? findProvince(rule) : null;

    const queries = [{ q: rule, level: "full" }];

    if (ruleProvince && squash(rule) !== squash(ruleProvince)) {
      queries.push({ q: ruleProvince, featureType: "state", level: "province" });
    }

    return {
      skip: null,
      cleaned: rule,
      country: { code: ruleCountry.code, name: ruleCountry.name },
      province: ruleProvince,
      rule,
      queries,
    };
  }

  if (NOT_A_PLACE.some((pattern) => pattern.test(original))) {
    return { skip: "notAPlace", cleaned: original, queries: [] };
  }

  const country =
    OTHER_COUNTRIES.find(({ pattern }) => pattern.test(original)) || THAILAND;

  let cleaned = applyLocalityFixes(original)
    .replace(/\([^)]*\)/g, " ")
    .replace(/[;<>]/g, ",")
    .replace(/\bThailand\b/gi, "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "");

  const province = country === THAILAND ? findProvince(cleaned) : null;

  /* "Mueang" / "Mueang District" = อำเภอเมืองของจังหวัดนั้น */
  if (province) {
    cleaned = cleaned.replace(
      /\bMueang(\s+District)?\b(?!\s+(?!District)[A-Z])/gi,
      `Mueang ${province}`,
    );
  }

  const parts = cleaned
    .split(",")
    .map((part) => part.trim().replace(RELATIVE_PREFIX, "").trim())
    .filter((part) => part && !/^(moo|m\.)\s*\d+$/i.test(part) && !/^\d+$/.test(part));

  const queries = [];

  const add = (query) => {
    if (!queries.some((item) => item.q.toLowerCase() === query.q.toLowerCase())) {
      queries.push(query);
    }
  };

  add({ q: parts.join(", "), level: "full" });

  const isProvincePart = (part) =>
    province && squash(part.replace(/\s+province$/i, "")) === squash(province);

  const isCountryPart = (part) =>
    country !== THAILAND && country.pattern.test(part);

  parts
    .filter(
      (part) =>
        !isProvincePart(part) && !isCountryPart(part) && !isGenericPart(part),
    )
    .slice(0, 4)
    .forEach((part) => {
      const name = part.replace(TYPE_SUFFIX, "").trim();

      if (name.length >= 3) {
        add({ q: province ? `${name}, ${province}` : name, level: "part" });
      }
    });

  if (province) {
    add({ q: province, featureType: "state", level: "province" });
  }

  if (country !== THAILAND) {
    add({ q: country.name, featureType: "country", level: "country" });
  }

  return {
    skip: null,
    cleaned: parts.join(", "),
    country: { code: country.code, name: country.name },
    province,
    rule: null,
    queries,
  };
}

/* =========================================================
   RATE LIMIT / FETCH
========================================================= */

/* ตัวจำกัดอัตราร่วมกันทั้งแอป: ทุกคำขอ Nominatim ต้องผ่านตรงนี้ */
let nextNominatimSlot = 0;

function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason || new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason || new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function waitForNominatimSlot(signal) {
  const now = Date.now();

  const wait = Math.max(0, nextNominatimSlot - now);

  nextNominatimSlot = Math.max(now, nextNominatimSlot) + NOMINATIM_MIN_INTERVAL_MS;

  await abortableSleep(wait, signal);
}

class RetryableError extends Error {}

/*
 * GET JSON พร้อม timeout และลองใหม่ REQUEST_RETRIES ครั้ง
 * ลองใหม่เมื่อ timeout, network error, 429 และ 5xx
 * beforeAttempt: เรียกก่อนทุกครั้งที่ส่ง (ใช้รอคิวอัตราคำขอ)
 */
async function fetchJsonWithRetry(url, { signal, beforeAttempt, fetchImpl = fetch } = {}) {
  let lastError = null;

  for (let attempt = 0; attempt <= REQUEST_RETRIES; attempt += 1) {
    if (attempt > 0) {
      await abortableSleep(1000 * 2 ** attempt, signal);
    }

    await beforeAttempt?.(signal);

    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    try {
      const response = await fetchImpl(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: combined,
      });

      if (response.status === 429 || response.status >= 500) {
        throw new RetryableError(`HTTP ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      /* ผู้ใช้กดหยุด: ไม่ลองใหม่ */
      if (signal?.aborted) {
        throw err;
      }

      const retryable =
        err instanceof RetryableError ||
        err?.name === "TimeoutError" ||
        err?.name === "AbortError" ||
        err instanceof TypeError;

      if (!retryable) {
        throw err;
      }

      lastError = err;
    }
  }

  throw lastError;
}

/* =========================================================
   GEOCODE
========================================================= */

function precisionFromRank(rank) {
  if (rank <= 4) return "country";
  if (rank <= 8) return "province";
  if (rank <= 16) return "district";
  return "place";
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);

  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 6371008.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ครึ่งเส้นทแยงของกรอบผลลัพธ์ ปัดขึ้นเป็นร้อยเมตร ต่ำสุด 1,000 m */
export function uncertaintyFromBoundingBox(boundingbox) {
  const [south, north, west, east] = (boundingbox || []).map(Number);

  if (![south, north, west, east].every(Number.isFinite)) {
    return null;
  }

  const half = haversineMeters(south, west, north, east) / 2;

  return Math.max(MIN_UNCERTAINTY_M, Math.ceil(half / 100) * 100);
}

function buildSearchUrl(query, countryCode) {
  const url = new URL(FORWARD_GEOCODING_URL);

  url.searchParams.set("q", query.q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");
  url.searchParams.set("countrycodes", countryCode);

  if (query.featureType) {
    url.searchParams.set("featureType", query.featureType);
  }

  return url.toString();
}

/*
 * ค้นพิกัดของชื่อสถานที่หนึ่งชื่อ ตามลำดับใน prepareLocality หยุดเมื่อเจอ
 * คืน {
 *   status: found | not_found | skipped,
 *   latitude, longitude, precision, uncertainty_m,
 *   level, query, displayName, requests, skipReason
 * }
 * โยน error เมื่อค้นไม่สำเร็จหลังลองใหม่ครบ (เช่น เครือข่ายล่ม)
 */
export async function geocodeLocality(locality, { signal, fetchImpl } = {}) {
  const prepared = prepareLocality(locality);

  if (prepared.skip) {
    return { status: "skipped", skipReason: prepared.skip, requests: 0 };
  }

  let requests = 0;

  for (const query of prepared.queries) {
    requests += 1;

    const results = await fetchJsonWithRetry(
      buildSearchUrl(query, prepared.country.code),
      { signal, fetchImpl, beforeAttempt: waitForNominatimSlot },
    );

    const hit = Array.isArray(results) ? results[0] : null;

    if (!hit) {
      continue;
    }

    const latitude = Number(hit.lat);

    const longitude = Number(hit.lon);

    /* จุดที่อยู่นอกประเทศที่ข้อความระบุ → ไม่ใช้ */
    const countryCode = String(hit.address?.country_code || "").toLowerCase();

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      countryCode !== prepared.country.code
    ) {
      continue;
    }

    return {
      status: "found",
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
      precision: precisionFromRank(Number(hit.place_rank)),
      uncertainty_m:
        uncertaintyFromBoundingBox(hit.boundingbox) ?? MIN_UNCERTAINTY_M,
      level: query.level,
      query: query.q,
      displayName: hit.display_name || "",
      requests,
    };
  }

  return { status: "not_found", requests, query: prepared.cleaned };
}

/* =========================================================
   ELEVATION
========================================================= */

/*
 * points: [{ latitude, longitude }] ไม่เกิน ELEVATION_BATCH_SIZE จุดต่อคำขอ
 * คืน array ของความสูง (เมตร) ตามลำดับเดิม ค่าที่อ่านไม่ได้เป็น null
 */
export async function fetchElevations(points, { signal, fetchImpl } = {}) {
  const elevations = [];

  for (let start = 0; start < points.length; start += ELEVATION_BATCH_SIZE) {
    const batch = points.slice(start, start + ELEVATION_BATCH_SIZE);

    const url = new URL(ELEVATION_URL);

    url.searchParams.set("latitude", batch.map((point) => point.latitude).join(","));
    url.searchParams.set("longitude", batch.map((point) => point.longitude).join(","));

    const data = await fetchJsonWithRetry(url.toString(), { signal, fetchImpl });

    batch.forEach((_, index) => {
      const value = Number(data?.elevation?.[index]);

      elevations.push(Number.isFinite(value) ? value : null);
    });
  }

  return elevations;
}

/* ความสูงเก็บใน elevation (text) เช่น "120 m" */
export function formatElevation(meters) {
  return `${Math.round(meters)} m`;
}
