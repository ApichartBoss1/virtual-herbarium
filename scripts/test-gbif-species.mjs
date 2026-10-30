/* =========================================================
   npm run test:gbif-species
   ยิง /api/gbif/species ของเซิร์ฟเวอร์ที่รันอยู่ (BASE_URL)
   แล้วพิมพ์ตารางสรุปและตรวจผลอัตโนมัติ (exit code 1 ถ้ามีข้อใด FAIL)

   BASE_URL=http://localhost:3000 npm run test:gbif-species
========================================================= */

import { formatPhotoCredit, getLicenseLabel } from "../lib/photoCredit.js";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

const NAMES = [
  "Samanea saman (Jacq.) Merr.",
  "Michelia alba DC.",
  "Zingiber sp.",
  "Hydrophila erecta",
  "asdfgh",
  "",
];

async function callApi(name) {
  const url = `${BASE_URL}/api/gbif/species?${new URLSearchParams({ name })}`;

  const started = performance.now();

  const response = await fetch(url);

  const body = await response.json().catch(() => null);

  return {
    name,
    status: response.status,
    cacheControl: response.headers.get("cache-control"),
    body,
    ms: Math.round(performance.now() - started),
  };
}

const results = new Map();

for (const name of NAMES) {
  try {
    results.set(name, await callApi(name));
  } catch (error) {
    console.error(`ERROR "${name}": ${error.message} (เซิร์ฟเวอร์ที่ ${BASE_URL} รันอยู่หรือไม่?)`);

    process.exit(1);
  }
}

/* เรียกซ้ำเพื่อดูผลของ cache */
const repeat = await callApi("Samanea saman (Jacq.) Merr.");

console.table(
  [...results.values()].map((r) => {
    const d = r.body?.data;

    return {
      ชื่อ: r.name || "(ว่าง)",
      status: r.status,
      ms: r.ms,
      data: d ? "มี" : "null",
      result: d?.result || "—",
      level: d?.level || "—",
      สถานะ: d?.status || "—",
      ชื่อที่ยอมรับ: d?.acceptedName || "—",
      วงศ์: d?.classification?.family || "—",
      "ชื่อไทย/อังกฤษ": d
        ? `${d.vernacularNames?.th?.length ?? "—"}/${d.vernacularNames?.en?.length ?? "—"}`
        : "—",
      "occ. โลก/ไทย": d ? `${d.occurrenceCount ?? "—"}/${d.occurrenceCountTH ?? "—"}` : "—",
      รูป: d?.photos?.length ?? "—",
    };
  }),
);

let failed = 0;

const report = (ok, label, detail = "") => {
  if (!ok) failed += 1;

  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
};

const samanea = results.get("Samanea saman (Jacq.) Merr.");
const samaneaData = samanea.body?.data;
const classification = samaneaData?.classification;

report(
  samanea.status === 200 && Boolean(samaneaData),
  '"Samanea saman (Jacq.) Merr." → data ไม่เป็น null',
  `status=${samanea.status}`,
);

report(
  Boolean(classification?.kingdom && classification?.family && classification?.species),
  '"Samanea saman" → มี classification',
  classification ? Object.values(classification).join(" > ") : "ไม่มี",
);

const photos = samaneaData?.photos || [];

report(
  Array.isArray(samaneaData?.photos) && photos.every((photo) => Boolean(photo.license)),
  '"Samanea saman" → รูปทุกรูปมี license',
  `${photos.length} รูป`,
);

report(
  photos.length > 0 &&
    photos.every(
      (photo) =>
        photo.thumbnailUrl &&
        !/\/original\.\w+(\?|$)/i.test(photo.thumbnailUrl) &&
        !("url" in photo),
    ),
  '"Samanea saman" → ทุกรูปมี thumbnailUrl ที่ไม่ใช่ไฟล์ original และไม่ส่ง URL ไฟล์เต็ม',
);

report(
  photos.every((photo) => /^https:\/\/www\.gbif\.org\/occurrence\/\d+$/.test(photo.occurrenceUrl)),
  '"Samanea saman" → ทุกรูปลิงก์ไปหน้า occurrence บน GBIF',
);

report(
  photos.every((photo) => photo.licenseLabel || photo.licenseUrl),
  '"Samanea saman" → ทุกรูปมีชื่อ license สั้นหรือ URL ของ license',
);

console.table(
  photos.map((photo) => ({
    ย่อจาก: photo.thumbnailSource,
    เครดิต: formatPhotoCredit(photo, "TH"),
    occurrence: photo.occurrenceUrl,
  })),
);

/* ขนาดไฟล์รูปย่อที่หน้าเว็บจะโหลดจริง (รวมทุกรูป) */
let thumbnailBytes = 0;
let thumbnailErrors = 0;

