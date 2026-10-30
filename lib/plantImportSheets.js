/* =========================================================
   PLANT IMPORT: อ่านไฟล์ทุกชีต ทำความสะอาด และคัดแถว
   ใช้ในหน้า /account/plants/import
   - ไม่เรียกฐานข้อมูล (ส่ง pnu_no ที่มีในระบบเข้ามาเอง)
   - ไม่แตะ DOM จึงรันใน Web Worker หรือ Node ได้
========================================================= */

export const SHEET_IMPORT_FIELDS = [
  "pnu_no",
  "artificial_group",
  "family",
  "botanical_name",
  "collected_by",
  "collector_no",
  "locality",
  "latitude",
  "longitude",
  "elevation",
];

/* หัวคอลัมน์ในเทมเพลต (ตรงกับไฟล์ PNU Herbarium เดิม) */
export const TEMPLATE_HEADERS = {
  pnu_no: "PNU no.",
  artificial_group: "Artificial group",
  family: "Family",
  botanical_name: "Botanical name",
  collected_by: "Collector",
  collector_no: "Collector no.",
  locality: "Locality/NP/Province",
  latitude: "latitude",
  longitude: "longitude",
  elevation: "elevation",
};

/* ชีตคำอธิบายในเทมเพลต ไม่อ่านเป็นข้อมูล */
export const TEMPLATE_GUIDE_SHEET = "คำอธิบาย";

/* หัวคอลัมน์ที่รับได้ เทียบหลังตัดช่องว่างและทำเป็นตัวเล็ก */
const HEADER_ALIASES = {
  pnu_no: ["pnu no.", "pnu_no"],
  artificial_group: ["artificial group", "artificial_group"],
  family: ["family"],
  botanical_name: ["botanical name", "botanical_name"],
  collected_by: ["collector", "collected_by"],
  collector_no: ["collector no.", "collector_no"],
  locality: ["locality/np/province", "locality"],
  latitude: ["latitude"],
  longitude: ["longitude"],
  elevation: ["elevation"],
};

/* ช่องบังคับที่ผู้ใช้เลือกได้ (ข้อ e) ค่าเริ่มต้นเลือกทุกช่อง */
export const REQUIRED_FIELD_OPTIONS = [
  "botanical_name",
  "family",
  "artificial_group",
  "collected_by",
  "collector_no",
  "locality",
];

export const ARTIFICIAL_GROUPS = [
  "angiosperm",
  "pteridophyte",
  "mosses",
  "liverworts",
  "gymnosperm",
  "bryophyte",
  "hornworts",
];

const ARTIFICIAL_GROUP_ALIASES = { fern: "pteridophyte" };

/* เหตุผลที่คัดออก เรียงตามลำดับการตรวจ */
export const SKIP_REASONS = [
  "blank",
  "pnuInvalid",
  "pnuDuplicateInFile",
  "pnuExists",
  "incomplete",
];

export const MAX_SHEET_IMPORT_ROWS = 20000;

export const MAX_SHEET_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

export const SHEET_IMPORT_ACCEPT =
  ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

/* =========================================================
   READ
========================================================= */

/*
 * อ่านทุกชีตเป็น { sheets, rows }
 * - sheets: [{ name, rowCount, headers, columns, mapping, unusedHeaders }]
 *   columns คือชื่อคอลัมน์สำหรับรายงาน (หัวว่างใช้ชื่อคอลัมน์ Excel เช่น "(I)")
 * - rows: [{ sheet, rowNumber, raw, original, collectorNoDate, collectorNoDateValue }]
 *   raw คือค่าดิบของแต่ละฟิลด์ที่จับคู่ได้ (ยังไม่ทำความสะอาด)
 *   original คือ { ชื่อคอลัมน์: ข้อความตามที่แสดงในไฟล์ } ทุกคอลัมน์ ใช้ทำรายงาน
 *   rowNumber คือเลขแถวเดิมใน Excel (นับหัวคอลัมน์ด้วย)
 * โยน error ที่มี code ให้หน้าเว็บแปลข้อความเอง
 */
