/* =========================================================
   npm run test:gbif-species
   ยิง /api/gbif/species และ /api/gbif/photo ของเซิร์ฟเวอร์ที่รันอยู่ (BASE_URL)
   แล้วพิมพ์ตารางสรุปและตรวจผลอัตโนมัติ (exit code 1 ถ้ามีข้อใด FAIL)

   - ก่อนตรวจ เรียกทุกชื่อหนึ่งรอบเพื่ออุ่น cache (รอได้นานสุด 60 วินาทีต่อชื่อ)
   - ข้อที่ไม่ผ่านเพราะ route รายงานว่า GBIF ไม่ตอบ (unavailable มี "name" หรือส่วนที่ข้อนั้นใช้)
     เป็น SKIP ไม่ใช่ FAIL และไม่ทำให้ exit code เป็น 1

   BASE_URL=http://localhost:3000 npm run test:gbif-species
========================================================= */

import { formatPhotoCredit, getLicenseLabel } from "../lib/photoCredit.js";

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

/* เวลารอสูงสุดต่อคำขอ (route ช้าสุดราว 40 วินาทีเมื่อ GBIF timeout ทุกส่วน) */
const REQUEST_TIMEOUT_MS = 60000;

const WARMUP_TIMEOUT_MS = 60000;

const FULL_CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

const FAILURE_CACHE_CONTROL = "public, s-maxage=900";

const IMAGE_TIMEOUT_MS = 30000;

const testStarted = performance.now();

const NAMES = [
  "Samanea saman (Jacq.) Merr.",
  "Michelia alba DC.",
  "Zingiber sp.",
  "Hydrophila erecta",
  "asdfgh",
  "",
];

async function callApi(name, route = "species", signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)) {
  const url = `${BASE_URL}/api/gbif/${route}?${new URLSearchParams({ name })}`;

  const started = performance.now();

  const response = await fetch(url, { signal });

  const body = await response.json().catch(() => null);

  return {
    name,
    status: response.status,
    cacheControl: response.headers.get("cache-control"),
    body,
    ms: Math.round(performance.now() - started),
  };
}

/* ส่วนที่ route รายงานว่าล้มเพราะ GBIF ("name" = ตรวจชื่อไม่ได้ ทุกส่วนจึงไม่มี) */
const gbifDown = (result, ...parts) => {
  const unavailable = result?.body?.unavailable || [];

  const down = unavailable.filter((part) => part === "name" || parts.includes(part));

  return down.length ? down : null;
};

/* =========================================================
   อุ่น cache: species ก่อน แล้ว photo (ใช้ผลค้นรูปที่ cache แล้วจาก species)
========================================================= */

console.log("อุ่น cache (ไม่นับผล)");

const warmupStarted = performance.now();

const warmup = [];

for (const name of NAMES.filter(Boolean)) {
  const signal = AbortSignal.timeout(WARMUP_TIMEOUT_MS);

  const started = performance.now();

  const row = { ชื่อ: name, ms: 0, "species ไม่ตอบ": "—", "photo ไม่ตอบ": "—" };

  try {
    const species = await callApi(name, "species", signal);

    row["species ไม่ตอบ"] = species.body?.unavailable?.join(", ") || "—";

    const photo = await callApi(name, "photo", signal);

    row["photo ไม่ตอบ"] = photo.body?.unavailable?.join(", ") || "—";
  } catch (error) {
    if (error?.name !== "TimeoutError") {
      console.error(`ERROR "${name}": ${error.message} (เซิร์ฟเวอร์ที่ ${BASE_URL} รันอยู่หรือไม่?)`);

      process.exit(1);
    }

    row["species ไม่ตอบ"] = `timeout ${WARMUP_TIMEOUT_MS / 1000} วินาที`;
  }

  row.ms = Math.round(performance.now() - started);

  warmup.push(row);
}

console.table(warmup);

const warmupMs = Math.round(performance.now() - warmupStarted);

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
      "GBIF ไม่ตอบ": r.body?.unavailable?.join(", ") || "—",
    };
  }),
);

let passed = 0;
let failed = 0;
let skipped = 0;

/* skip: ส่วนที่ GBIF ไม่ตอบ (จาก gbifDown) ข้อที่ไม่ผ่านและมี skip → SKIP */
const report = (ok, label, detail = "", skip = null) => {
  if (ok) {
    passed += 1;

    console.log(`PASS ${label}${detail ? ` (${detail})` : ""}`);

    return;
  }

  if (skip) {
    skipped += 1;

    console.log(`SKIP (GBIF ไม่ตอบ: ${skip.join(", ")}) ${label}`);

    return;
  }

  failed += 1;

  console.log(`FAIL ${label}${detail ? ` (${detail})` : ""}`);
};

