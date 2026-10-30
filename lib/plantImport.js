/* =========================================================
   PLANT IMPORT HELPERS
   ใช้ในหน้า /account/plants/import
   - โหลด SheetJS แบบ dynamic import เฉพาะหน้านี้
   - อ่าน ทำความสะอาด และคัดแถวอยู่ใน lib/plantImportSheets.js
   - ไม่ส่ง plant_id และ search_text (ฐานข้อมูลสร้างเอง)
========================================================= */

import { supabase } from "@/lib/supabase";
import { parsePositiveInteger } from "@/lib/plantImportSheets";

export const IMPORT_FIELDS = [
  "pnu_no",
  "botanical_name",
  "family",
  "artificial_group",
  "locality",
  "latitude",
  "longitude",
  "elevation",
  "collected_by",
  "collector_no",
  "image_url",
];

export const TEMPLATE_SAMPLE_ROW = {
  pnu_no: 12345,
  botanical_name: "Shorea roxburghii G.Don",
  family: "Dipterocarpaceae",
  artificial_group: "angiosperm",
  locality: "Naresuan University, Phitsanulok",
  latitude: 16.7484,
  longitude: 100.1923,
  elevation: "800–900 m",
  collected_by: "A. Collector",
  collector_no: "AC-001",
  image_url: "https://example.com/plant.jpg",
};

export const IMPORT_BATCH_SIZE = 500;

const FETCH_PAGE_SIZE = 1000;

/* =========================================================
   SHEETJS
========================================================= */

export async function loadSheetJs() {
  const sheetJs = await import("xlsx");

  return sheetJs.read ? sheetJs : sheetJs.default;
}

export async function downloadImportTemplate() {
  const XLSX = await loadSheetJs();

  const sheet = XLSX.utils.aoa_to_sheet([
    IMPORT_FIELDS,
    IMPORT_FIELDS.map((field) => TEMPLATE_SAMPLE_ROW[field]),
  ]);

  sheet["!cols"] = IMPORT_FIELDS.map((field) => ({
    wch: Math.max(field.length, String(TEMPLATE_SAMPLE_ROW[field]).length) + 2,
  }));

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, sheet, "plants");

  XLSX.writeFile(workbook, "plant-import-template.xlsx");
}

/* ค้นหาพืชตาม pnu_no ทีละชุดไม่เกิน 500 ค่า คืน Map<pnu_no, plant> */
export async function fetchPlantsByPnu(pnuNumbers, columns = "pnu_no") {
  const unique = [...new Set(pnuNumbers.filter((value) => value !== null))];

  const plants = new Map();

  for (const chunk of chunkArray(unique, IMPORT_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from("plants")
      .select(columns)
      .in("pnu_no", chunk);

    if (error) {
      throw error;
    }

    (data || []).forEach((plant) => plants.set(Number(plant.pnu_no), plant));
  }

  return plants;
}

/*
 * pnu_no ทั้งหมดในฐานข้อมูล (ฝั่ง admin เห็นทุกรายการ)
 * วน range() ทีละ 1000 แถวตามกติกาของโปรเจกต์ คืน Set<number>
 */
export async function fetchAllPnuNumbers() {
  const pnuNumbers = new Set();

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("plants")
      .select("pnu_no")
      .not("pnu_no", "is", null)
      .order("plant_id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    (data || []).forEach((plant) => pnuNumbers.add(Number(plant.pnu_no)));

    if (!data || data.length < FETCH_PAGE_SIZE) {
      return pnuNumbers;
    }
  }
}

/* ชื่อไฟล์ (ไม่รวมนามสกุล) คือ pnu_no เช่น 12345.jpg → 12345 */
export function getPnuFromFileName(fileName) {
  return parsePositiveInteger(String(fileName || "").replace(/\.[^.]*$/, ""));
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

export function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

/* รันงานพร้อมกันไม่เกิน limit งาน */
export async function runWithConcurrency(items, limit, worker) {
  let nextIndex = 0;

  async function runner() {
    while (nextIndex < items.length) {
      const index = nextIndex;

      nextIndex += 1;

      await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, runner),
  );
}

/* ดาวน์โหลด CSV แบบ UTF-8 + BOM ให้ Excel แสดงภาษาไทยถูกต้อง */
export function downloadCsv(fileName, headers, rows) {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvValue).join(","),
  );

  const blob = new Blob([`﻿${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = fileName;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
