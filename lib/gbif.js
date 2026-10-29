/* =========================================================
   GBIF NAME CHECKER
   ใช้ได้ทั้ง browser และ server (api.gbif.org อนุญาต CORS: *)

   endpoint ที่ใช้ (ตรวจกับ https://techdocs.gbif.org/openapi/checklistbank.json)
   - GET /v2/species/match?scientificName=&verbose=true
     /v1/species/match ถูกประกาศ deprecated และจะถูกลบ จึงใช้ v2
     v2 ใช้ matchType: EXACT, VARIANT, CANONICAL, AMBIGUOUS, NONE,
     UNSUPPORTED, HIGHERRANK (VARIANT คือ FUZZY ของ v1)
   - GET /v1/species/suggest?q=   (autocomplete แบบ prefix ยังไม่ deprecated)
========================================================= */

const GBIF_API = "https://api.gbif.org";

const GBIF_SPECIES_PAGE = "https://www.gbif.org/species";

const FETCH_TIMEOUT_MS = 8000;

const MAX_SUGGESTIONS = 3;

/* ชื่อที่ fuzzy (VARIANT/CANONICAL) แต่ confidence ถึงเกณฑ์นี้ถือว่าพบ */
const FOUND_FUZZY_CONFIDENCE = 90;

/* alternatives ที่ confidence ต่ำกว่านี้ไม่นำมาแนะนำ */
const SUGGESTION_MIN_CONFIDENCE = 50;

const FUZZY_MATCH_TYPES = ["VARIANT", "CANONICAL"];

/* =========================================================
   TEXT
========================================================= */

