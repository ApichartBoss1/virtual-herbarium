/* =========================================================
   GEOCODE FILL
   เติมพิกัดโดยประมาณให้รายการที่มี locality แต่ยังไม่มีพิกัด
   ใช้ร่วมกันทั้งหลังนำเข้า และปุ่ม "เติมพิกัดให้รายการที่ยังไม่มี"
   - ค้นครั้งเดียวต่อชื่อสถานที่ แล้ว update ทุกรายการในกลุ่ม
   - update เฉพาะแถวที่ latitude ยังเป็น null (ไม่เขียนทับพิกัดที่มีแล้ว)
   - elevation ใส่ทุกรายการที่ได้พิกัด เฉพาะแถวที่ elevation ยังว่าง
   - หยุดแล้วเริ่มใหม่ ทำต่อเฉพาะรายการที่ยังไม่มีพิกัด
   และ runElevationFill: เติมความสูงให้รายการ geocoded ที่ยังไม่มีความสูง
   จากพิกัดที่บันทึกไว้ (ไม่ค้น Nominatim ใหม่)
========================================================= */

import { supabase } from "@/lib/supabase";
import { COORDINATE_SOURCE } from "@/lib/coordinateSource";
import {
  ELEVATION_BATCH_SIZE,
  PRECISIONS,
  fetchElevations,
  formatElevation,
  geocodeLocality,
  prepareLocality,
} from "@/lib/geocodeLocality";
import { appendTableSheet } from "@/lib/plantImportReport";

const FETCH_PAGE_SIZE = 1000;

/* id ต่อหนึ่งคำขอ update (กัน URL ยาวเกิน) */
const UPDATE_ID_CHUNK = 100;

/*
 * ผลค้นที่เก็บไว้ในเครื่อง (นโยบาย Nominatim ให้ cache ผลไว้)
 * key คือข้อความที่ใช้ค้นจริงทุกขั้น แก้กฎใน lib/localityFixes.js แล้ว key เปลี่ยนเอง
 */
const CACHE_KEY = "vh-geocode-cache-v2";

/* cache รุ่นเก่าที่ key ไม่ผูกกับข้อความที่ใช้ค้น ลบทิ้ง */
const OLD_CACHE_KEYS = ["vh-geocode-cache-v1"];

const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/* =========================================================
   DATABASE
========================================================= */

/* ยังไม่ได้รันไฟล์ 03: เลือกคอลัมน์ coordinate_source ไม่ได้ */
export async function hasCoordinateColumns() {
  const { error } = await supabase
    .from("plants")
    .select("coordinate_source, coordinate_uncertainty_m")
    .limit(1);

  return !error;
}

function missingCoordinatesQuery(columns, options) {
  return supabase
    .from("plants")
    .select(columns, options)
    .not("locality", "is", null)
    .neq("locality", "")
    .is("latitude", null);
}

export async function countPlantsMissingCoordinates() {
  const { count, error } = await missingCoordinatesQuery("id", {
    count: "exact",
    head: true,
  });

  if (error) {
    throw error;
  }

  return count || 0;
}

/*
 * รายการที่มี locality แต่ยังไม่มีพิกัด (วน range() ทีละ 1000)
 * pnuNumbers: จำกัดเฉพาะ PNU เหล่านี้ (เช่น รายการที่เพิ่งนำเข้า)
 */
export async function fetchPlantsMissingCoordinates({ pnuNumbers = null } = {}) {
  const only = pnuNumbers ? new Set(pnuNumbers) : null;

  const plants = [];

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await missingCoordinatesQuery(
      "id, pnu_no, locality, elevation",
    )
      .order("plant_id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    (data || []).forEach((plant) => {
      if (!only || only.has(Number(plant.pnu_no))) {
        plants.push(plant);
      }
    });

    if (!data || data.length < FETCH_PAGE_SIZE) {
      return plants;
    }
  }
}

