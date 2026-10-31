/* =========================================================
   GBIF CLIENT (browser)
   โหลดข้อมูลจาก /api/gbif/species และ /api/gbif/photo
   - ชื่อเดียวกันในหน้าเดียวกันยิงคำขอเดียว (เก็บ promise ไว้ใน Map)
   - หน้ารายละเอียด: GbifSpeciesPanel และรูปตัวอย่างใช้ผล species ร่วมกัน
   - รูปตัวอย่างของการ์ดโหลดพร้อมกันไม่เกิน 4 คำขอ
   - ผิดพลาด / timeout → null (ลบออกจาก Map ให้ลองใหม่ได้ครั้งหน้า)
========================================================= */

/*
 * มากกว่าเวลาที่ server ใช้เมื่อ GBIF ช้า (lib/gbifSpecies.js):
 * ตรวจชื่อ 8 วินาที + คำขอย่อยพร้อมกัน (ค้นรูปนานสุด 15 วินาที)
 * ระหว่างรอ component แสดง skeleton
 */
const REQUEST_TIMEOUT_MS = 30000;

export const PHOTO_CONCURRENCY = 4;

const speciesRequests = new Map();

const photoRequests = new Map();

const photoQueue = [];

let photosInFlight = 0;

function normalizeName(name) {
  return String(name ?? "").replace(/\s+/g, " ").trim();
}

async function getJsonData(path, name) {
  const response = await fetch(`${path}?${new URLSearchParams({ name })}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = await response.json();

  return body?.ok ? body.data || null : null;
}

function remember(map, name, task) {
  if (!map.has(name)) {
    map.set(
      name,
      task().catch(() => {
        map.delete(name);

        return null;
      }),
    );
  }

  return map.get(name);
}

/* ข้อมูลชนิดพืช (GbifSpeciesPanel) */
export function loadSpeciesInfo(botanicalName) {
  const name = normalizeName(botanicalName);

  if (!name) return Promise.resolve(null);

  return remember(speciesRequests, name, () =>
    getJsonData("/api/gbif/species", name),
  );
}

function runQueuedPhoto() {
  while (photosInFlight < PHOTO_CONCURRENCY && photoQueue.length > 0) {
    const { name, resolve, reject } = photoQueue.shift();

    photosInFlight += 1;

    getJsonData("/api/gbif/photo", name)
      .then(resolve, reject)
      .finally(() => {
        photosInFlight -= 1;

        runQueuedPhoto();
      });
  }
}

/* รูปตัวอย่างหนึ่งรูป (การ์ด) */
export function loadExamplePhoto(botanicalName) {
  const name = normalizeName(botanicalName);

  if (!name) return Promise.resolve(null);

  return remember(
    photoRequests,
    name,
    () =>
      new Promise((resolve, reject) => {
        photoQueue.push({ name, resolve, reject });

        runQueuedPhoto();
      }),
  );
}