const expectedCacheControl = (result) =>
  result.body?.unavailable?.length ? FAILURE_CACHE_CONTROL : FULL_CACHE_CONTROL;

const samanea = results.get("Samanea saman (Jacq.) Merr.");
const samaneaData = samanea.body?.data;
const classification = samaneaData?.classification;

report(
  samanea.status === 200 && Boolean(samaneaData),
  '"Samanea saman (Jacq.) Merr." → data ไม่เป็น null',
  `status=${samanea.status}`,
  gbifDown(samanea),
);

report(
  Boolean(classification?.kingdom && classification?.family && classification?.species),
  '"Samanea saman" → มี classification',
  classification ? Object.values(classification).join(" > ") : "ไม่มี",
  gbifDown(samanea, "classification"),
);

const photos = samaneaData?.photos || [];

report(
  Array.isArray(samaneaData?.photos) && photos.every((photo) => Boolean(photo.license)),
  '"Samanea saman" → รูปทุกรูปมี license',
  `${photos.length} รูป`,
  gbifDown(samanea, "photos"),
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
  "",
  gbifDown(samanea, "photos"),
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
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
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
  samanea.cacheControl === expectedCacheControl(samanea),
  "Cache-Control ของ response ถูกต้อง (ผลครบ 1 วัน / GBIF ไม่ตอบ 15 นาที)",
  samanea.cacheControl || "ไม่มี",
);

const micheliaResult = results.get("Michelia alba DC.");
const michelia = micheliaResult?.body?.data;

report(
  michelia?.status === "SYNONYM" && Boolean(michelia?.acceptedName),
  '"Michelia alba DC." → status เป็นชื่อพ้องและมี acceptedName',
  `status=${michelia?.status || "—"}, accepted=${michelia?.acceptedName || "—"}`,
  gbifDown(micheliaResult),
);

const zingiberResult = results.get("Zingiber sp.");
const zingiber = zingiberResult?.body?.data;

report(
  zingiber?.level === "genus",
  '"Zingiber sp." → level "genus"',
  `level=${zingiber?.level || "—"}`,
  gbifDown(zingiberResult),
);

/* data null เพราะตรวจชื่อไม่ได้ ไม่นับว่าผ่าน */
const hydrophila = results.get("Hydrophila erecta");

report(
  hydrophila.status === 200 && hydrophila.body?.ok === true && hydrophila.body?.data === null &&
    !gbifDown(hydrophila),
  '"Hydrophila erecta" → data เป็น null (สะกดผิด ไม่เดาชื่อ)',
  `status=${hydrophila.status}`,
  gbifDown(hydrophila),
);

const nonsense = results.get("asdfgh");

report(
  nonsense.status === 200 && nonsense.body?.ok === true && nonsense.body?.data === null &&
    !gbifDown(nonsense),
  '"asdfgh" → data เป็น null และ status 200',
  `status=${nonsense.status}`,
  gbifDown(nonsense),
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
  "",
  gbifDown(samanea) || gbifDown(repeat),
);

/* =========================================================
   /api/gbif/photo (รูปตัวอย่างหนึ่งรูปสำหรับรายการที่ไม่มีรูป)
========================================================= */

console.log("\n/api/gbif/photo");

const PHOTO_FIELDS = [
  "thumbnailUrl",
  "largeUrl",
  "creator",
  "licenseLabel",
  "licenseUrl",
  "publisher",
  "occurrenceUrl",
  "level",
];

const photoOk = await callApi("Samanea saman (Jacq.) Merr.", "photo");
const example = photoOk.body?.data;

console.table(
  example
    ? [{ ms: photoOk.ms, level: example.level, เครดิต: formatPhotoCredit(example, "TH"), occurrence: example.occurrenceUrl }]
    : [],
);

report(
  photoOk.status === 200 && Boolean(example),
  '/api/gbif/photo "Samanea saman" → ได้รูป',
  `status=${photoOk.status}, ${photoOk.ms} ms`,
  gbifDown(photoOk, "photos"),
);

report(
  Boolean(example) &&
    Object.keys(example).sort().join() === [...PHOTO_FIELDS].sort().join(),
  "/api/gbif/photo คืนเฉพาะฟิลด์ของรูป",
  example ? Object.keys(example).join(", ") : "ไม่มี",
  gbifDown(photoOk, "photos"),
);

