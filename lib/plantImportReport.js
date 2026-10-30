/* =========================================================
   PLANT IMPORT: รายงาน Excel และเทมเพลต
   ใช้ในหน้า /account/plants/import
   - สร้าง workbook ด้วย SheetJS ที่ส่งเข้ามา (ไม่แตะ DOM จึงทดสอบใน Node ได้)
   - รายงานเป็นภาษาไทยสำหรับเจ้าหน้าที่ตรวจแถวที่ถูกคัดออก
   - SheetJS รุ่นฟรีเขียน freeze pane ไม่ได้ จึงแก้ XML ของชีตหลังเขียนไฟล์
========================================================= */

import {
  ARTIFICIAL_GROUPS,
  REQUIRED_FIELD_OPTIONS,
  SHEET_IMPORT_FIELDS,
  SKIP_REASONS,
  TEMPLATE_GUIDE_SHEET,
  TEMPLATE_HEADERS,
} from "@/lib/plantImportSheets";

const REPORT_TEXT = {
  sheets: {
    summary: "สรุป",
    skipped: "คัดออก",
    duplicates: "PNU ซ้ำ",
    warnings: "คำเตือน",
    importResults: "ผลการนำเข้า",
  },

  fieldLabels: {
    pnu_no: "เลข PNU",
    artificial_group: "กลุ่มพืช",
    family: "วงศ์",
    botanical_name: "ชื่อวิทยาศาสตร์",
    collected_by: "ผู้เก็บ",
    collector_no: "เลขผู้เก็บ",
    locality: "สถานที่เก็บ",
    latitude: "ละติจูด",
    longitude: "ลองจิจูด",
    elevation: "ความสูง",
  },

  cardLabels: {
    blank: "a) แถวว่าง",
    pnuInvalid: "b) PNU ไม่ถูกต้อง",
    pnuDuplicateInFile: "c) PNU ซ้ำในไฟล์",
    pnuExists: "d) PNU มีในระบบแล้ว",
    incomplete: "e) ข้อมูลไม่ครบ",
  },

  reasons: {
    blank: "แถวว่าง: ไม่มีข้อมูลนอกจากเลข PNU",
    pnuInvalid: "เลข PNU ไม่ถูกต้อง (ต้องเป็นจำนวนเต็มบวก)",
    pnuDuplicateInFile: "เลข PNU ซ้ำกันในไฟล์ (ดูชีต \"PNU ซ้ำ\")",
    pnuExists: "เลข PNU นี้มีอยู่ในระบบแล้ว",
    incomplete: "ข้อมูลไม่ครบตามช่องบังคับ",
  },

  /* ใช้ในคอลัมน์สถานะของชีต "PNU ซ้ำ" และ "คำเตือน" */
  shortReasons: {
    blank: "แถวว่าง",
    pnuInvalid: "PNU ไม่ถูกต้อง",
    pnuDuplicateInFile: "PNU ซ้ำในไฟล์",
    pnuExists: "PNU มีในระบบแล้ว",
    incomplete: "ข้อมูลไม่ครบ",
  },

  warnings: {
    artificialGroupUnknown: "กลุ่มพืชไม่อยู่ในรายการที่ยอมรับ",
    collectorNoDate: "เลขผู้เก็บถูก Excel แปลงเป็นวันที่",
    latitudeInvalid: "ละติจูดไม่ถูกต้อง",
    longitudeInvalid: "ลองจิจูดไม่ถูกต้อง",
  },

  warningActions: {
    artificialGroupUnknown: "ล้างเป็นค่าว่าง",
    collectorNoDate: "ถือว่าไม่มีเลขผู้เก็บ",
    latitudeInvalid: "ล้างเป็นค่าว่าง",
    longitudeInvalid: "ล้างเป็นค่าว่าง",
  },

  summary: {
    item: "รายการ",
    value: "ค่า",
    sourceFile: "ไฟล์ต้นฉบับ",
    checkedAt: "วันเวลาที่ตรวจ",
    requiredFields: "ช่องบังคับที่เลือก",
    noRequired: "ไม่มี",
    sheetsRead: "ชีตที่อ่าน",
    sheetRows: (name, count) => `${name} (${count.toLocaleString("en-US")} แถว)`,
    totalRows: "แถวทั้งหมด",
    readyRows: "พร้อมนำเข้า",
    duplicateNumbers: "PNU ซ้ำในไฟล์ (จำนวนเลข)",
    warnings: "คำเตือน (ไม่คัดออก)",
    note: "หมายเหตุ",
    noteText:
      "แถวหนึ่งถูกคัดออกด้วยเหตุผลแรกที่พบตามลำดับ a–e • รายงานนี้ยังไม่ได้บันทึกข้อมูลใดลงระบบ",
  },

  columns: {
    sheet: "ชีตเดิม",
    row: "แถวเดิม",
    pnu: "PNU",
    reason: "เหตุผล",
    missing: "ช่องที่ขาด",
    group: "กลุ่มที่",
    rowsInGroup: "จำนวนแถวของเลขนี้",
    status: "สถานะในการตรวจ",
    warning: "คำเตือน",
    originalValue: "ค่าเดิมในไฟล์",
    dateValue: "วันที่ที่ Excel อ่านได้",
    action: "สิ่งที่ระบบทำ",
    botanicalName: "ชื่อวิทยาศาสตร์",
  },

  statusReady: "พร้อมนำเข้า",

  importStatuses: {
    success: "นำเข้าสำเร็จ",
    duplicate: "ข้าม: PNU ถูกเพิ่มในระบบระหว่างนำเข้า",
    failed: "ล้มเหลว",
    notImported: "ไม่ได้นำเข้า (หยุดก่อนถึงชุดนี้)",
  },

  importSummary: {
    title: "ผลการนำเข้า",
    finishedAt: "วันเวลาที่นำเข้าเสร็จ",
    requiredFields: "ช่องบังคับที่ใช้ตอนนำเข้า",
    stopped: "หยุดก่อนครบทุกชุด",
    yes: "ใช่",
    no: "ไม่",
    elapsed: "เวลาที่ใช้ (วินาที)",
    columns: {
      pnu: "PNU",
      sheet: "ชีตเดิม",
      row: "แถวเดิม",
      status: "สถานะ",
      error: "ข้อความ error",
    },
  },
  statusSkipped: (reason) => `คัดออก: ${reason}`,
};

