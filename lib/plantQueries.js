import { supabase } from "@/lib/supabase";

/* =========================================================
   PLANT QUERIES
   ค้นหา กรอง เรียง และแบ่งหน้าที่ฐานข้อมูล
   ต้องรัน supabase/sql/01_search_and_facets.sql ก่อน
   (คอลัมน์ search_text และฟังก์ชัน get_plant_facets)
========================================================= */

/* คอลัมน์ที่หน้ารายการใช้แสดงผล (ไม่ดึง search_text) */
export const PLANT_LIST_COLUMNS =
  "id, plant_id, pnu_no, botanical_name, family, artificial_group, locality, collected_by, collector_no, image_url, created_at";

/* คอลัมน์ที่หน้า public ใช้แสดงการ์ดพรรณไม้ (ไม่ดึง user_id และ search_text) */
export const PLANT_CARD_COLUMNS =
  "id, pnu_no, botanical_name, family, locality, collected_by, image_url";

/* คอลัมน์ที่หน้ารายละเอียด public ใช้แสดงผล */
export const PLANT_DETAIL_COLUMNS =
  "id, pnu_no, artificial_group, family, botanical_name, collected_by, collector_no, locality, latitude, longitude, elevation, image_url";

export const EMPTY_FACETS = {
  total: 0,
  family_count: 0,
  group_count: 0,
  families: [],
  groups: [],
  collectors: [],
  localities: [],
};

/*
 * plant_id เป็นลำดับรอง เพื่อให้ลำดับคงที่เมื่อค่าหลักเท่ากัน
 * (ตรงกับ index plants_created_at_plant_id_idx)
 */
const SORT_ORDERS = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  nameAZ: { column: "botanical_name", ascending: true },
  nameZA: { column: "botanical_name", ascending: false },
};

/* PostgREST: offset เกินจำนวนแถวที่มี */
const RANGE_NOT_SATISFIABLE = "PGRST103";

/* =========================================================
   HELPERS
========================================================= */

/* กัน % _ \ ในคำค้นไม่ให้กลายเป็น wildcard ของ ILIKE */
export function escapeLikePattern(value) {
  return String(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function getSearchTerms(search) {
  return String(search || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/* =========================================================
   FETCH ONE PAGE
   คืนค่า { rows, total }
   total = null เมื่อหน้าที่ขอเกินจำนวนหน้าที่มี
========================================================= */

export async function fetchPlantsPage({
  search = "",
  family = "",
  group = "",
  collector = "",
  locality = "",
  sort = "newest",
  page = 1,
  pageSize = 12,
  columns = PLANT_LIST_COLUMNS,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);

  const from = (safePage - 1) * pageSize;

  const to = from + pageSize - 1;

  let query = supabase.from("plants").select(columns, { count: "exact" });

  /* ทุกคำต้องพบ (AND) เช่น "fabaceae พิษณุโลก" */
  getSearchTerms(search).forEach((term) => {
    query = query.ilike("search_text", `%${escapeLikePattern(term)}%`);
  });

  if (family) {
    query = query.eq("family", family);
  }

  if (group) {
    query = query.eq("artificial_group", group);
  }

  if (collector) {
    query = query.eq("collected_by", collector);
  }

  if (locality) {
    query = query.eq("locality", locality);
  }

  const order = SORT_ORDERS[sort] || SORT_ORDERS.newest;

  query = query
    .order(order.column, { ascending: order.ascending })
    .order("plant_id", { ascending: order.ascending })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    if (error.code === RANGE_NOT_SATISFIABLE) {
      return { rows: [], total: null };
    }

    throw error;
  }

  return {
    rows: data || [],
    total: count || 0,
  };
}

/* =========================================================
   FETCH FACETS
   สถิติ + ตัวเลือกตัวกรอง จากฟังก์ชัน get_plant_facets()
   แต่ละรายการเป็น { name, count }
========================================================= */

export async function fetchPlantFacets() {
  const { data, error } = await supabase.rpc("get_plant_facets");

  if (error) {
    throw error;
  }

  return {
    ...EMPTY_FACETS,
    ...(data || {}),
  };
}

/* =========================================================
   PUBLIC: FEATURED PLANTS
   พรรณไม้ที่มีรูป ล่าสุดก่อน (สำหรับภาพเด่นหน้าแรก)
========================================================= */

export async function fetchFeaturedPlants(limit = 24) {
  const { data, error } = await supabase
    .from("plants")
    .select(PLANT_CARD_COLUMNS)
    .not("image_url", "is", null)
    .neq("image_url", "")
    .order("created_at", { ascending: false })
    .order("plant_id", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   PUBLIC: ONE PLANT
   คืน null เมื่อไม่พบ
========================================================= */

export async function fetchPublicPlant(id) {
  const { data, error } = await supabase
    .from("plants")
    .select(PLANT_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}
