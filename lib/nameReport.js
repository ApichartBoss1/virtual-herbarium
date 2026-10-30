/* =========================================================
   NAME REPORT
   ตรวจชื่อวิทยาศาสตร์ทั้งหมดกับ GBIF (checkName จาก lib/gbif.js)
   - รายงานอย่างเดียว ไม่แก้ข้อมูลในฐานข้อมูล
   - ทำพร้อมกันไม่เกิน 4 ชื่อ ลองใหม่เมื่อ GBIF ไม่ตอบ
   - เก็บผลที่ตรวจแล้วใน localStorage หยุด/ปิดหน้าแล้วกดใหม่ทำต่อจากเดิม
========================================================= */

import { supabase } from "@/lib/supabase";
import { checkName, gbifSearchUrl } from "@/lib/gbif";
import { appendTableSheet } from "@/lib/plantImportReport";

export const NAME_CHECK_CONCURRENCY = 4;

/* ลองใหม่เพิ่ม (นอกจากที่ checkName ลองเองแล้ว 1 ครั้ง) */
const NAME_CHECK_RETRIES = 2;

const RETRY_DELAY_MS = 2000;

const FETCH_PAGE_SIZE = 1000;

const STORAGE_KEY = "vh-name-report-v1";

/* บันทึกลง localStorage ไม่ถี่กว่านี้ (และบันทึกครั้งสุดท้ายเสมอ) */
const SAVE_INTERVAL_MS = 1500;

export const NAME_RESULTS = [
  "ok",
  "synonym",
  "spelling",
  "genus_only",
  "not_found",
  "error",
];

/* =========================================================
   DATABASE
========================================================= */

/*
 * ชื่อวิทยาศาสตร์ไม่ซ้ำทั้งหมด (วน range() ทีละ 1000)
 * คืน [{ name, count, pnus, families }] เรียงตามชื่อ
 */
export async function fetchDistinctBotanicalNames() {
  const groups = new Map();

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("plants")
      .select("botanical_name, family, pnu_no")
      .not("botanical_name", "is", null)
      .neq("botanical_name", "")
      .order("plant_id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    (data || []).forEach((plant) => {
      const name = String(plant.botanical_name).replace(/\s+/g, " ").trim();

      if (!name) {
        return;
      }

      if (!groups.has(name)) {
        groups.set(name, { name, count: 0, pnus: [], families: new Map() });
      }

      const group = groups.get(name);

      group.count += 1;

      if (plant.pnu_no !== null && plant.pnu_no !== undefined) {
        group.pnus.push(Number(plant.pnu_no));
      }

      const family = String(plant.family || "").trim();

      if (family) {
        group.families.set(family, (group.families.get(family) || 0) + 1);
      }
    });

    if (!data || data.length < FETCH_PAGE_SIZE) {
      break;
    }
  }

  return [...groups.values()]
    .map((group) => ({
      name: group.name,
      count: group.count,
      pnus: group.pnus.sort((a, b) => a - b),
      /* วงศ์ที่ใช้บ่อยที่สุดก่อน */
      families: [...group.families.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([family]) => family),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* =========================================================
   STORAGE
========================================================= */

export function loadStoredResults() {
  try {
    const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");

    return data?.results && typeof data.results === "object" ? data.results : {};
  } catch {
    return {};
  }
}

function saveStoredResults(results) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), results }),
    );
  } catch (err) {
    console.error("Save name report error:", err);
  }
}

export function clearStoredResults() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ไม่มี localStorage ก็ไม่ต้องล้าง */
  }
}

/* =========================================================
   CHECK
========================================================= */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ผลที่เก็บไว้ (เฉพาะที่ต้องใช้ในรายงาน) */
function compactResult(check, durationMs) {
  const gbif = check.gbif;

  const suggestion = check.suggestions?.[0] || null;

  let suggested = "";

  let gbifUrl = gbif?.gbifUrl || null;

  if (check.result === "synonym") {
    suggested = gbif?.acceptedName || "";
    gbifUrl = gbif?.acceptedGbifUrl || gbifUrl;
  } else if (suggestion) {
    suggested = suggestion.acceptedName
      ? `${suggestion.scientificName} → ${suggestion.acceptedName}`
      : suggestion.scientificName;
    gbifUrl = suggestion.gbifUrl || gbifUrl;
  }

  return {
    result: check.result,
    suggested,
    gbifFamily: check.result === "not_found" ? "" : gbif?.family || "",
    gbifUrl: gbifUrl || gbifSearchUrl(check.input),
    message: "",
    durationMs,
    checkedAt: Date.now(),
  };
}