export function readImportWorkbook(XLSX, { name, data }) {
  const lowerName = String(name || "").toLowerCase();

  const isCsv = lowerName.endsWith(".csv");

  if (!isCsv && !lowerName.endsWith(".xlsx")) {
    throw createCodedError("INVALID_FILE_TYPE");
  }

  if (data.byteLength > MAX_SHEET_IMPORT_FILE_SIZE) {
    throw createCodedError("FILE_TOO_LARGE");
  }

  let workbook;

  try {
    workbook = isCsv
      ? /* CSV อ่านเป็นข้อความ UTF-8 เพื่อให้ภาษาไทยถูกต้อง และไม่แปลงชนิดข้อมูล */
        XLSX.read(stripBom(new TextDecoder("utf-8").decode(data)), {
          type: "string",
          raw: true,
        })
      : /* cellDates: ช่องที่ Excel จัดรูปแบบเป็นวันที่จะได้ชนิด "d" */
        XLSX.read(data, { type: "array", cellDates: true });
  } catch (error) {
    console.error("Read import workbook error:", error);

    throw createCodedError("READ_FAILED");
  }

  const sheets = [];

  const rows = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet?.["!ref"] || sheetName === TEMPLATE_GUIDE_SHEET) {
      return;
    }

    const range = XLSX.utils.decode_range(sheet["!ref"]);

    const cellAt = (r, c) => sheet[XLSX.utils.encode_cell({ r, c })];

    /* หัวคอลัมน์คือแถวแรกของชีต */
    const headers = [];

    for (let c = range.s.c; c <= range.e.c; c += 1) {
      headers.push(cleanText(cellAt(range.s.r, c)?.v) || "");
    }

    if (!headers.some(Boolean)) {
      return;
    }

    const columns = headers.map(
      (header, index) =>
        header || `(${XLSX.utils.encode_col(range.s.c + index)})`,
    );

    const mapping = mapHeaders(headers);

    const mappedColumns = new Set(Object.values(mapping));

    const unusedHeaders = headers.filter(
      (header, index) => header && !mappedColumns.has(index),
    );

    let rowCount = 0;

    for (let r = range.s.r + 1; r <= range.e.r; r += 1) {
      /* แถวที่ไม่มีค่าเลยสักช่อง (รวมคอลัมน์ที่ไม่ใช้) ไม่นับเป็นแถว */
      let hasAnyValue = false;

      for (let c = range.s.c; c <= range.e.c; c += 1) {
        if (cleanText(cellAt(r, c)?.v) !== null) {
          hasAnyValue = true;
          break;
        }
      }

      if (!hasAnyValue) {
        continue;
      }

      const raw = {};

      const original = {};

      columns.forEach((column, index) => {
        const cell = cellAt(r, range.s.c + index);

        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
          original[column] = cell.w ?? String(cell.v);
        }
      });

      let collectorNoDate = null;

      let collectorNoDateValue = null;

      Object.entries(mapping).forEach(([field, index]) => {
        const cell = cellAt(r, range.s.c + index);

        if (cell?.t === "d") {
          /* Excel แปลงค่าเป็นวันที่: ถือว่าไม่มีค่า เก็บข้อความเดิมไว้ทำรายงาน */
          if (field === "collector_no") {
            collectorNoDate = cell.w || formatDate(cell.v);
            collectorNoDateValue = formatDate(cell.v);
          }

          raw[field] = field === "collector_no" ? null : formatDate(cell.v);

          return;
        }

        raw[field] = cell?.v ?? null;
      });

      rows.push({
        sheet: sheetName,
        rowNumber: r + 1,
        raw,
        original,
        collectorNoDate,
        collectorNoDateValue,
      });

      rowCount += 1;

      if (rows.length > MAX_SHEET_IMPORT_ROWS) {
        throw createCodedError("TOO_MANY_ROWS");
      }
    }

    sheets.push({
      name: sheetName,
      rowCount,
      headers,
      columns,
      mapping: Object.fromEntries(
        Object.entries(mapping).map(([field, index]) => [field, headers[index]]),
      ),
      unusedHeaders,
    });
  });

  if (sheets.length === 0 || rows.length === 0) {
    throw createCodedError("EMPTY_FILE");
  }

  return { sheets, rows };
}

function normalizeHeader(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

/* คืน { field: columnIndex } เฉพาะฟิลด์ที่พบ ถ้าซ้ำใช้คอลัมน์แรก */
function mapHeaders(headers) {
  const normalized = headers.map(normalizeHeader);

  const mapping = {};

  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const keys = aliases.map(normalizeHeader);

    const index = normalized.findIndex((header) => keys.includes(header));

    if (index >= 0) {
      mapping[field] = index;
    }
  });

  return mapping;
}

/* =========================================================
   CLEAN
========================================================= */

/*
 * ทำความสะอาดทุกแถว คืน { ...row, values, pnuNo, warnings }
 * warnings: รหัสคำเตือน (ไม่ทำให้แถวถูกคัดออก)
 */
