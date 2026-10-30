import { supabase } from "@/lib/supabase";

/* =========================================================
   MAP QUERIES
   จุดพรรณไม้ทั้งหมดที่มีพิกัด สำหรับหน้า /map (อ่านด้วย anon key)
========================================================= */

/* คอลัมน์ที่หมุดและ popup ใช้เท่านั้น */
export const MAP_POINT_COLUMNS =
  "id, pnu_no, botanical_name, family, latitude, longitude";

const FETCH_PAGE_SIZE = 1000;

function toCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/* พิกัดผิดช่วง หรือ 0,0 (มักเป็นค่าที่กรอกผิด) ไม่แสดงบนแผนที่ */
function isValidPoint(latitude, longitude) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/* จำนวนรายการทั้งหมดในระบบ (count แบบ head ไม่ดึงแถว) */
async function fetchTotalCount() {
  const { count, error } = await supabase
    .from("plants")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

async function fetchRowsWithCoordinates() {
  const rows = [];

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("plants")
      .select(MAP_POINT_COLUMNS)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("plant_id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    rows.push(...(data || []));

    if (!data || data.length < FETCH_PAGE_SIZE) {
      return rows;
    }
  }
}

/*
 * คืนค่า { points, total, invalidCount }
 * points: [{ id, pnu_no, botanical_name, family, latitude, longitude }] (พิกัดเป็นตัวเลข)
 * invalidCount: จำนวนแถวที่มีพิกัดแต่ผิดช่วงหรือเป็น 0,0 จึงถูกกรองทิ้ง
 */
export async function fetchMapPoints() {
  const [rows, total] = await Promise.all([
    fetchRowsWithCoordinates(),
    fetchTotalCount(),
  ]);

  const points = [];

  let invalidCount = 0;

  for (const row of rows) {
    const latitude = toCoordinate(row.latitude);
    const longitude = toCoordinate(row.longitude);

    if (!isValidPoint(latitude, longitude)) {
      invalidCount += 1;
      continue;
    }

    points.push({ ...row, latitude, longitude });
  }

  return { points, total, invalidCount };
}