/* =========================================================
   REPORT
========================================================= */

/*
 * input: {
 *   fileName, checkedAt (Date), requiredFields,
 *   sheets: ผลจาก readImportWorkbook,
 *   rows: ทุกแถวหลังคัด a–e (มี reason และ missing)
 *   importResult (ไม่บังคับ): ผลจาก importPlantRows
 *     { results, stopped, elapsedMs, finishedAt, requiredFields }
 *     มีค่าเมื่อนำเข้าแล้ว จะเพิ่มชีต "ผลการนำเข้า" และสรุปท้ายชีต "สรุป"
 * }
 */
export function buildImportReportWorkbook(XLSX, input) {
  const { fileName, checkedAt, requiredFields, sheets, rows, importResult } =
    input;

  const text = REPORT_TEXT;

  const sheetOrder = new Map(sheets.map((sheet, index) => [sheet.name, index]));

  /* คอลัมน์เดิมจากทุกชีต เรียงตามที่พบครั้งแรก */
  const originalColumns = [...new Set(sheets.flatMap((sheet) => sheet.columns))];

  const originalValues = (row) =>
    originalColumns.map((column) => row.original?.[column] ?? "");

  const byPosition = (a, b) =>
    sheetOrder.get(a.sheet) - sheetOrder.get(b.sheet) || a.rowNumber - b.rowNumber;

  const byPnu = (a, b) =>
    (a.pnuNo ?? Number.POSITIVE_INFINITY) - (b.pnuNo ?? Number.POSITIVE_INFINITY);

  const pnuText = (row) => row.pnuNo ?? row.original?.[findPnuColumn(sheets, row.sheet)] ?? "";

  const reasonText = (reason) => text.reasons[reason] || reason;

  const statusText = (row) =>
    row.reason === null
      ? text.statusReady
      : text.statusSkipped(text.shortReasons[row.reason] || row.reason);

  const fieldList = (fields) =>
    fields.map((field) => text.fieldLabels[field]).join(", ");

  const skipped = rows.filter((row) => row.reason !== null);

  const ready = rows.length - skipped.length;

  const reasonCounts = Object.fromEntries(
    SKIP_REASONS.map((reason) => [
      reason,
      skipped.filter((row) => row.reason === reason).length,
    ]),
  );

  /* กลุ่ม PNU ซ้ำ: ทุกแถวของเลขที่ถูกคัดออกเพราะซ้ำ (รวมแถวว่างของเลขเดียวกัน) */
  const duplicateSet = new Set(
    skipped
      .filter((row) => row.reason === "pnuDuplicateInFile")
      .map((row) => row.pnuNo),
  );

  const duplicateRows = rows
    .filter((row) => row.pnuNo !== null && duplicateSet.has(row.pnuNo))
    .sort((a, b) => byPnu(a, b) || byPosition(a, b));

  /* คำเตือน: แถวละหนึ่งบรรทัดต่อคำเตือน ไม่นับแถวว่าง (ตรงกับการ์ดในหน้าเว็บ) */
  const warningLines = rows
    .filter((row) => row.reason !== "blank")
    .sort(byPosition)
    .flatMap((row) => row.warnings.map((code) => ({ row, code })));

  /* ---------- สรุป ---------- */

  const summaryRows = [
    [text.summary.item, text.summary.value],
    [text.summary.sourceFile, fileName],
    [text.summary.checkedAt, formatDateTime(checkedAt)],
    [
      text.summary.requiredFields,
      requiredFields.length ? fieldList(requiredFields) : text.summary.noRequired,
    ],
    [
      text.summary.sheetsRead,
      sheets.map((sheet) => text.summary.sheetRows(sheet.name, sheet.rowCount)).join(", "),
    ],
    [],
    [text.summary.totalRows, rows.length],
    [text.summary.readyRows, ready],
    ...SKIP_REASONS.map((reason) => [text.cardLabels[reason], reasonCounts[reason]]),
    [text.summary.duplicateNumbers, duplicateSet.size],
    [text.summary.warnings, warningLines.length],
    [],
    [text.summary.note, text.summary.noteText],
  ];

  if (importResult) {
    const result = text.importSummary;

    const count = (status) =>
      importResult.results.filter((item) => item.status === status).length;

    summaryRows.push(
      [],
      [result.title, ""],
      [result.finishedAt, formatDateTime(importResult.finishedAt)],
      [
        result.requiredFields,
        importResult.requiredFields.length
          ? fieldList(importResult.requiredFields)
          : text.summary.noRequired,
      ],
      ...Object.keys(text.importStatuses).map((status) => [
        text.importStatuses[status],
        count(status),
      ]),
      [result.stopped, importResult.stopped ? result.yes : result.no],
      [result.elapsed, Number((importResult.elapsedMs / 1000).toFixed(1))],
    );
  }

  /* ---------- คัดออก ---------- */

  const skippedRows = [
    [
      text.columns.sheet,
      text.columns.row,
      text.columns.pnu,
      text.columns.reason,
      text.columns.missing,
      ...originalColumns,
    ],
    ...[...skipped]
      .sort(
        (a, b) =>
          SKIP_REASONS.indexOf(a.reason) - SKIP_REASONS.indexOf(b.reason) ||
          byPnu(a, b) ||
          byPosition(a, b),
      )
      .map((row) => [
        row.sheet,
        row.rowNumber,
        pnuText(row),
        reasonText(row.reason),
        row.missing?.length ? fieldList(row.missing) : "",
        ...originalValues(row),
      ]),
  ];

  /* ---------- PNU ซ้ำ ---------- */

  const groupNumbers = new Map(
    [...duplicateSet].sort((a, b) => a - b).map((pnu, index) => [pnu, index + 1]),
  );

  const groupSizes = new Map();

  duplicateRows.forEach((row) =>
    groupSizes.set(row.pnuNo, (groupSizes.get(row.pnuNo) || 0) + 1),
  );

  const duplicateSheetRows = [
    [
      text.columns.pnu,
      text.columns.group,
      text.columns.rowsInGroup,
      text.columns.sheet,
      text.columns.row,
      text.columns.status,
      ...originalColumns,
    ],
    ...duplicateRows.map((row) => [
      row.pnuNo,
      groupNumbers.get(row.pnuNo),
      groupSizes.get(row.pnuNo),
      row.sheet,
      row.rowNumber,
      statusText(row),
      ...originalValues(row),
    ]),
  ];

  /* ---------- คำเตือน ---------- */

  const warningSheetRows = [
    [
      text.columns.sheet,
      text.columns.row,
      text.columns.pnu,
      text.columns.warning,
      text.columns.originalValue,
      text.columns.dateValue,
      text.columns.action,
      text.columns.status,
      text.columns.botanicalName,
    ],
    ...warningLines.map(({ row, code }) => [
      row.sheet,
      row.rowNumber,
      pnuText(row),
      text.warnings[code] || code,
      warningOriginalValue(row, code),
      code === "collectorNoDate" ? row.collectorNoDateValue || "" : "",
      text.warningActions[code] || "",
      statusText(row),
      row.values.botanical_name ?? "",
    ]),
  ];

  const workbook = XLSX.utils.book_new();

  appendTableSheet(XLSX, workbook, text.sheets.summary, summaryRows);
  appendTableSheet(XLSX, workbook, text.sheets.skipped, skippedRows);
  appendTableSheet(XLSX, workbook, text.sheets.duplicates, duplicateSheetRows);
  appendTableSheet(XLSX, workbook, text.sheets.warnings, warningSheetRows);

  if (importResult) {
    const columns = text.importSummary.columns;

    appendTableSheet(XLSX, workbook, text.sheets.importResults, [
      [columns.pnu, columns.sheet, columns.row, columns.status, columns.error],
      ...importResult.results.map(({ row, status, message }) => [
        row.pnuNo,
        row.sheet,
        row.rowNumber,
        text.importStatuses[status] || status,
        message,
      ]),
    ]);
  }

  return workbook;
}

