/* =========================================================
   npm run test:label-pdf
   สร้าง PDF ป้ายด้วย lib/labelPdf.js (โค้ดเดียวกับปุ่ม "ดาวน์โหลด PDF")
   จากข้อมูลทดสอบในไฟล์นี้ ไม่ใช้ฐานข้อมูลหรือ dev server
   แล้วตรวจอัตโนมัติ (exit code 1 ถ้ามีข้อใด FAIL)
   - ข้อความภาษาไทยที่ดึงจาก PDF ครบทุกคำ ไม่มีคำหาย
   - react-pdf เรียกตัววาด glyph ที่แก้บั๊กภาษาไทยแล้ว
     และวรรณยุกต์ถูกเลื่อนตามฟอนต์ (ไม้เอกของ "ป่า" ไม่ซ้อนกับหางตัว ป)
   - ป้าย 90 × 60 มม., QR ไม่เล็กกว่า 18 มม. และถอดรหัสได้ URL ถูกต้อง
   บันทึก PDF และภาพหน้าแรกไว้ให้ตรวจสระ/วรรณยุกต์ด้วยตา (พิมพ์ path ท้ายผล)
========================================================= */

import { mkdirSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

register("./label-pdf-loader.mjs", import.meta.url);

const SITE_URL = "https://virtual-herbarium.vercel.app";

process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;

const { OPS, getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
const { default: jsQR } = await import("jsqr");
const { default: PDFDocument } = await import("pdfkit");
const { createLabelPdf, renderGlyphs } = await import("../lib/labelPdf.js");
const { LABEL_HEIGHT_MM, LABEL_WIDTH_MM, getLabelContent } = await import(
  "../components/PrintLabel.jsx"
);

const PUBLIC_DIR = fileURLToPath(new URL("../public", import.meta.url));

const OUT_DIR = join(tmpdir(), "virtual-herbarium-label-pdf");

/* ความละเอียดที่ใช้วัดและถอดรหัส QR */
const DPI = 300;

const MM_PER_PX = 25.4 / DPI;

/* ยอมให้คลาดได้ (มม.) จากขอบภาพที่ถูก antialias */
const SIZE_TOLERANCE_MM = 0.3;

const MIN_QR_MM = 18;

/* ขนาดตัวอักษร locality ปกติบนป้าย (pt) */
const LOCALITY_PT = 7.5;

const plant = (id, fields) => ({
  id,
  pnu_no: null,
  botanical_name: "Polyalthia debilis (Pierre) Finet & Gagnep.",
  family: "Annonaceae",
  locality: null,
  latitude: 16.74512,
  longitude: 100.19234,
  elevation: 220,
  collected_by: null,
  collector_no: null,
  ...fields,
});

/* ข้อความไทยที่มีสระบน สระล่าง วรรณยุกต์ซ้อน ตัวอักษรหางยาว และ ำ */
const PLANTS = [
  plant("00000000-0000-4000-8000-000000003001", {
    pnu_no: 3001,
    locality: "อุทยานแห่งชาติน้ำหนาว ที่ทำการเขื่อนสิรินธร",
    collected_by: "ผู้ใหญ่บ้าน",
    collector_no: "12",
  }),
  plant("00000000-0000-4000-8000-000000003002", {
    pnu_no: 3002,
    family: "วงศ์กระดังงา",
    locality: "ป่าเต็งรังริมฝั่งน้ำ ปั้นจั่นบ้านกี่ปี่ ถ้ำฤๅษี",
    elevation: "ประมาณ 300 ม.",
  }),
  plant("00000000-0000-4000-8000-000000003003", {
    pnu_no: 3003,
    botanical_name: "Dendrobium chrysotoxum Lindl.",
    family: "Orchidaceae",
    locality: "หมู่บ้านญูญุ ทุ่งฐูฐุ จังหวัดพิษณุโลก",
    collected_by: "ทีมสำรวจหอพรรณไม้",
  }),
];

const WORDS = [
  "น้ำ",
  "ที่",
  "เขื่อน",
  "ผู้",
  "ป่า",
  "ฝั่ง",
  "ปั้นจั่น",
  "กี่ปี่",
  "ฤๅษี",
  "ญู",
  "ญุ",
  "ฐู",
  "ฐุ",
];

let failed = 0;

const report = (ok, label, detail = "") => {
  if (!ok) failed += 1;

  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
};

mkdirSync(OUT_DIR, { recursive: true });

/* =========================================================
   1. สร้าง PDF ด้วยโค้ดของหน้าเว็บ (8 ป้ายต่อหน้า, ภาษาไทย)
========================================================= */

const pdfBytes = await createPdf({ plants: PLANTS, layout: "eight" });

const pdfPath = join(OUT_DIR, "labels.pdf");

writeFileSync(pdfPath, pdfBytes);

report(
  PDFDocument.prototype.glyphs === renderGlyphs,
  "ติดตั้งตัววาด glyph ที่แก้บั๊กภาษาไทยของ react-pdf แล้ว",
);

const pdfDocument = await getDocument({
  data: new Uint8Array(pdfBytes),
  verbosity: 0,
}).promise;

const page = await pdfDocument.getPage(1);

/* =========================================================
   2. ข้อความครบทุกคำ
   ตัดช่องว่างทิ้ง (รวมช่องว่างที่ใช้เป็นจุดตัดคำ) และรวม ำ ที่ถูกแยกกลับ
========================================================= */

const { items } = await page.getTextContent();

const pageText = normalizeThai(items.map((item) => item.str).join(""));

const expectedTexts = [
  ...WORDS,
  ...PLANTS.flatMap((item) => [item.locality, item.collected_by, item.family]),
  "สถานที่เก็บ:",
  "ผู้เก็บ:",
  "ความสูง:",
  "พิกัด:",
].filter(Boolean);

const missing = expectedTexts.filter(
  (expected) => !pageText.includes(normalizeThai(expected)),
);

report(
  missing.length === 0,
  `ข้อความไทยใน PDF ครบ ${expectedTexts.length} รายการ`,
  missing.length ? `หาย: ${missing.join(", ")}` : "",
);

/* =========================================================
   3. ขนาดป้ายและ QR (วัดจากภาพที่ render ด้วย pdf.js)
========================================================= */

const image = await renderPage(page, DPI);

const imagePath = join(OUT_DIR, "page1.png");

writeFileSync(imagePath, await image.canvas.encode("png"));

const labels = findLabels(image);

report(
  labels.length === PLANTS.length,
  `พบป้าย ${PLANTS.length} ใบในหน้าแรก`,
  `พบ ${labels.length}`,
);

labels.forEach((label, index) => {
  const widthMm = label.width * MM_PER_PX;
  const heightMm = label.height * MM_PER_PX;

  report(
    Math.abs(widthMm - LABEL_WIDTH_MM) <= SIZE_TOLERANCE_MM &&
      Math.abs(heightMm - LABEL_HEIGHT_MM) <= SIZE_TOLERANCE_MM,
    `ป้าย ${index + 1} ขนาด ${LABEL_WIDTH_MM} × ${LABEL_HEIGHT_MM} มม.`,
    `วัดได้ ${widthMm.toFixed(2)} × ${heightMm.toFixed(2)} มม.`,
  );

  const qr = readQr(image, label);

  const expectedUrl = `${SITE_URL}/plants/${PLANTS[index]?.id}`;

  report(
    qr?.data === expectedUrl,
    `ป้าย ${index + 1} QR ถอดรหัสได้ URL ถูกต้อง`,
    qr ? qr.data : "ถอดรหัสไม่ได้",
  );

  report(
    Boolean(qr) && qr.sizeMm >= MIN_QR_MM,
    `ป้าย ${index + 1} QR ส่วนสีดำไม่เล็กกว่า ${MIN_QR_MM} มม.`,
    qr ? `วัดได้ ${qr.sizeMm.toFixed(2)} มม.` : "",
  );
});

/* =========================================================
   4. ตำแหน่งวรรณยุกต์ (GPOS ของฟอนต์)
   ตัววาดที่แก้แล้วเลื่อนวรรณยุกต์ไปทางซ้ายตามฟอนต์ (ไม้เอกบน ป ≈ 0.16 em,
   บน น ≈ 0.08 em) ตัววาดเดิมของ react-pdf 4.9.0 เลื่อนแทบเป็นศูนย์
   ไม้เอกของ "ป่า" จึงซ้อนกับหางตัว ป จนมองไม่เห็น
   วัดจากคำสั่งย้ายตำแหน่งข้อความ (Tm) ก่อนวรรณยุกต์ เทียบกับตำแหน่งปากกาหลังวรรณยุกต์
========================================================= */

/* นับการเรียกตัววาดที่ lib/labelPdf.js ติดตั้งไว้ (ถ้าไม่ได้ติดตั้ง จะไม่นับ) */
const installedGlyphs = PDFDocument.prototype.glyphs;

let glyphCalls = 0;

if (installedGlyphs) {
  PDFDocument.prototype.glyphs = function countGlyphs(...args) {
    glyphCalls += 1;

    return installedGlyphs.apply(this, args);
  };
}

const toneOffsets = await measureToneOffsets("ป่า น่า");

PDFDocument.prototype.glyphs = installedGlyphs;

report(glyphCalls > 0, "react-pdf เรียกตัววาด glyph ที่แก้แล้ว", `${glyphCalls} ครั้ง`);

for (const [base, minEm] of [
  ["ป", 0.1],
  ["น", 0.05],
]) {
  const offset = toneOffsets[base];

  report(
    offset !== undefined && -offset / LOCALITY_PT >= minEm,
    `ไม้เอกบน ${base} เลื่อนไปทางซ้ายตามฟอนต์ (อย่างน้อย ${minEm} em)`,
    offset === undefined ? "ไม่พบ" : `${offset.toFixed(3)} pt`,
  );
}

/* =========================================================
   5. พิกัดโดยประมาณ (coordinate_source = geocoded)
   ป้ายพิมพ์พิกัดและความสูงรูปแบบเดียวกับพิกัดที่ admin ใส่เอง (manual)
   ไม่มี ca. รัศมีความคลาดเคลื่อน หรือคำว่าโดยประมาณ
========================================================= */

const GEOCODED_LOCALITY = "อุทยานแห่งชาติแก่งเจ็ดแคว จังหวัดพิษณุโลก";

const manualPlant = plant("00000000-0000-4000-8000-000000004001", {
  pnu_no: 4001,
  locality: GEOCODED_LOCALITY,
  coordinate_source: "manual",
});

const geocodedPlant = plant("00000000-0000-4000-8000-000000004002", {
  pnu_no: 4002,
  locality: GEOCODED_LOCALITY,
  latitude: 16.987654,
  longitude: 100.456789,
  elevation: "345 m",
  coordinate_source: "geocoded",
  coordinate_uncertainty_m: 6200,
});

async function labelText(item) {
  const bytes = await createPdf({ plants: [item], layout: "one" });

  const document = await getDocument({ data: new Uint8Array(bytes), verbosity: 0 })
    .promise;

  const content = await (await document.getPage(1)).getTextContent();

  return normalizeThai(content.items.map((part) => part.str).join(""));
}

const manualText = await labelText(manualPlant);

const geocodedText = await labelText(geocodedPlant);

report(
  manualText.includes("พิกัด:") && manualText.includes("ความสูง:"),
  "ป้ายพิกัด manual ยังพิมพ์พิกัดและความสูง",
);

/* ข้อความที่ดึงจาก PDF ไม่มีช่องว่าง จึงเทียบแบบไม่สนช่องว่าง */
const compact = (text) => text.replace(/\s+/g, "");

/* รูปแบบเดียวกับ manual: ทศนิยม 5 ตำแหน่ง N/E และความสูงตามที่บันทึก */
const GEOCODED_COORDINATES = compact("พิกัด: 16.98765° N, 100.45679° E");

const GEOCODED_ELEVATION = compact("ความสูง: 345 m");

report(
  compact(geocodedText).includes(GEOCODED_COORDINATES) &&
    compact(geocodedText).includes(GEOCODED_ELEVATION),
  "ป้ายพิกัด geocoded พิมพ์พิกัดและความสูงรูปแบบเดียวกับ manual ใน PDF",
  compact(geocodedText).match(/พิกัด:[^ก-๙]*|ความสูง:\d+m/g)?.join(" | ") || "ไม่พบ",
);

report(
  !/ca\.|±|ประมาณ|approx/i.test(geocodedText),
  "ป้ายพิกัด geocoded ไม่มี ca. / ± / คำว่าโดยประมาณ",
);

report(
  geocodedText.includes(normalizeThai(GEOCODED_LOCALITY)),
  "ป้ายพิกัด geocoded ยังพิมพ์สถานที่เก็บ",
);

const screenLines = getLabelContent(geocodedPlant, "TH").lines;

const manualLines = getLabelContent(
  { ...geocodedPlant, coordinate_source: "manual", coordinate_uncertainty_m: null },
  "TH",
).lines;

report(
  JSON.stringify(screenLines) === JSON.stringify(manualLines) &&
    screenLines.some((line) => line.key === "coordinates") &&
    screenLines.some((line) => line.key === "elevation"),
  "ป้ายบนหน้าจอของรายการ geocoded เหมือน manual ทุกบรรทัด (มีพิกัดและความสูง)",
  screenLines.map((line) => `${line.key}=${line.value}`).join(", "),
);

const emptyLines = getLabelContent(
  { ...geocodedPlant, latitude: null, longitude: null, elevation: null },
  "TH",
).lines.map((line) => line.key);

report(
  !emptyLines.includes("coordinates") && !emptyLines.includes("elevation"),
  "ฟิลด์พิกัดและความสูงที่ว่างยังซ่อนทั้งบรรทัด",
  emptyLines.join(", "),
);

console.log(`\nPDF: ${pdfPath}`);
console.log(`ภาพหน้าแรก (ตรวจสระ/วรรณยุกต์ด้วยตา): ${imagePath}`);

process.exit(failed ? 1 : 0);

/* =========================================================
   HELPERS
========================================================= */

async function createPdf({ plants, layout }) {
  const blob = await createLabelPdf({
    plants,
    layout,
    language: "TH",
    fontBase: PUBLIC_DIR,
  });

  return Buffer.from(await blob.arrayBuffer());
}

/* ช่องว่างทุกแบบออก และ ำ ที่ PDF เก็บเป็น ํ/ำ + า (อาจสลับกับวรรณยุกต์) → ำ */
function normalizeThai(value) {
  return value
    .replace(/\s+/g, "")
    .replace(/([่-๋])[ำํ]า/g, "$1ำ")
    .replace(/[ำํ]([่-๋]?)า/g, "$1ำ");
}

async function renderPage(pdfPage, dpi) {
  const viewport = pdfPage.getViewport({ scale: dpi / 72 });

  const width = Math.ceil(viewport.width);
  const height = Math.ceil(viewport.height);

  const { canvas, context } = pdfDocument.canvasFactory.create(width, height);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;

  const { data } = context.getImageData(0, 0, width, height);

  return { canvas, data, width, height };
}

function isDark(image, x, y) {
  const index = (y * image.width + x) * 4;

  return image.data[index] + image.data[index + 1] + image.data[index + 2] < 384;
}

/* ช่วงที่มีพิกเซลเข้ม ช่องว่างสั้นกว่า maxGap ถือเป็นช่วงเดียวกัน
   (เส้นประรอบป้ายมีช่องว่างเล็กๆ, ระหว่างป้ายห่างกัน 5 มม.) */
function darkRanges(counts, maxGap) {
  const ranges = [];

  let start = -1;
  let lastDark = -1;

  counts.forEach((count, index) => {
    if (!count) return;

    if (start >= 0 && index - lastDark > maxGap) {
      ranges.push([start, lastDark]);
      start = -1;
    }

    if (start < 0) start = index;

    lastDark = index;
  });

  if (start >= 0) ranges.push([start, lastDark]);

  return ranges;
}

/* กรอบนอกของเส้นประแต่ละป้าย เรียงตามแถวแล้วคอลัมน์ */
function findLabels(img) {
  const maxGap = Math.round(2 / MM_PER_PX);

  const columnCounts = Array.from({ length: img.width }, (_, x) => {
    let count = 0;

    for (let y = 0; y < img.height; y += 1) if (isDark(img, x, y)) count += 1;

    return count;
  });

  const found = [];

  for (const [left, right] of darkRanges(columnCounts, maxGap)) {
    const rowCounts = Array.from({ length: img.height }, (_, y) => {
      let count = 0;

      for (let x = left; x <= right; x += 1) if (isDark(img, x, y)) count += 1;

      return count;
    });

    for (const [top, bottom] of darkRanges(rowCounts, maxGap)) {
      found.push({
        x: left,
        y: top,
        width: right - left + 1,
        height: bottom - top + 1,
      });
    }
  }

  return found.sort((a, b) => a.y - b.y || a.x - b.x);
}

function readQr(img, label) {
  const data = new Uint8ClampedArray(label.width * label.height * 4);

  for (let row = 0; row < label.height; row += 1) {
    const start = ((label.y + row) * img.width + label.x) * 4;

    data.set(img.data.subarray(start, start + label.width * 4), row * label.width * 4);
  }

  const code = jsQR(data, label.width, label.height, {
    inversionAttempts: "dontInvert",
  });

  if (!code) return null;

  /* มุมจาก jsQR เป็นค่าประมาณ วัดกรอบพิกเซลดำจริงรอบบริเวณนั้น
     (ขยายไม่เกิน 0.5 มม. ไม่ให้ถึงตัวเลข PNU ที่อยู่ใต้ QR 0.8 มม.) */
  const corners = Object.values(code.location).filter((point) => "x" in point);
  const margin = Math.round(0.5 / MM_PER_PX);

  const box = {
    left: Math.max(0, Math.floor(Math.min(...corners.map((p) => p.x))) - margin),
    right: Math.min(label.width - 1, Math.ceil(Math.max(...corners.map((p) => p.x))) + margin),
    top: Math.max(0, Math.floor(Math.min(...corners.map((p) => p.y))) - margin),
    bottom: Math.min(label.height - 1, Math.ceil(Math.max(...corners.map((p) => p.y))) + margin),
  };

  const dark = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };

  for (let y = box.top; y <= box.bottom; y += 1) {
    for (let x = box.left; x <= box.right; x += 1) {
      if (!isDark(img, label.x + x, label.y + y)) continue;

      dark.left = Math.min(dark.left, x);
      dark.right = Math.max(dark.right, x);
      dark.top = Math.min(dark.top, y);
      dark.bottom = Math.max(dark.bottom, y);
    }
  }

  const sizePx = Math.min(dark.right - dark.left + 1, dark.bottom - dark.top + 1);

  return { data: code.data, sizeMm: sizePx * MM_PER_PX };
}

/* ระยะ (pt) ที่ไม้เอกถูกเลื่อนจากตำแหน่งปากกา แยกตามพยัญชนะที่อยู่หน้า */
async function measureToneOffsets(locality) {
  const bytes = await createPdf({
    plants: [plant("00000000-0000-4000-8000-000000000001", { locality })],
    layout: "one",
  });

  const probe = await getDocument({ data: new Uint8Array(bytes), verbosity: 0 })
    .promise;

  const operators = await (await probe.getPage(1)).getOperatorList();

  /* ข้อความแต่ละชิ้นกับตำแหน่ง x ของคำสั่ง Tm ที่อยู่ก่อนหน้า */
  const runs = [];

  let x = 0;

  operators.fnArray.forEach((fn, index) => {
    const args = operators.argsArray[index];

    if (fn === OPS.setTextMatrix) x = args[4] ?? args[0]?.[4];

    if (fn === OPS.showText) {
      runs.push({ x, text: args[0].map((glyph) => glyph?.unicode ?? "").join("") });
    }
  });

  const offsets = {};

  runs.forEach((run, index) => {
    const mark = runs[index + 1];
    const after = runs[index + 2];

    if (mark?.text === "\u0E48" && after) {
      offsets[run.text.slice(-1)] = mark.x - after.x;
    }
  });

  return offsets;
}