/* จัดกลุ่มตาม locality (ตัดช่องว่างหน้า/หลัง) เรียงจากกลุ่มใหญ่ไปเล็ก */
export function groupPlantsByLocality(plants) {
  const groups = new Map();

  plants.forEach((plant) => {
    const locality = String(plant.locality || "").trim();

    if (!locality) {
      return;
    }

    if (!groups.has(locality)) {
      groups.set(locality, { locality, plants: [] });
    }

    groups.get(locality).plants.push(plant);
  });

  return [...groups.values()].sort((a, b) => b.plants.length - a.plants.length);
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

/* ใส่พิกัดให้ทั้งกลุ่ม เฉพาะแถวที่ latitude ยังเป็น null คืนจำนวนแถวที่ถูก update */
async function updateGroupCoordinates(ids, result) {
  let updated = 0;

  for (const idChunk of chunk(ids, UPDATE_ID_CHUNK)) {
    const { data, error } = await supabase
      .from("plants")
      .update({
        latitude: result.latitude,
        longitude: result.longitude,
        coordinate_source: COORDINATE_SOURCE.geocoded,
        coordinate_uncertainty_m: result.uncertainty_m,
      })
      .in("id", idChunk)
      .is("latitude", null)
      .select("id");

    if (error) {
      throw error;
    }

    updated += data?.length || 0;
  }

  return updated;
}

/*
 * ความสูง: เฉพาะแถวที่ elevation ยังว่าง และยังเป็นพิกัด geocoded (ไม่แตะ manual)
 * คืนจำนวนแถวที่ถูก update
 */
async function updateGroupElevation(ids, elevationText) {
  let updated = 0;

  for (const idChunk of chunk(ids, UPDATE_ID_CHUNK)) {
    const { data, error } = await supabase
      .from("plants")
      .update({ elevation: elevationText })
      .in("id", idChunk)
      .is("elevation", null)
      .eq("coordinate_source", COORDINATE_SOURCE.geocoded)
      .select("id");

    if (error) {
      throw error;
    }

    updated += data?.length || 0;
  }

  return updated;
}

/* =========================================================
   ELEVATION FILL
   รายการ geocoded ที่มีพิกัดแต่ elevation ยังเป็น null
========================================================= */

function missingElevationQuery(columns, options) {
  return supabase
    .from("plants")
    .select(columns, options)
    .eq("coordinate_source", COORDINATE_SOURCE.geocoded)
    .is("elevation", null)
    .not("latitude", "is", null)
    .not("longitude", "is", null);
}

export async function countGeocodedMissingElevation() {
  const { count, error } = await missingElevationQuery("id", {
    count: "exact",
    head: true,
  });

  if (error) {
    throw error;
  }

  return count || 0;
}

/* วน range() ทีละ 1000 แล้วจัดกลุ่มตามพิกัด (วัดครั้งเดียวต่อกลุ่ม) */
export async function fetchGeocodedMissingElevationGroups() {
  const groups = new Map();

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await missingElevationQuery(
      "id, latitude, longitude",
    )
      .order("plant_id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    (data || []).forEach((plant) => {
      const latitude = Number(plant.latitude);

      const longitude = Number(plant.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      const key = `${latitude},${longitude}`;

      if (!groups.has(key)) {
        groups.set(key, { latitude, longitude, ids: [] });
      }

      groups.get(key).ids.push(plant.id);
    });

    if (!data || data.length < FETCH_PAGE_SIZE) {
      break;
    }
  }

  return [...groups.values()];
}

/*
 * วัดความสูงครั้งละไม่เกิน 100 จุด แล้ว update เฉพาะ elevation
 * - shouldStop(): เช็กก่อนแต่ละชุด
 * - onProgress({ done, total, filled, unmeasured }) นับเป็นจำนวนจุด (กลุ่มพิกัด)
 * คืน { points, filled (แถว), unmeasured (จุด), unmeasuredRows, errors, stopped }
 */
