import { getSpeciesInfo } from "@/lib/gbifSpecies";

/* =========================================================
   GET /api/gbif/species?name=...
   ข้อมูลชนิดพืชจาก GBIF (สาธารณะ ไม่ต้องล็อกอิน)
   - name ว่างหรือยาวเกิน 200 ตัวอักษร → 400
   - คืน { ok: true, data } โดย data เป็น null เมื่อไม่ควรแสดงหรือ GBIF ล่ม
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

  /* getSpeciesInfo ไม่ throw แต่กันไว้ไม่ให้กลายเป็น 500 */
  let data = null;

  try {
    data = await getSpeciesInfo(name);
  } catch (error) {
    console.error("GBIF species route error:", error);
  }

  return Response.json(
    { ok: true, data },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