function warningOriginalValue(row, code) {
  if (code === "artificialGroupUnknown") {
    return row.values.artificialGroupOriginal ?? "";
  }

  if (code === "collectorNoDate") {
    return row.collectorNoDate ?? "";
  }

  const field = code === "latitudeInvalid" ? "latitude" : "longitude";

  return row.raw?.[field] ?? "";
}

function findPnuColumn(sheets, sheetName) {
  return sheets.find((sheet) => sheet.name === sheetName)?.mapping.pnu_no;
}

/* import-report_<ชื่อไฟล์เดิมเฉพาะ A-Z a-z 0-9 - _>_<YYYY-MM-DD>.xlsx */
export function getImportReportFileName(sourceName, date = new Date()) {
  const base =
    String(sourceName || "")
      .replace(/\.[^.]*$/, "")
      .replace(/[^A-Za-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "file";

  return `import-report_${base}_${formatDate(date)}.xlsx`;
}

/* =========================================================
   TEMPLATE
========================================================= */

const TEMPLATE_DATA_SHEET = "plants";

const TEMPLATE_SAMPLE_ROWS = [
  {
    pnu_no: 12345,
    artificial_group: "angiosperm",
    family: "Dipterocarpaceae",
    botanical_name: "Shorea roxburghii G.Don",
    collected_by: "A. Collector",
    collector_no: "AC-001",
    locality: "Naresuan University, Phitsanulok",
    latitude: 16.7484,
    longitude: 100.1923,
    elevation: "800–900 m",
  },
  {
    pnu_no: 12346,
    artificial_group: "pteridophyte",
    family: "Polypodiaceae",
    botanical_name: "Drynaria quercifolia (L.) J.Sm.",
    collected_by: "B. Collector",
    collector_no: "125",
    locality: "Thung Salaeng Luang National Park, Phitsanulok",
    latitude: null,
    longitude: null,
    elevation: null,
  },
];

const TEMPLATE_GUIDE = {
  header: ["คอลัมน์", "ฟิลด์ในระบบ", "บังคับ (ค่าเริ่มต้น)", "รูปแบบค่า"],
  required: "บังคับเสมอ",
  requiredByDefault: "บังคับ (เอาออกได้ในหน้านำเข้า)",
  optional: "ไม่บังคับ",
  formats: {
    pnu_no: "จำนวนเต็มบวก ห้ามซ้ำกันในไฟล์และห้ามซ้ำกับที่มีในระบบ",
    artificial_group: `ค่าที่ยอมรับ: ${ARTIFICIAL_GROUPS.join(", ")} • "fern" จะถูกแปลงเป็น pteridophyte • ค่าอื่น (เช่น "ลงทะเบียนแล้ว" หรือตัวเลข) ถือว่าไม่มีค่า: เป็นช่องบังคับตามค่าเริ่มต้น แถวที่ไม่มีค่าหรือค่าไม่ถูกต้องจะถูกคัดออกเพราะข้อมูลไม่ครบ ถ้าเอาออกจากช่องบังคับในหน้านำเข้า ค่าที่ไม่ถูกต้องจะถูกล้างเป็นค่าว่างและแจ้งเป็นคำเตือน`,
    family: "ชื่อวงศ์ เช่น Orchidaceae (ถ้าพิมพ์ใหญ่ทั้งหมดจะแปลงเป็น Orchidaceae ให้)",
    botanical_name: "ชื่อวิทยาศาสตร์พร้อมผู้ตั้งชื่อ",
    collected_by: "ชื่อผู้เก็บตัวอย่าง",
    collector_no: "ข้อความหรือตัวเลข • ถ้า Excel แปลงเป็นวันที่ (เช่น 12/3) ระบบจะถือว่าไม่มีค่า ควรจัดรูปแบบคอลัมน์เป็นข้อความก่อนพิมพ์",
    locality: "สถานที่เก็บ เช่น อุทยานแห่งชาติ อำเภอ จังหวัด",
    latitude: "ทศนิยม −90 ถึง 90 (ไม่ใส่ได้)",
    longitude: "ทศนิยม −180 ถึง 180 (ไม่ใส่ได้)",
    elevation: "ข้อความ เช่น 850 m หรือ 800–900 m (ไม่ใส่ได้)",
  },
  notes: [
    "แถวแรกของชีตข้อมูลต้องเป็นหัวคอลัมน์ ชื่อหัวไม่สนตัวพิมพ์ใหญ่-เล็กและช่องว่าง",
    "อ่านได้หลายชีตในไฟล์เดียว (ยกเว้นชีตคำอธิบายนี้) ทุกชีตต้องมีคอลัมน์ PNU no.",
    "คอลัมน์อื่นนอกจากในตารางนี้ (เช่น Note) จะไม่ถูกนำเข้า",
    "รูปภาพไม่นำเข้าจากไฟล์นี้ ให้ใช้แท็บ \"นำเข้ารูปตามหมายเลข PNU\"",
  ],
};

export function buildImportTemplateWorkbook(XLSX) {
  const guide = TEMPLATE_GUIDE;

  const dataRows = [
    SHEET_IMPORT_FIELDS.map((field) => TEMPLATE_HEADERS[field]),
    ...TEMPLATE_SAMPLE_ROWS.map((sample) =>
      SHEET_IMPORT_FIELDS.map((field) => sample[field] ?? ""),
    ),
  ];

  const guideRows = [
    guide.header,
    ...SHEET_IMPORT_FIELDS.map((field) => [
      TEMPLATE_HEADERS[field],
      field,
      field === "pnu_no"
        ? guide.required
        : REQUIRED_FIELD_OPTIONS.includes(field)
          ? guide.requiredByDefault
          : guide.optional,
      guide.formats[field],
    ]),
    [],
    ...guide.notes.map((note) => [`• ${note}`]),
  ];

  const workbook = XLSX.utils.book_new();

  appendTableSheet(XLSX, workbook, TEMPLATE_DATA_SHEET, dataRows);
  appendTableSheet(XLSX, workbook, TEMPLATE_GUIDE_SHEET, guideRows, { maxWidth: 90 });

  /* collector_no เป็นข้อความ กัน Excel แปลงเป็นวันที่เมื่อพิมพ์เพิ่ม */
  const sheet = workbook.Sheets[TEMPLATE_DATA_SHEET];

  const column = SHEET_IMPORT_FIELDS.indexOf("collector_no");

  for (let r = 1; r < dataRows.length; r += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: column })];

    if (cell) {
      cell.t = "s";
      cell.v = String(cell.v);
      cell.z = "@";
    }
  }

  return workbook;
}