export async function runElevationFill({
  groups,
  onProgress = () => {},
  shouldStop = () => false,
  signal,
}) {
  const summary = {
    points: 0,
    filled: 0,
    unmeasured: 0,
    unmeasuredRows: 0,
    errors: [],
    stopped: false,
  };

  for (const batch of chunk(groups, ELEVATION_BATCH_SIZE)) {
    if (shouldStop() || signal?.aborted) {
      summary.stopped = true;
      break;
    }

    try {
      const elevations = await fetchElevations(batch, { signal });

      for (let index = 0; index < batch.length; index += 1) {
        if (elevations[index] === null) {
          summary.unmeasured += 1;
          summary.unmeasuredRows += batch[index].ids.length;
          continue;
        }

        summary.filled += await updateGroupElevation(
          batch[index].ids,
          formatElevation(elevations[index]),
        );
      }
    } catch (err) {
      if (signal?.aborted) {
        summary.stopped = true;
        break;
      }

      console.error("Elevation fill error:", err);

      summary.errors.push(err?.message || String(err));
    }

    summary.points += batch.length;

    onProgress({
      done: summary.points,
      total: groups.length,
      filled: summary.filled,
      unmeasured: summary.unmeasured,
    });
  }

  return summary;
}

/* =========================================================
   CACHE
========================================================= */

function readCache() {
  try {
    OLD_CACHE_KEYS.forEach((key) => window.localStorage.removeItem(key));

    const data = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");

    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* localStorage เต็มหรือถูกปิด: ไม่ cache */
  }
}

function cacheKey(locality) {
  const { queries } = prepareLocality(locality);

  return queries
    .map((query) => `${query.featureType || ""}:${query.q}`.toLowerCase())
    .join(" | ");
}

/* =========================================================
   RUN
========================================================= */

/*
 * เติมพิกัดทีละชื่อสถานที่
 * - onProgress({ index, total, filled, locality, etaMs })
 * - shouldStop(): เช็กก่อนเริ่มแต่ละชื่อ (ไม่ตัดกลางชื่อ)
 * - signal: ยกเลิกคำขอที่ค้างอยู่ (เช่น ออกจากหน้า)
 * คืน { results, stopped }
 * result: { locality, count, pnus, status, latitude, longitude, precision,
 *           uncertainty_m, elevation, updated, query, displayName, message }
 * status: found | not_found | skipped | error
 */