export const GBIF_TEXT = {
  TH: {
    result: {
      ok: "ชื่อถูกต้องตาม GBIF",
      synonym: "เป็นชื่อพ้อง ชื่อที่ยอมรับคือ",
      genus_only: "ตรวจได้ถึงระดับสกุล",
      not_found: "ไม่พบชื่อนี้ใน GBIF",
    },
    noSuggestions: "ไม่พบชื่อที่ใกล้เคียง",
    familyDiffers: (family) => `GBIF จัดอยู่ในวงศ์ ${family}`,
    familyCheck: {
      not_provided: "ไม่ได้กรอกวงศ์",
      match: "วงศ์ตรงกับ GBIF",
      differs: "วงศ์ไม่ตรงกับ GBIF",
      unknown: "ตรวจวงศ์ไม่ได้ เพราะไม่พบชื่อใน GBIF",
    },
    matchedName: "ชื่อที่ GBIF จับคู่",
    acceptedName: "ชื่อที่ยอมรับ",
    gbifFamily: "วงศ์ใน GBIF",
    suggestions: "หรือหมายถึง",
    viewOnGbif: "ดูบน GBIF",
    errors: {
      gbif_unavailable:
        "เชื่อมต่อ GBIF ไม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    },
  },

  EN: {
    result: {
      ok: "Name is correct according to GBIF",
      synonym: "This is a synonym. The accepted name is",
      genus_only: "Checked to genus level only",
      not_found: "Name not found in GBIF",
    },
    noSuggestions: "No similar names found",
    familyDiffers: (family) => `GBIF places this in the family ${family}`,
    familyCheck: {
      not_provided: "No family entered",
      match: "Family matches GBIF",
      differs: "Family differs from GBIF",
      unknown: "Cannot check the family because the name was not found in GBIF",
    },
    matchedName: "GBIF matched name",
    acceptedName: "Accepted name",
    gbifFamily: "GBIF family",
    suggestions: "Did you mean",
    viewOnGbif: "View on GBIF",
    errors: {
      gbif_unavailable:
        "GBIF is not reachable right now. Please try again.",
    },
  },
};

/* =========================================================
   HELPERS
========================================================= */

export function cleanName(name) {
  return String(name ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function createUnavailableError(cause) {
  const error = new Error("GBIF is unavailable.");

  error.code = "gbif_unavailable";

  error.cause = cause;

  return error;
}

async function fetchJsonOnce(url) {
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const error = new Error(`GBIF HTTP ${response.status}`);

      error.status = response.status;

      throw error;
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/*
 * ทุก fetch มี timeout 8 วินาที
 * ลองซ้ำ 1 ครั้งเมื่อ GBIF ตอบผิดพลาดชั่วคราว (timeout / 5xx / body ว่าง / เครือข่าย)
 * เพราะ GBIF บางครั้งค้างแบบสุ่ม แต่ครั้งถัดไปตอบได้ใน 2–5 วินาที
 * รวมแล้วรอไม่เกินประมาณ 16 วินาทีต่อ request
 */
async function fetchJson(url, cache) {
  if (cache?.has(url)) {
    return cache.get(url);
  }

  const request = (async () => {
    try {
      return await fetchJsonOnce(url);
    } catch (error) {
      /* 4xx เป็นปัญหาของ request ลองซ้ำก็ไม่หาย */
      if (error?.status >= 400 && error?.status < 500) {
        throw createUnavailableError(error);
      }

      try {
        return await fetchJsonOnce(url);
      } catch (retryError) {
        throw createUnavailableError(retryError);
      }
    }
  })();

  /* เก็บ promise ไว้ ชื่อเดียวกันในการเรียกครั้งเดียวกันจะยิงครั้งเดียว */
  cache?.set(url, request);

  try {
    return await request;
  } catch (error) {
    cache?.delete(url);

    throw error;
  }
}

function getRankName(classification, rank) {
  return (classification || []).find((item) => item.rank === rank)?.name || null;
}

function gbifSpeciesUrl(usageKey) {
  return usageKey ? `${GBIF_SPECIES_PAGE}/${usageKey}` : null;
}

/* ใช้เมื่อไม่พบชื่อใน GBIF เพื่อให้ยังมีลิงก์ไปค้นต่อได้ */
export function gbifSearchUrl(name) {
  return `${GBIF_SPECIES_PAGE}/search?${new URLSearchParams({ q: cleanName(name) })}`;
}

/* =========================================================
   MATCH
========================================================= */

export async function matchName(name, cache = new Map()) {
  const cleaned = cleanName(name);

  const url = `${GBIF_API}/v2/species/match?${new URLSearchParams({
    scientificName: cleaned,
    verbose: "true",
  })}`;

  const data = await fetchJson(url, cache);

  const usage = data?.usage || null;

  const accepted = data?.acceptedUsage || null;

  const diagnostics = data?.diagnostics || {};

  const usageKey = usage?.key ?? null;

  return {
    matchType: diagnostics.matchType || "NONE",
    status: usage?.status || null,
    confidence: diagnostics.confidence ?? null,
    rank: usage?.rank || null,
    usageKey,
    acceptedUsageKey: accepted?.key ?? null,
    scientificName: usage?.name || null,
    canonicalName: usage?.canonicalName || null,
    family: getRankName(data?.classification, "FAMILY"),
    kingdom: getRankName(data?.classification, "KINGDOM"),
    /* v2 ส่งชื่อที่ยอมรับมาในผลเดียวกัน ไม่ต้องเรียก API เพิ่ม */
    acceptedName: data?.synonym || usage?.status === "SYNONYM"
      ? accepted?.name || null
      : null,
    gbifUrl: gbifSpeciesUrl(usageKey),
    acceptedGbifUrl: gbifSpeciesUrl(accepted?.key ?? null),
    alternatives: (diagnostics.alternatives || []).map((item) => ({
      matchType: item?.diagnostics?.matchType || null,
      confidence: item?.diagnostics?.confidence ?? null,
      status: item?.usage?.status || null,
      rank: item?.usage?.rank || null,
      usageKey: item?.usage?.key ?? null,
      scientificName: item?.usage?.name || null,
      canonicalName: item?.usage?.canonicalName || null,
      family: getRankName(item?.classification, "FAMILY"),
      kingdom: getRankName(item?.classification, "KINGDOM"),
    })),
  };
}

/* =========================================================
   CHECK
========================================================= */

/* "Zingiber", "Zingiber sp.", "Zingiber spp.", "Zingiber sp1", "Zingiber sp. 2" */
function isGenusOnlyName(cleaned) {
  const [, ...rest] = cleaned.split(" ");

  if (rest.length === 0) {
    return true;
  }

  return /^(spp?\.?|sp\.?\s*\d+)$/i.test(rest.join(" "));
}

function isFoundMatch(match) {
  if (match.matchType === "EXACT") {
    return true;
  }

  return (
    FUZZY_MATCH_TYPES.includes(match.matchType) &&
    (match.confidence ?? 0) >= FOUND_FUZZY_CONFIDENCE
  );
}

function isGenusMatch(match, cleaned) {
  const genus = cleaned.split(" ")[0].toLowerCase();

  return (
    ["HIGHERRANK", "EXACT"].includes(match.matchType) &&
    match.rank === "GENUS" &&
    String(match.canonicalName || "").toLowerCase() === genus
  );
}

export function compareFamily(inputFamily, gbifFamily) {
  const entered = cleanName(inputFamily).toLowerCase();

  if (!entered) {
    return "not_provided";
  }

  if (!gbifFamily) {
    return "unknown";
  }

  const gbif = gbifFamily.toLowerCase();

  /* "Fabaceae-Papilionoideae" ถือว่าตรงกับ "Fabaceae" */
  return entered === gbif || entered.startsWith(`${gbif}-`) ? "match" : "differs";
}

/* ผู้สมัครคำแนะนำจากผล verbose: เป็นพืชและ confidence สูง */
function candidatesFromMatch(match) {
  return [match, ...match.alternatives]
    .filter(
      (item) =>
        item.scientificName &&
        item.kingdom === "Plantae" &&
        item.matchType !== "HIGHERRANK" &&
        (item.confidence ?? 0) >= SUGGESTION_MIN_CONFIDENCE,
    )
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .map((item) => item.scientificName);
}

/*
 * ใช้ suggest ของ GBIF ด้วยคำแรก (สกุล) ร่วมกับคำที่สอง
 * 1) q = "สกุล คำที่สอง"
 * 2) ถ้าไม่พบ q = "สกุล" เพื่อหาสกุลที่สะกดใกล้กัน แล้วต่อคำที่สองเป็นชื่อใหม่
 */
async function candidatesFromSuggest(cleaned, cache) {
  const [genusWord, epithet] = cleaned.split(" ");

  if (!genusWord || !epithet) {
    return [];
  }

  const suggest = (q) =>
    fetchJson(
      `${GBIF_API}/v1/species/suggest?${new URLSearchParams({ q, limit: "10" })}`,
      cache,
    );

  const plants = (items) =>
    (items || []).filter((item) => item?.kingdom === "Plantae");

  const direct = plants(await suggest(`${genusWord} ${epithet}`))
    .filter((item) => item.rank === "SPECIES")
    .map((item) => item.scientificName);

  if (direct.length > 0) {
    return direct;
  }

  return plants(await suggest(genusWord))
    .filter((item) => item.rank === "GENUS" && item.canonicalName)
    .map((item) => `${item.canonicalName} ${epithet.toLowerCase()}`);
}

/* ทุกชื่อที่แนะนำต้องได้ EXACT จริงและมี gbifUrl */
async function verifySuggestions(names, cleaned, cache) {
  const suggestions = [];

  const seen = new Set([cleaned.toLowerCase()]);

  for (const name of names) {
    if (suggestions.length >= MAX_SUGGESTIONS) break;

    const verified = await matchName(name, cache);

    const key = String(verified.canonicalName || "").toLowerCase();

    if (
      verified.matchType !== "EXACT" ||
      !verified.gbifUrl ||
      verified.kingdom !== "Plantae" ||
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    suggestions.push({
      scientificName: verified.scientificName,
      canonicalName: verified.canonicalName,
      status: verified.status,
      acceptedName: verified.acceptedName,
      family: verified.family,
      gbifUrl: verified.gbifUrl,
    });
  }

  return suggestions;
}

export async function checkName({ botanical_name, family } = {}) {
  const input = botanical_name ?? "";

  const cleaned = cleanName(input);

  /* Map เก็บผลภายในการเรียกครั้งเดียวกัน ชื่อซ้ำไม่ยิง GBIF ซ้ำ */
  const cache = new Map();

  if (!cleaned) {
    return {
      input,
      cleaned,
      result: "not_found",
      gbif: null,
      suggestions: [],
      familyCheck: compareFamily(family, null),
    };
  }

  const gbif = await matchName(cleaned, cache);

  const genusOnly = isGenusOnlyName(cleaned);

  let result = "not_found";

  if (genusOnly && isGenusMatch(gbif, cleaned)) {
    result = "genus_only";
  } else if (!genusOnly && isFoundMatch(gbif)) {
    result = gbif.status === "SYNONYM" ? "synonym" : "ok";
  }

  let suggestions = [];

  if (result === "not_found") {
    let names = candidatesFromMatch(gbif);

    if (names.length === 0) {
      names = await candidatesFromSuggest(cleaned, cache);
    }

    suggestions = await verifySuggestions(names, cleaned, cache);
  }

  return {
    input,
    cleaned,
    result,
    gbif,
    suggestions,
    familyCheck: compareFamily(family, result === "not_found" ? null : gbif.family),
  };
}