async function checkWithRetry(entry) {
  let lastError = null;

  for (let attempt = 0; attempt <= NAME_CHECK_RETRIES; attempt += 1) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      return await checkName({
        botanical_name: entry.name,
        family: entry.families[0] || "",
      });
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

/*
 * ตรวจชื่อที่ยังไม่มีผลใน stored ทีละไม่เกิน 4 ชื่อพร้อมกัน
 * - shouldStop(): เช็กก่อนหยิบชื่อใหม่ ชื่อที่กำลังตรวจทำต่อจนเสร็จ
 * - onProgress({ done, total, current: [ชื่อที่กำลังตรวจ], etaMs })
 * คืน { results (รวมผลเดิม), stopped }
 */
export async function runNameCheck({
  entries,
  stored = {},
  onProgress = () => {},
  shouldStop = () => false,
}) {
  const results = { ...stored };

  const queue = entries.filter((entry) => !results[entry.name]);

  const total = queue.length;

  const current = new Set();

  const startedAt = Date.now();

  let done = 0;

  let next = 0;

  let stopped = false;

  let lastSave = 0;

  const report = () =>
    onProgress({
      done,
      total,
      current: [...current],
      etaMs:
        done > 0
          ? ((Date.now() - startedAt) / done) * (total - done)
          : null,
    });

  const save = (force = false) => {
    if (force || Date.now() - lastSave >= SAVE_INTERVAL_MS) {
      lastSave = Date.now();
      saveStoredResults(results);
    }
  };

  async function worker() {
    while (next < queue.length) {
      if (shouldStop()) {
        stopped = true;
        return;
      }

      const entry = queue[next];

      next += 1;

      current.add(entry.name);

      report();

      const begin = Date.now();

      try {
        const check = await checkWithRetry(entry);

        results[entry.name] = compactResult(check, Date.now() - begin);
      } catch (err) {
        /* GBIF ไม่ตอบหลังลองครบ: ไม่เก็บลง storage เพื่อให้ตรวจใหม่รอบหน้า */
        results[entry.name] = {
          result: "error",
          suggested: "",
          gbifFamily: "",
          gbifUrl: gbifSearchUrl(entry.name),
          message: err?.message || String(err),
          durationMs: Date.now() - begin,
          transient: true,
        };
      }

      current.delete(entry.name);

      done += 1;

      save();

      report();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(NAME_CHECK_CONCURRENCY, queue.length) }, worker),
  );

  /* ผล error ชั่วคราวไม่เก็บ เพื่อให้กดใหม่แล้วตรวจชื่อนั้นอีกครั้ง */
  const persisted = Object.fromEntries(
    Object.entries(results).filter(([, value]) => !value.transient),
  );

  saveStoredResults(persisted);

  return { results, stopped: stopped || next < queue.length };
}

/* นับจำนวนชื่อตามผล เฉพาะชื่อที่ยังอยู่ในฐานข้อมูล */
export function summarizeNameResults(entries, results) {
  const summary = Object.fromEntries(NAME_RESULTS.map((key) => [key, 0]));

  let checked = 0;

  entries.forEach((entry) => {
    const result = results[entry.name];

    if (result) {
      summary[result.result] += 1;
      checked += 1;
    }
  });

  return { ...summary, checked, total: entries.length };
}

/* =========================================================
   REPORT
========================================================= */

const REPORT_TEXT = {
  sheet: "ชื่อที่ต้องตรวจ",
  columns: [
    "ชื่อเดิม",
    "ผล",
    "ชื่อที่แนะนำหรือชื่อที่ยอมรับ",
    "วงศ์เดิม",
    "วงศ์ตาม GBIF",
    "จำนวนรายการ",
    "รายการ PNU",
    "ลิงก์ GBIF",
    "หมายเหตุ",
  ],
  results: {
    synonym: "ชื่อพ้อง (synonym)",
    spelling: "อาจสะกดผิด (spelling)",
    genus_only: "ระบุถึงสกุลเท่านั้น (genus_only)",
    not_found: "ไม่พบใน GBIF (not_found)",
    error: "ตรวจไม่สำเร็จ (error)",
  },
};

/* รายงานเฉพาะชื่อที่ไม่ใช่ ok เรียงตามผลแล้วตามชื่อ */
export function buildNameReportWorkbook(XLSX, entries, results) {
  const order = NAME_RESULTS;

  const rows = entries
    .filter((entry) => results[entry.name] && results[entry.name].result !== "ok")
    .sort(
      (a, b) =>
        order.indexOf(results[a.name].result) - order.indexOf(results[b.name].result) ||
        a.name.localeCompare(b.name),
    )
    .map((entry) => {
      const result = results[entry.name];

      return [
        entry.name,
        REPORT_TEXT.results[result.result] || result.result,
        result.suggested,
        entry.families.join(", "),
        result.gbifFamily,
        entry.count,
        entry.pnus.join(", "),
        result.gbifUrl,
        result.message,
      ];
    });

  const workbook = XLSX.utils.book_new();

  appendTableSheet(XLSX, workbook, REPORT_TEXT.sheet, [REPORT_TEXT.columns, ...rows]);

  return workbook;
}
