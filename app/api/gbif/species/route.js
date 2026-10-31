import { FAILURE_CACHE_SECONDS, getSpeciesInfo } from "@/lib/gbifSpecies";

/* =========================================================
   GET /api/gbif/species?name=...
   ข้อมูลชนิดพืชจาก GBIF (สาธารณะ ไม่ต้องล็อกอิน)
   - name ว่างหรือยาวเกิน 200 ตัวอักษร → 400
   - คืน { ok: true, data, unavailable } โดย data เป็น null เมื่อไม่ควรแสดงหรือ GBIF ล่ม
     unavailable: ส่วนที่ล้มเพราะ GBIF (เช่น ["photos"], ["name"]) สำหรับ test ไม่แสดงบนหน้าเว็บ
     (มี unavailable → Cache-Control สั้นเท่า cache ผลที่ล้ม)
========================================================= */

const MAX_NAME_LENGTH = 200;

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

const FAILURE_CACHE_CONTROL = `public, s-maxage=${FAILURE_CACHE_SECONDS}`;

export async function GET(request) {
  const name = (request.nextUrl.searchParams.get("name") || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!name || name.length > MAX_NAME_LENGTH) {
    return Response.json(
      { ok: false, error: "invalid_name" },
      { status: 400 },
    );
  }

  /*
   * getSpeciesInfo ไม่ throw แต่กันไว้ไม่ให้กลายเป็น 500
   * error ของโค้ดเราไม่ใช่ GBIF ล่ม จึงไม่ใส่ใน unavailable แต่ยังใช้ cache สั้น
   */
  let result = { data: null, unavailable: [] };

  let failed = false;

  try {
    result = await getSpeciesInfo(name);
  } catch (error) {
    console.error("GBIF species route error:", error);

    failed = true;
  }

  const { data, unavailable } = result;

  return Response.json(
    { ok: true, data, unavailable },
    {
      headers: {
        "Cache-Control":
          failed || unavailable.length ? FAILURE_CACHE_CONTROL : CACHE_CONTROL,
      },
    },
  );
}
