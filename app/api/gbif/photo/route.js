import { getExamplePhoto } from "@/lib/gbifSpecies";

/* =========================================================
   GET /api/gbif/photo?name=...
   รูปตัวอย่างหนึ่งรูปจาก GBIF สำหรับรายการที่ไม่มีรูป (สาธารณะ ไม่ต้องล็อกอิน)
   - กติกาเดียวกับ /api/gbif/species: แสดงเฉพาะ ok / synonym / genus_only
   - name ว่างหรือยาวเกิน 200 ตัวอักษร → 400
   - คืน { ok: true, data } โดย data เป็น null เมื่อไม่ควรแสดง ไม่มีรูป หรือ GBIF ล่ม
     (GBIF ล่ม → Cache-Control: no-store เพื่อไม่ให้ CDN จำค่า null ไว้ทั้งวัน)
     data: { thumbnailUrl, largeUrl, creator, licenseLabel, licenseUrl,
             publisher, occurrenceUrl, level }
   - แสดงจากลิงก์ภายนอกเท่านั้น ไม่บันทึกรูปหรือลิงก์ลงฐานข้อมูล
========================================================= */

const MAX_NAME_LENGTH = 200;

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

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

  try {
    const data = await getExamplePhoto(name);

    return Response.json(
      { ok: true, data },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (error) {
    console.warn("GBIF photo unavailable:", error?.message || error);

    return Response.json(
      { ok: true, data: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
