import { FAILURE_CACHE_SECONDS, getExamplePhoto } from "@/lib/gbifSpecies";

/* =========================================================
   GET /api/gbif/photo?name=...
   รูปตัวอย่างหนึ่งรูปจาก GBIF สำหรับรายการที่ไม่มีรูป (สาธารณะ ไม่ต้องล็อกอิน)
   - กติกาเดียวกับ /api/gbif/species: แสดงเฉพาะ ok / synonym / genus_only
   - name ว่างหรือยาวเกิน 200 ตัวอักษร → 400
   - คืน { ok: true, data, unavailable } โดย data เป็น null เมื่อไม่ควรแสดง ไม่มีรูป หรือ GBIF ล่ม
     data: { thumbnailUrl, largeUrl, creator, licenseLabel, licenseUrl,
             publisher, occurrenceUrl, level }
     unavailable: ส่วนที่ล้มเพราะ GBIF (["name"] / ["photos"]) สำหรับ test ไม่แสดงบนหน้าเว็บ
     (มี unavailable → Cache-Control สั้นเท่า cache ผลที่ล้ม เพื่อไม่ให้ CDN จำค่า null ไว้ทั้งวัน)
   - แสดงจากลิงก์ภายนอกเท่านั้น ไม่บันทึกรูปหรือลิงก์ลงฐานข้อมูล
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
   * getExamplePhoto ไม่ throw แต่กันไว้ไม่ให้กลายเป็น 500
   * error ของโค้ดเราไม่ใช่ GBIF ล่ม จึงไม่ใส่ใน unavailable แต่ยังใช้ cache สั้น
   */
  let result = { data: null, unavailable: [] };

  let failed = false;

  try {
    result = await getExamplePhoto(name);
  } catch (error) {
    console.error("GBIF photo route error:", error);

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
