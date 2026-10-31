/* =========================================================
   BULK DELETE (หน้า /account/plants)
   ลบพรรณไม้ที่เลือกไว้ทีละหลายรายการ
   - ลบข้อมูลทีละชุด 100 id แล้วจึงลบรูปใน Storage ของรายการที่ลบสำเร็จในชุดนั้น
     (ไม่ลบรูปก่อนลบข้อมูลสำเร็จ รูปของชุดที่ error จึงไม่ถูกแตะ)
   - ชุดที่ error บันทึกไว้แล้วทำชุดถัดไป
   - ลบรูปไม่สำเร็จ บันทึกไว้ในสรุป ไม่ถือว่าการลบข้อมูลล้มเหลว
   - ไฟล์สำรองก่อนลบ: ทุกคอลัมน์ หัวคอลัมน์ของช่องที่นำเข้าได้ตรงกับเทมเพลต
     จึงอัปกลับเข้าหน้านำเข้าได้ (คอลัมน์อื่นหน้านำเข้าจะข้ามไป)
========================================================= */

import { supabase } from "@/lib/supabase";
import { chunkArray } from "@/lib/plantImport";
import { getPlantImageStoragePath } from "@/lib/plantImage";
import { appendTableSheet } from "@/lib/plantImportReport";
import { SHEET_IMPORT_FIELDS, TEMPLATE_HEADERS } from "@/lib/plantImportSheets";

export const DELETE_BATCH_SIZE = 100;

/* path ต่อหนึ่งคำขอลบไฟล์ใน Storage */
const STORAGE_REMOVE_CHUNK = 100;

/* id ต่อหนึ่งคำขออ่าน (กัน URL ยาวเกิน) */
const FETCH_ID_CHUNK = 100;

/* ลบเกินจำนวนนี้ต้องพิมพ์จำนวนยืนยัน */
export const TYPED_CONFIRM_THRESHOLD = 20;

const IMAGE_BUCKET = "plant-images";

/* ชีตข้อมูลชื่อเดียวกับเทมเพลตนำเข้า */
const BACKUP_SHEET = "plants";

/* คอลัมน์ที่ระบบสร้างเอง ไม่ใส่ในไฟล์สำรอง */
const SKIPPED_BACKUP_COLUMNS = new Set(["search_text"]);

/* =========================================================
   FETCH
========================================================= */

/* ทุกคอลัมน์ของรายการที่เลือก เรียงตาม PNU (ไม่มี PNU ไว้ท้าย) */
export async function fetchPlantsForDelete(ids) {
  const rows = [];

  for (const chunk of chunkArray([...new Set(ids)], FETCH_ID_CHUNK)) {
    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .in("id", chunk);

    if (error) {
      throw error;
    }

    rows.push(...(data || []));
  }

  return rows.sort(
    (a, b) =>
      (a.pnu_no ?? Number.POSITIVE_INFINITY) -
        (b.pnu_no ?? Number.POSITIVE_INFINITY) ||
      String(a.id).localeCompare(String(b.id)),
  );
}

export function countPlantsWithStoredImage(plants) {
  return plants.filter((plant) => getPlantImageStoragePath(plant.image_url)).length;
}

/* =========================================================
   DELETE
========================================================= */

/*
 * plants: แถวจาก fetchPlantsForDelete
 * onProgress({ batch, totalBatches, deleted, failed })
 * shouldStop(): เช็กก่อนเริ่มแต่ละชุด (ไม่ตัดกลางชุด)
 * คืน {
 *   deletedIds, deleted, failed, failedBatches: [{ batch, count, message }],
 *   imagesDeleted, imageErrors: [{ batch, count, message }], stopped, remaining
 * }
 */