export function cleanImportRows(rows) {
  return rows.map((row) => {
    const values = {};

    SHEET_IMPORT_FIELDS.forEach((field) => {
      values[field] = cleanText(row.raw[field]);
    });

    const warnings = [];

    if (values.family && isAllUpperCase(values.family)) {
      values.family = toTitleCase(values.family);
    }

    if (values.artificial_group) {
      const group = values.artificial_group.toLowerCase();

      const mapped = ARTIFICIAL_GROUP_ALIASES[group] || group;

      if (ARTIFICIAL_GROUPS.includes(mapped)) {
        values.artificial_group = mapped;
      } else {
        warnings.push("artificialGroupUnknown");

        values.artificialGroupOriginal = values.artificial_group;
        values.artificial_group = null;
      }
    }

    if (row.collectorNoDate) {
      warnings.push("collectorNoDate");
    }

    ["latitude", "longitude"].forEach((field) => {
      if (values[field] === null) {
        return;
      }

      const number = parseCoordinate(values[field], field === "latitude" ? 90 : 180);

      if (number === null) {
        warnings.push(`${field}Invalid`);

        values[field] = null;
      } else {
        values[field] = number;
      }
    });

    return { ...row, values, pnuNo: parsePositiveInteger(values.pnu_no), warnings };
  });
}

/* ตัดช่องว่างซ้อนและหน้า/หลัง ค่าว่างเป็น null, ตัวเลขจำนวนเต็ม 5.0 → "5" */
export function cleanText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  const text = String(value).replace(/\s+/g, " ").trim();

  if (!text) {
    return null;
  }

  return /^[+-]?\d+\.0+$/.test(text) ? text.replace(/\.0+$/, "") : text;
}

function isAllUpperCase(text) {
  return /[A-Z]/.test(text) && text === text.toUpperCase();
}

/* ORCHIDACEAE → Orchidaceae, FABACEAE-PAPILIONOIDEAE → Fabaceae-Papilionoideae */
function toTitleCase(text) {
  return text
    .toLowerCase()
    .replace(/(^|[\s\-/(])([a-z])/g, (_, before, letter) => before + letter.toUpperCase());
}

export function parsePositiveInteger(value) {
  const text = String(value ?? "").trim();

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const number = Number(text);

  return Number.isSafeInteger(number) && number >= 1 ? number : null;
}

function parseCoordinate(value, limit) {
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(value)) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function formatDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10)
    : null;
}

/* =========================================================
   FILTER
========================================================= */

/*
 * คัดแถวตามข้อ a–d (ไม่ขึ้นกับช่องบังคับ)
 * คืน array ของแถวที่มี reason (null = ผ่าน a–d)
 * existingPnu: Set ของ pnu_no ที่มีในระบบ
 */
export function classifyImportRows(cleanedRows, existingPnu) {
  /*
   * PNU ซ้ำในไฟล์: นับจากทุกแถวที่มี PNU ถูกต้อง (รวมแถวว่าง)
   * แล้วคัดออกทุกแถวของเลขนั้น เพราะไม่รู้ว่าแถวไหนถูก
   */
  const counts = new Map();

  cleanedRows.forEach((row) => {
    if (row.pnuNo !== null) {
      counts.set(row.pnuNo, (counts.get(row.pnuNo) || 0) + 1);
    }
  });

  return cleanedRows.map((row) => {
    let reason = null;

    if (isBlankRow(row)) {
      reason = "blank";
    } else if (row.pnuNo === null) {
      reason = "pnuInvalid";
    } else if (counts.get(row.pnuNo) > 1) {
      reason = "pnuDuplicateInFile";
    } else if (existingPnu.has(row.pnuNo)) {
      reason = "pnuExists";
    }

    return { ...row, reason };
  });
}

/*
 * แถวว่าง: ไม่มีข้อมูลนอกจาก PNU
 * artificial_group อย่างเดียวไม่นับเป็นข้อมูล (ในไฟล์จริงเป็นหมายเหตุ เช่น "ลงทะเบียนแล้ว")
 * collector_no ที่เป็นวันที่ถือว่าไม่มีค่า แต่ยังนับว่าแถวมีข้อมูล
 */
function isBlankRow(row) {
  return (
    !row.collectorNoDate &&
    SHEET_IMPORT_FIELDS.every(
      (field) =>
        field === "pnu_no" ||
        field === "artificial_group" ||
        row.values[field] === null,
    )
  );
}

/*
 * คำเตือนของแถวตามช่องบังคับที่เลือก
 * กลุ่มพืชเป็นช่องบังคับ: ค่าที่ไม่อยู่ในรายการถูกล้างเป็น null แล้ว
 * จึงนับเป็น "ขาดกลุ่มพืช" (ข้อ e) แทนคำเตือน
 */
export function getRowWarnings(row, requiredFields) {
  return requiredFields.includes("artificial_group")
    ? row.warnings.filter((code) => code !== "artificialGroupUnknown")
    : row.warnings;
}

/* ข้อ e: คืนรายชื่อช่องบังคับที่แถวนี้ขาด */
export function getMissingFields(row, requiredFields) {
  return requiredFields.filter((field) => row.values[field] === null);
}

/* =========================================================
   HELPERS
========================================================= */

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function createCodedError(code) {
  const error = new Error(code);

  error.code = code;

  return error;
}
