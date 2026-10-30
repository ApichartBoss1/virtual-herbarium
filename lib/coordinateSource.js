/* =========================================================
   COORDINATE SOURCE (แนว Darwin Core)
   - manual   = admin ใส่เองหรือยืนยันแล้ว
   - geocoded = ประมาณจากชื่อสถานที่ มี coordinate_uncertainty_m
   คอลัมน์สร้างจาก supabase/sql/03_coordinate_source.sql
========================================================= */

export const COORDINATE_SOURCE = {
  manual: "manual",
  geocoded: "geocoded",
};

export const COORDINATE_SQL_FILE = "supabase/sql/03_coordinate_source.sql";

function sameCoordinate(a, b) {
  return a !== null && b !== null && Math.abs(a - b) < 1e-9;
}

/*
 * ค่าที่ต้องบันทึกตอน admin บันทึกฟอร์ม
 * - ไม่มีพิกัด → ทั้งสองคอลัมน์เป็น null
 * - พิกัดใหม่หรือเปลี่ยนพิกัด → manual, uncertainty null
 * - รายการ geocoded ที่พิกัดไม่เปลี่ยน → คืน {} (ไม่แตะสองคอลัมน์นี้)
 * original: { latitude, longitude, coordinate_source } ของรายการเดิม (หน้าเพิ่มใช้ null)
 */
export function getCoordinateSourceFields(latitude, longitude, original = null) {
  if (latitude === null || longitude === null) {
    return { coordinate_source: null, coordinate_uncertainty_m: null };
  }

  const unchanged =
    original &&
    sameCoordinate(latitude, original.latitude) &&
    sameCoordinate(longitude, original.longitude);

  if (unchanged && original.coordinate_source === COORDINATE_SOURCE.geocoded) {
    return {};
  }

  return {
    coordinate_source: COORDINATE_SOURCE.manual,
    coordinate_uncertainty_m: null,
  };
}

/*
 * error จาก insert/update เมื่อยังไม่ได้รันไฟล์ 03
 * PostgREST: PGRST204 "Could not find the 'coordinate_source' column ..."
 * Postgres: 42703 column "coordinate_source" ... does not exist
 */
export function isMissingCoordinateColumnError(error) {
  if (!error) {
    return false;
  }

  const text = `${error.message || ""} ${error.details || ""}`;

  return (
    (error.code === "PGRST204" || error.code === "42703") &&
    /coordinate_(source|uncertainty_m)/.test(text)
  );
}

export function isGeocoded(plant) {
  return plant?.coordinate_source === COORDINATE_SOURCE.geocoded;
}

/*
 * คอลัมน์ที่มาของพิกัดสำหรับต่อท้าย select
 * ก่อนรันไฟล์ 03 คอลัมน์ยังไม่มี → คืน "" เพื่อให้หน้า public และป้ายยังใช้งานได้
 * ตรวจครั้งเดียวต่อการโหลดหน้า (ถ้าเครือข่ายผิดพลาดจะตรวจใหม่ครั้งหน้า)
 */
let coordinateColumnsAvailable = null;

export async function coordinateColumnsFor(client) {
  if (coordinateColumnsAvailable === null) {
    const { error } = await client
      .from("plants")
      .select("coordinate_source, coordinate_uncertainty_m")
      .limit(1);

    if (!error) {
      coordinateColumnsAvailable = true;
    } else if (isMissingCoordinateColumnError(error)) {
      coordinateColumnsAvailable = false;
    } else {
      return "";
    }
  }

  return coordinateColumnsAvailable
    ? ", coordinate_source, coordinate_uncertainty_m"
    : "";
}