export async function deletePlantsInBatches({
  plants,
  onProgress = () => {},
  shouldStop = () => false,
}) {
  const batches = chunkArray(plants, DELETE_BATCH_SIZE);

  const summary = {
    deletedIds: [],
    deleted: 0,
    failed: 0,
    failedBatches: [],
    imagesDeleted: 0,
    imageErrors: [],
    stopped: false,
    remaining: 0,
  };

  for (let index = 0; index < batches.length; index += 1) {
    if (shouldStop()) {
      summary.stopped = true;
      summary.remaining = batches
        .slice(index)
        .reduce((total, batch) => total + batch.length, 0);
      break;
    }

    const batch = batches[index];

    const batchNumber = index + 1;

    onProgress({
      batch: batchNumber,
      totalBatches: batches.length,
      deleted: summary.deleted,
      failed: summary.failed,
    });

    let deletedIds = [];

    try {
      const { data, error } = await supabase
        .from("plants")
        .delete()
        .in(
          "id",
          batch.map((plant) => plant.id),
        )
        .select("id");

      if (error) {
        throw error;
      }

      deletedIds = (data || []).map((row) => row.id);
    } catch (err) {
      console.error("Bulk delete batch error:", err);

      summary.failed += batch.length;

      summary.failedBatches.push({
        batch: batchNumber,
        count: batch.length,
        message: err?.message || String(err),
      });

      continue;
    }

    /* RLS อาจไม่ลบบางแถวโดยไม่คืน error: นับแถวที่ไม่ถูกคืนว่าล้มเหลว */
    const deletedSet = new Set(deletedIds);

    const notDeleted = batch.length - deletedSet.size;

    if (notDeleted > 0) {
      summary.failed += notDeleted;

      summary.failedBatches.push({
        batch: batchNumber,
        count: notDeleted,
        message: "not deleted (no permission or already removed)",
      });
    }

    summary.deleted += deletedSet.size;

    summary.deletedIds.push(...deletedSet);

    /* รูปของรายการที่ลบสำเร็จในชุดนี้เท่านั้น */
    const paths = batch
      .filter((plant) => deletedSet.has(plant.id))
      .map((plant) => getPlantImageStoragePath(plant.image_url))
      .filter(Boolean);

    for (const pathChunk of chunkArray(paths, STORAGE_REMOVE_CHUNK)) {
      try {
        const { error } = await supabase.storage
          .from(IMAGE_BUCKET)
          .remove(pathChunk);

        if (error) {
          throw error;
        }

        summary.imagesDeleted += pathChunk.length;
      } catch (err) {
        console.error("Bulk delete image error:", err);

        summary.imageErrors.push({
          batch: batchNumber,
          count: pathChunk.length,
          message: err?.message || String(err),
        });
      }
    }
  }

  onProgress({
    batch: batches.length,
    totalBatches: batches.length,
    deleted: summary.deleted,
    failed: summary.failed,
  });

  return summary;
}

/* =========================================================
   BACKUP EXPORT
========================================================= */

function backupCell(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") return JSON.stringify(value);

  return value;
}

/*
 * ชีต "plants": ช่องที่นำเข้าได้ใช้หัวคอลัมน์ของเทมเพลต (PNU no., Family, ...)
 * ตามด้วยคอลัมน์อื่นทั้งหมดของตาราง (id, image_url, created_at, ...) ด้วยชื่อคอลัมน์จริง
 */
export function buildDeleteBackupWorkbook(XLSX, plants) {
  const otherColumns = [
    ...new Set(plants.flatMap((plant) => Object.keys(plant))),
  ].filter(
    (column) =>
      !SHEET_IMPORT_FIELDS.includes(column) && !SKIPPED_BACKUP_COLUMNS.has(column),
  );

  const rows = [
    [
      ...SHEET_IMPORT_FIELDS.map((field) => TEMPLATE_HEADERS[field]),
      ...otherColumns,
    ],
    ...plants.map((plant) => [
      ...SHEET_IMPORT_FIELDS.map((field) => backupCell(plant[field])),
      ...otherColumns.map((column) => backupCell(plant[column])),
    ]),
  ];

  const workbook = XLSX.utils.book_new();

  appendTableSheet(XLSX, workbook, BACKUP_SHEET, rows);

  /* collector_no เป็นข้อความ กัน Excel แปลงเป็นวันที่/ตัวเลข */
  const sheet = workbook.Sheets[BACKUP_SHEET];

  const column = SHEET_IMPORT_FIELDS.indexOf("collector_no");

  for (let r = 1; r < rows.length; r += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: column })];

    if (cell && cell.v !== "") {
      cell.t = "s";
      cell.v = String(cell.v);
      cell.z = "@";
    }
  }

  return workbook;
}

/* deleted-backup_2026-10-31_1430.xlsx (เวลาเครื่องผู้ใช้) */
export function getDeleteBackupFileName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return `deleted-backup_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}${pad(date.getMinutes())}.xlsx`;
}