for (const photo of photos) {
  try {
    const response = await fetch(photo.thumbnailUrl, {
      headers: { "User-Agent": "virtual-herbarium (Naresuan University)" },
    });

    if (!response.ok || !String(response.headers.get("content-type")).startsWith("image/")) {
      thumbnailErrors += 1;
    }

    thumbnailBytes += (await response.arrayBuffer()).byteLength;
  } catch {
    thumbnailErrors += 1;
  }
}

report(
  thumbnailErrors === 0,
  `รูปย่อโหลดได้ทุกรูป รวม ${(thumbnailBytes / 1024).toFixed(0)} KB จาก ${photos.length} รูป`,
);

/* small ของ iNaturalist ด้านยาว 240 px ราว 15–50 KB ต่อรูป (ไฟล์ original รวมหลาย MB) */
const MAX_THUMBNAIL_TOTAL_KB = 400;

report(
  thumbnailBytes <= MAX_THUMBNAIL_TOTAL_KB * 1024,
  `รูปย่อรวมไม่เกิน ${MAX_THUMBNAIL_TOTAL_KB} KB`,
  `${(thumbnailBytes / 1024).toFixed(0)} KB`,
);

report(
  photos.every((photo) => String(photo.publisher || "").trim()),
  'ทุกรูปมีส่วน "ผ่าน ..." (publisher หรือ datasetName)',
);

const LICENSE_CASES = [
  ["http://creativecommons.org/licenses/by-nc/4.0/", "CC BY-NC 4.0"],
  ["https://creativecommons.org/licenses/by/4.0/legalcode", "CC BY 4.0"],
  ["http://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA 4.0"],
  ["https://creativecommons.org/licenses/by-nc-nd/3.0/", "CC BY-NC-ND 3.0"],
  ["http://creativecommons.org/publicdomain/zero/1.0/", "CC0"],
  ["CC_BY_NC_4_0", "CC BY-NC 4.0"],
  ["https://example.org/my-license", null],
  ["All rights reserved", null],
];

const wrongLicenses = LICENSE_CASES.filter(([input, expected]) => getLicenseLabel(input) !== expected)
  .map(([input, expected]) => `${input} → ${getLicenseLabel(input)} (ควรเป็น ${expected})`);

report(wrongLicenses.length === 0, "แปลง URL ของ license เป็นชื่อสั้น", wrongLicenses.join("; "));

const unknownCredit = formatPhotoCredit(
  { creator: "A", license: "https://example.org/my-license", publisher: "Herbarium X" },
  "TH",
);

report(
  unknownCredit === "© A · License · ผ่าน Herbarium X",
  'license ที่ไม่รู้จักแสดงเป็น "License"',
  unknownCredit,
);

report(
  samanea.cacheControl === "public, s-maxage=86400, stale-while-revalidate=604800",
  "Cache-Control ของ response ถูกต้อง",
  samanea.cacheControl || "ไม่มี",
);

const michelia = results.get("Michelia alba DC.")?.body?.data;

report(
  michelia?.status === "SYNONYM" && Boolean(michelia?.acceptedName),
  '"Michelia alba DC." → status เป็นชื่อพ้องและมี acceptedName',
  `status=${michelia?.status || "—"}, accepted=${michelia?.acceptedName || "—"}`,
);

const zingiber = results.get("Zingiber sp.")?.body?.data;

report(
  zingiber?.level === "genus",
  '"Zingiber sp." → level "genus"',
  `level=${zingiber?.level || "—"}`,
);

const hydrophila = results.get("Hydrophila erecta");

report(
  hydrophila.status === 200 && hydrophila.body?.ok === true && hydrophila.body?.data === null,
  '"Hydrophila erecta" → data เป็น null (สะกดผิด ไม่เดาชื่อ)',
  `status=${hydrophila.status}`,
);

const nonsense = results.get("asdfgh");

report(
  nonsense.status === 200 && nonsense.body?.ok === true && nonsense.body?.data === null,
  '"asdfgh" → data เป็น null และ status 200',
  `status=${nonsense.status}`,
);

const empty = results.get("");

report(empty.status === 400, "name ว่าง → 400", `status=${empty.status}`);

const tooLong = await callApi("a".repeat(201));

report(tooLong.status === 400, "name ยาว 201 ตัวอักษร → 400", `status=${tooLong.status}`);

console.log(
  `\nเวลา "Samanea saman": ครั้งแรก ${samanea.ms} ms, ครั้งที่สอง ${repeat.ms} ms`,
);

report(
  JSON.stringify(repeat.body) === JSON.stringify(samanea.body),
  "เรียกซ้ำได้ข้อมูลเดิม",
);

process.exit(failed ? 1 : 0);