/* =========================================================
   WRITE
========================================================= */

/* ปรับความกว้างคอลัมน์ตามข้อความที่ยาวที่สุด */
export function appendTableSheet(XLSX, workbook, name, rows, { maxWidth = 60 } = {}) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);

  const columnCount = Math.max(...rows.map((row) => row.length));

  sheet["!cols"] = Array.from({ length: columnCount }, (_, index) => {
    const longest = rows.reduce(
      (max, row) => Math.max(max, displayWidth(row[index])),
      0,
    );

    return { wch: Math.min(maxWidth, Math.max(8, longest + 2)) };
  });

  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

/* สระบน/ล่างและวรรณยุกต์ไทยไม่กินความกว้าง */
function displayWidth(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return String(value).replace(/[ัิ-ฺ็-๎]/g, "").length;
}

/* เขียน .xlsx เป็น Uint8Array และตรึงแถวหัวตารางทุกชีต */
export function writeWorkbookWithFrozenHeader(XLSX, workbook) {
  const bytes = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
    compression: true,
  });

  const zip = XLSX.CFB.read(new Uint8Array(bytes), { type: "array" });

  const frozenView =
    '<sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView>';

  zip.FileIndex.forEach((entry, index) => {
    /* FullPaths ขึ้นต้นด้วยชื่อ root เช่น "Root Entry/xl/worksheets/sheet1.xml" */
    const filePath = zip.FullPaths[index].replace(/^[^/]*\//, "");

    if (!/^xl\/worksheets\/sheet\d+\.xml$/.test(filePath)) {
      return;
    }

    const xml = new TextDecoder("utf-8").decode(entry.content);

    entry.content = new TextEncoder().encode(
      xml.replace(/<sheetView workbookViewId="0"\/>/, frozenView),
    );
  });

  return new Uint8Array(
    XLSX.CFB.write(zip, { fileType: "zip", type: "array", compression: true }),
  );
}

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateTime(date) {
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  return `${formatDate(date)} ${time}`;
}
