/* =========================================================
   PLANT IMPORT HELPERS
   ใช้ในหน้า /account/plants/import
   - อ่านไฟล์ .xlsx / .csv ด้วย SheetJS (dynamic import เฉพาะหน้านี้)
   - ตรวจข้อมูลทุกแถวก่อนบันทึก
   - ไม่ส่ง plant_id และ search_text (ฐานข้อมูลสร้างเอง)
========================================================= */

import { supabase } from "@/lib/supabase";

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

export const REQUIRED_IMPORT_FIELDS = ["pnu_no", "botanical_name"];

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

export const MAX_IMPORT_ROWS = 5000;

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

export const IMPORT_BATCH_SIZE = 500;

export const IMPORT_FILE_ACCEPT =
  ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

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

/*
 * อ่านไฟล์เป็นตาราง { headers, rows }
 * rows เป็น array ของ array (ค่าทุกช่องเป็น string)
 * โยน error ที่มี code เพื่อให้หน้าเว็บแปลข้อความ TH/EN เอง
 */
export async function readImportFile(file) {
  if (!file) {
    throw createCodedError("NO_FILE");
  }

  const name = String(file.name || "").toLowerCase();

  const isCsv = name.endsWith(".csv");

  const isXlsx = name.endsWith(".xlsx");

  if (!isCsv && !isXlsx) {
    throw createCodedError("INVALID_FILE_TYPE");
  }

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw createCodedError("FILE_TOO_LARGE");
  }

  const XLSX = await loadSheetJs();

  /* อ่านเกินขีดจำกัด 1 แถว เพื่อรู้ว่าไฟล์มีแถวเกินหรือไม่ */
  const sheetRows = MAX_IMPORT_ROWS + 2;

  let workbook;

  try {
    workbook = isCsv
      ? /* CSV อ่านเป็นข้อความ UTF-8 เพื่อให้ภาษาไทยถูกต้อง และไม่แปลงชนิดข้อมูล */
        XLSX.read(stripBom(await file.text()), {
          type: "string",
          raw: true,
          sheetRows,
        })
      : XLSX.read(await file.arrayBuffer(), {
          type: "array",
          sheetRows,
        });
  } catch (error) {
    console.error("Read import file error:", error);

    throw createCodedError("READ_FAILED");
  }

  const sheetName = workbook.SheetNames[0];

  const sheet = sheetName ? workbook.Sheets[sheetName] : null;

  if (!sheet) {
    throw createCodedError("EMPTY_FILE");
  }

  const table = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: "",
    blankrows: false,
  });

  const [headerRow = [], ...bodyRows] = table;

  const headers = headerRow.map((value) => cellToText(value) || "");

  const rows = bodyRows
    .map((row) => row.map((value) => cellToText(value) || ""))
    .filter((row) => row.some((value) => value !== ""));

  if (!headers.some(Boolean) || rows.length === 0) {
    throw createCodedError("EMPTY_FILE");
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw createCodedError("TOO_MANY_ROWS");
  }

  return { headers, rows };
}

/* =========================================================
   COLUMN MAPPING
========================================================= */

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/* คืน { field: columnIndex | "" } จับคู่อัตโนมัติเมื่อหัวคอลัมน์ตรงชื่อฟิลด์ */
export function autoMapColumns(headers) {
  const normalized = headers.map(normalizeHeader);

  return Object.fromEntries(
    IMPORT_FIELDS.map((field) => {
      const index = normalized.indexOf(field);

      return [field, index >= 0 ? String(index) : ""];
    }),
  );
}

/* =========================================================
   VALIDATION
========================================================= */

/*
 * ตรวจทุกแถวในเครื่อง (ยังไม่ตรวจกับฐานข้อมูล)
 * คืน array ของ { rowNumber, values, record, errors }
 * - rowNumber คือเลขแถวในไฟล์ (แถว 1 คือหัวคอลัมน์)
 * - errors เป็นรหัส เช่น "pnuInvalid" ให้หน้าเว็บแปลเป็น TH/EN
 */
export function validateImportRows(rows, mapping) {
  const result = rows.map((row, index) => {
    const values = {};

    IMPORT_FIELDS.forEach((field) => {
      const column = mapping[field];

      values[field] = column === "" || column === undefined
        ? null
        : cellToText(row[Number(column)]);
    });

    const errors = [];

    const pnuNo = parsePositiveInteger(values.pnu_no);

    if (values.pnu_no === null) {
      errors.push("pnuRequired");
    } else if (pnuNo === null) {
      errors.push("pnuInvalid");
    }

    if (values.botanical_name === null) {
      errors.push("botanicalRequired");
    }

    const latitude = parseCoordinate(values.latitude, 90);

    if (latitude === undefined) {
      errors.push("latitudeInvalid");
    }

    const longitude = parseCoordinate(values.longitude, 180);

    if (longitude === undefined) {
      errors.push("longitudeInvalid");
    }

    if (values.image_url !== null && !isHttpsUrl(values.image_url)) {
      errors.push("imageUrlInvalid");
    }

    return {
      rowNumber: index + 2,

      values,

      errors,

      record: {
        pnu_no: pnuNo,
        botanical_name: values.botanical_name,
        family: values.family,
        artificial_group: values.artificial_group,
        locality: values.locality,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        /* elevation เป็น text และอาจเป็นช่วง เช่น "800–900 m" */
        elevation: values.elevation,
        collected_by: values.collected_by,
        collector_no: values.collector_no,
        image_url: values.image_url,
      },
    };
  });

  /* pnu_no ซ้ำในไฟล์: ทำเครื่องหมายทุกแถวที่ซ้ำ เพราะไม่รู้ว่าแถวไหนถูก */
  const counts = new Map();

  result.forEach(({ record }) => {
    if (record.pnu_no !== null) {
      counts.set(record.pnu_no, (counts.get(record.pnu_no) || 0) + 1);
    }
  });

  result.forEach((row) => {
    if (row.record.pnu_no !== null && counts.get(row.record.pnu_no) > 1) {
      row.errors.push("pnuDuplicateInFile");
    }
  });

  return result;
}

/* ค้นหา pnu_no ที่มีอยู่แล้วในฐานข้อมูล ทีละชุดไม่เกิน 500 ค่า */
export async function findExistingPnuNumbers(pnuNumbers) {
  const unique = [...new Set(pnuNumbers.filter((value) => value !== null))];

  const existing = new Set();

  for (const chunk of chunkArray(unique, IMPORT_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from("plants")
      .select("pnu_no")
      .in("pnu_no", chunk);

    if (error) {
      throw error;
    }

    (data || []).forEach((plant) => existing.add(Number(plant.pnu_no)));
  }

  return existing;
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

/* ตัดช่องว่างหน้า/หลัง ค่าว่างเป็น null */
export function cellToText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

export function parsePositiveInteger(value) {
  const text = String(value ?? "").trim();

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const number = Number(text);

  return Number.isSafeInteger(number) && number >= 1 ? number : null;
}

/* ว่าง = null, ถูกต้อง = number, ผิด = undefined */
function parseCoordinate(value, limit) {
  if (value === null) {
    return null;
  }

  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(value)) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) && Math.abs(number) <= limit
    ? number
    : undefined;
}

function isHttpsUrl(value) {
  if (!String(value).startsWith("https://")) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

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

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function createCodedError(code) {
  const error = new Error(code);

  error.code = code;

  return error;
}