report(
  Boolean(example?.licenseLabel || example?.licenseUrl),
  "/api/gbif/photo รูปมี license",
  example?.licenseLabel || example?.licenseUrl || "ไม่มี",
  gbifDown(photoOk, "photos"),
);

report(
  Boolean(example?.thumbnailUrl && example?.largeUrl) &&
    ![example.thumbnailUrl, example.largeUrl].some((url) => /\/original\.\w+(\?|$)/i.test(url)),
  "/api/gbif/photo รูปย่อและรูปใหญ่ไม่ใช่ไฟล์ original",
  "",
  gbifDown(photoOk, "photos"),
);

report(
  /^https:\/\/www\.gbif\.org\/occurrence\/\d+$/.test(example?.occurrenceUrl || ""),
  "/api/gbif/photo ลิงก์ไปหน้า occurrence บน GBIF",
  "",
  gbifDown(photoOk, "photos"),
);

report(
  JSON.stringify(samaneaData?.examplePhoto) === JSON.stringify(example),
  "examplePhoto ใน /api/gbif/species เป็นรูปเดียวกับ /api/gbif/photo",
  "",
  gbifDown(samanea, "photos") || gbifDown(photoOk, "photos"),
);

for (const url of [example?.thumbnailUrl, example?.largeUrl].filter(Boolean)) {
  let ok = false;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "virtual-herbarium (Naresuan University)" },
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });

    ok = response.ok && String(response.headers.get("content-type")).startsWith("image/");

    await response.arrayBuffer();
  } catch {
    ok = false;
  }

  report(ok, `/api/gbif/photo รูปโหลดได้ (${url === example.largeUrl ? "largeUrl" : "thumbnailUrl"})`);
}

report(
  photoOk.cacheControl === expectedCacheControl(photoOk),
  "/api/gbif/photo Cache-Control ถูกต้อง (ผลครบ 1 วัน / GBIF ไม่ตอบ 15 นาที)",
  photoOk.cacheControl || "ไม่มี",
);

/* data null ได้เมื่อสกุลนี้ไม่มีรูปที่มี license แต่ไม่นับกรณีที่ GBIF ไม่ตอบ */
const photoGenus = await callApi("Zingiber sp.", "photo");

report(
  photoGenus.body?.data?.level === "genus" ||
    (photoGenus.body?.data === null && !gbifDown(photoGenus, "photos")),
  '/api/gbif/photo "Zingiber sp." → level "genus"',
  `level=${photoGenus.body?.data?.level || "—"}`,
  gbifDown(photoGenus, "photos"),
);

const photoMisspelled = await callApi("Hydrophila erecta", "photo");

report(
  photoMisspelled.status === 200 && photoMisspelled.body?.ok === true &&
    photoMisspelled.body?.data === null && !gbifDown(photoMisspelled),
  '/api/gbif/photo "Hydrophila erecta" → data เป็น null (สะกดผิด)',
  `status=${photoMisspelled.status}`,
  gbifDown(photoMisspelled),
);

const photoNonsense = await callApi("asdfgh", "photo");

report(
  photoNonsense.status === 200 && photoNonsense.body?.data === null && !gbifDown(photoNonsense),
  '/api/gbif/photo "asdfgh" → data เป็น null',
  `status=${photoNonsense.status}`,
  gbifDown(photoNonsense),
);

const photoEmpty = await callApi("", "photo");

report(photoEmpty.status === 400, "/api/gbif/photo name ว่าง → 400", `status=${photoEmpty.status}`);

const photoTooLong = await callApi("a".repeat(201), "photo");

report(photoTooLong.status === 400, "/api/gbif/photo name ยาว 201 ตัวอักษร → 400", `status=${photoTooLong.status}`);

const photoRepeat = await callApi("Samanea saman (Jacq.) Merr.", "photo");

console.log(
  `เวลา /api/gbif/photo "Samanea saman": ครั้งแรก ${photoOk.ms} ms, ครั้งที่สอง ${photoRepeat.ms} ms`,
);

report(
  JSON.stringify(photoRepeat.body) === JSON.stringify(photoOk.body),
  "/api/gbif/photo เรียกซ้ำได้ข้อมูลเดิม",
  "",
  gbifDown(photoOk) || gbifDown(photoRepeat),
);

console.log(
  `\nสรุป: ผ่าน ${passed} / ไม่ผ่าน ${failed} / ข้ามเพราะ GBIF ไม่ตอบ ${skipped}` +
    ` (อุ่น cache ${(warmupMs / 1000).toFixed(1)} วินาที,` +
    ` รวม ${((performance.now() - testStarted) / 1000).toFixed(1)} วินาที)`,
);

process.exit(failed ? 1 : 0);