export async function runGeocodeFill({
  groups,
  onProgress = () => {},
  shouldStop = () => false,
  signal,
}) {
  const results = [];

  const cache = readCache();

  const elevationQueue = [];

  let filled = 0;

  let stopped = false;

  let networkMs = 0;

  let networkCount = 0;

  /* ความสูงทีละไม่เกิน 100 จุด */
  async function flushElevations() {
    if (elevationQueue.length === 0) {
      return;
    }

    const batch = elevationQueue.splice(0, elevationQueue.length);

    try {
      const elevations = await fetchElevations(
        batch.map(({ result }) => result),
        { signal },
      );

      for (let index = 0; index < batch.length; index += 1) {
        if (elevations[index] === null) {
          continue;
        }

        const text = formatElevation(elevations[index]);

        await updateGroupElevation(batch[index].ids, text);

        batch[index].result.elevation = text;
      }
    } catch (err) {
      console.error("Fill elevation error:", err);

      batch.forEach(({ result }) => {
        result.message = [result.message, `elevation: ${err?.message || err}`]
          .filter(Boolean)
          .join(" • ");
      });
    }
  }

  for (let index = 0; index < groups.length; index += 1) {
    if (shouldStop() || signal?.aborted) {
      stopped = true;
      break;
    }

    const group = groups[index];

    const remaining = groups.length - index;

    onProgress({
      index: index + 1,
      total: groups.length,
      filled,
      locality: group.locality,
      etaMs: networkCount ? (networkMs / networkCount) * remaining : null,
    });

    const ids = group.plants.map((plant) => plant.id);

    const result = {
      locality: group.locality,
      count: group.plants.length,
      pnus: group.plants.map((plant) => plant.pnu_no),
      status: "error",
      latitude: null,
      longitude: null,
      precision: null,
      uncertainty_m: null,
      elevation: null,
      updated: 0,
      query: "",
      displayName: "",
      message: "",
    };

    try {
      const key = cacheKey(group.locality);

      const cached = cache[key];

      let found;

      if (
        cached?.result?.status === "found" &&
        Date.now() - cached.at < CACHE_MAX_AGE_MS
      ) {
        found = cached.result;
      } else {
        const startedAt = Date.now();

        found = await geocodeLocality(group.locality, { signal });

        networkMs += Date.now() - startedAt;

        networkCount += 1;

        /* "หาไม่เจอ" ไม่เก็บ: เพิ่มกฎแล้วกดใหม่จะค้นอีกครั้ง */
        if (found.status === "found") {
          cache[key] = { at: Date.now(), result: found };

          writeCache(cache);
        }
      }

      Object.assign(result, {
        status: found.status,
        query: found.query || "",
        displayName: found.displayName || "",
      });

      if (found.status === "found") {
        Object.assign(result, {
          latitude: found.latitude,
          longitude: found.longitude,
          precision: found.precision,
          uncertainty_m: found.uncertainty_m,
        });

        result.updated = await updateGroupCoordinates(ids, found);

        filled += result.updated;

        const needElevation = group.plants
          .filter((plant) => !String(plant.elevation ?? "").trim())
          .map((plant) => plant.id);

        if (needElevation.length) {
          elevationQueue.push({ ids: needElevation, result });
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        stopped = true;
        break;
      }

      console.error("Geocode fill error:", err);

      result.status = "error";
      result.message = err?.message || String(err);
    }

    results.push(result);

    if (elevationQueue.length >= ELEVATION_BATCH_SIZE) {
      await flushElevations();
    }
  }

  if (!signal?.aborted) {
    await flushElevations();
  }

  onProgress({
    index: results.length,
    total: groups.length,
    filled,
    locality: "",
    etaMs: 0,
  });

  return { results, stopped };
}

/* สรุปผล: เติมได้แยกตาม precision, หาไม่เจอ, ข้าม, ผิดพลาด (นับเป็นจำนวนรายการ) */
export function summarizeGeocodeResults(results) {
  const summary = {
    found: Object.fromEntries(PRECISIONS.map((precision) => [precision, 0])),
    filled: 0,
    not_found: 0,
    skipped: 0,
    error: 0,
    localities: results.length,
  };

  results.forEach((result) => {
    if (result.status === "found") {
      summary.found[result.precision] += result.updated;
      summary.filled += result.updated;
    } else {
      summary[result.status] += result.count;
    }
  });

  return summary;
}

/* =========================================================
   REPORT
========================================================= */

const REPORT_TEXT = {
  sheet: "เติมพิกัด",
  columns: [
    "locality",
    "จำนวนรายการ",
    "ผล",
    "latitude",
    "longitude",
    "precision",
    "uncertainty_m",
    "elevation",
    "บันทึกแล้ว (รายการ)",
    "คำค้นที่พบ",
    "ผลลัพธ์จาก Nominatim",
    "PNU ที่เกี่ยวข้อง",
    "หมายเหตุ",
  ],
  statuses: {
    found: "เติมแล้ว",
    not_found: "หาไม่เจอ",
    skipped: "ข้าม (ไม่ใช่ชื่อสถานที่)",
    error: "ผิดพลาด",
  },
};

export function buildGeocodeReportWorkbook(XLSX, results) {
  const workbook = XLSX.utils.book_new();

  const order = ["found", "not_found", "skipped", "error"];

  const rows = [...results]
    .sort(
      (a, b) =>
        order.indexOf(a.status) - order.indexOf(b.status) || b.count - a.count,
    )
    .map((result) => [
      result.locality,
      result.count,
      REPORT_TEXT.statuses[result.status] || result.status,
      result.latitude ?? "",
      result.longitude ?? "",
      result.precision ?? "",
      result.uncertainty_m ?? "",
      result.elevation ?? "",
      result.updated,
      result.status === "found" ? result.query : "",
      result.displayName,
      [...result.pnus].sort((a, b) => a - b).join(", "),
      result.message,
    ]);

  appendTableSheet(XLSX, workbook, REPORT_TEXT.sheet, [REPORT_TEXT.columns, ...rows]);

  return workbook;
}
