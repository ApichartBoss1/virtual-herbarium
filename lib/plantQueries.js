import { supabase } from "@/lib/supabase";
import { supabasePublic } from "@/lib/supabasePublic";
import { coordinateColumnsFor } from "@/lib/coordinateSource";

/* =========================================================
   PLANT QUERIES
   ค้นหา กรอง เรียง และแบ่งหน้าที่ฐานข้อมูล
   ต้องรัน supabase/sql/01_search_and_facets.sql ก่อน
   (คอลัมน์ search_text และฟังก์ชัน get_plant_facets)

   client
   - ฟังก์ชันที่ใช้ร่วมกันทั้ง admin และ public รับ client เป็นพารามิเตอร์
     ค่าเริ่มต้นคือ client หลัก (admin) หน้า public ส่ง supabasePublic
   - ฟังก์ชัน PUBLIC ใช้ supabasePublic, ฟังก์ชัน ADMIN ใช้ client หลัก
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
   FILTERS
   ตัวกรองชุดเดียวที่ /plants และ /map ใช้ร่วมกัน
   ชื่อพารามิเตอร์ใน URL: ?q=&family=&group=&collector=
========================================================= */

export const PLANT_FILTER_PARAMS = {
  search: "q",
  family: "family",
  group: "group",
  collector: "collector",
};

export const EMPTY_PLANT_FILTERS = {
  search: "",
  family: "",
  group: "",
  collector: "",
};

/* อ่านตัวกรองจาก URLSearchParams (หรือ useSearchParams()) */
export function readPlantFilters(searchParams) {
  return Object.fromEntries(
    Object.entries(PLANT_FILTER_PARAMS).map(([key, param]) => [
      key,
      searchParams?.get(param)?.trim() || "",
    ]),
  );
}

/* ตัวกรอง → query string (ไม่มี "?") ข้ามค่าว่าง เช่น "q=ขิง&family=Zingiberaceae" */
export function plantFiltersToSearch(filters) {
  const params = new URLSearchParams();

  Object.entries(PLANT_FILTER_PARAMS).forEach(([key, param]) => {
    const value = String(filters?.[key] || "").trim();

    if (value) {
      params.set(param, value);
    }
  });

  return params.toString();
}

export function hasPlantFilters(filters) {
  return Object.keys(PLANT_FILTER_PARAMS).some((key) =>
    String(filters?.[key] || "").trim(),
  );
}

/* ใส่เงื่อนไขตัวกรองให้ query ของตาราง plants */
export function applyPlantFilters(
  query,
  { search = "", family = "", group = "", collector = "" } = {},
) {
  let filtered = query;

  /* ทุกคำต้องพบ (AND) เช่น "fabaceae พิษณุโลก" */
  getSearchTerms(search).forEach((term) => {
    filtered = filtered.ilike("search_text", `%${escapeLikePattern(term)}%`);
  });

  if (family) {
    filtered = filtered.eq("family", family);
  }

  if (group) {
    filtered = filtered.eq("artificial_group", group);
  }

  if (collector) {
    filtered = filtered.eq("collected_by", collector);
  }

  return filtered;
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
  client = supabase,
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);

  const from = (safePage - 1) * pageSize;

  const to = from + pageSize - 1;

  let query = applyPlantFilters(
    client.from("plants").select(columns, { count: "exact" }),
    { search, family, group, collector },
  );

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

export async function fetchPlantFacets(client = supabase) {
  const { data, error } = await client.rpc("get_plant_facets");

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
  const { data, error } = await supabasePublic
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
  const { data, error } = await supabasePublic
    .from("plants")
    .select(PLANT_DETAIL_COLUMNS + (await coordinateColumnsFor(supabasePublic)))
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   ADMIN: PRINTABLE LABELS
   ดึงตามช่วง PNU หรือตาม id ที่เลือก เรียงตาม pnu_no
   วน range() ทีละ 1000 แถวตามกติกาของโปรเจกต์
========================================================= */

/* คอลัมน์ที่ใช้บนป้ายเท่านั้น */
export const PLANT_LABEL_COLUMNS =
  "id, pnu_no, botanical_name, family, locality, latitude, longitude, elevation, collected_by, collector_no";

/* จำนวนป้ายสูงสุดต่อการพิมพ์หนึ่งครั้ง */
export const MAX_LABELS = 200;

const FETCH_PAGE_SIZE = 1000;

/* id ต่อหนึ่งคำขอ (กัน URL ยาวเกิน) */
const ID_CHUNK_SIZE = 100;

async function fetchAllRows(buildQuery) {
  const rows = [];

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    const { data, error } = await buildQuery().range(
      from,
      from + FETCH_PAGE_SIZE - 1,
    );

    if (error) {
      throw error;
    }

    rows.push(...(data || []));

    if (!data || data.length < FETCH_PAGE_SIZE) {
      return rows;
    }
  }
}

function comparePnu(a, b) {
  const left = a.pnu_no ?? Number.POSITIVE_INFINITY;
  const right = b.pnu_no ?? Number.POSITIVE_INFINITY;

  return left - right;
}

export async function fetchLabelPlantsByPnuRange(pnuFrom, pnuTo) {
  const columns = PLANT_LABEL_COLUMNS + (await coordinateColumnsFor(supabase));

  return fetchAllRows(() =>
    supabase
      .from("plants")
      .select(columns)
      .gte("pnu_no", pnuFrom)
      .lte("pnu_no", pnuTo)
      .order("pnu_no", { ascending: true })
      .order("plant_id", { ascending: true }),
  );
}

export async function fetchLabelPlantsByIds(ids) {
  const unique = [...new Set(ids)];

  const columns = PLANT_LABEL_COLUMNS + (await coordinateColumnsFor(supabase));

  const rows = [];

  for (let start = 0; start < unique.length; start += ID_CHUNK_SIZE) {
    const chunk = unique.slice(start, start + ID_CHUNK_SIZE);

    rows.push(
      ...(await fetchAllRows(() =>
        supabase
          .from("plants")
          .select(columns)
          .in("id", chunk)
          .order("pnu_no", { ascending: true })
          .order("plant_id", { ascending: true }),
      )),
    );
  }

  /* หลายชุดรวมกัน ต้องเรียงใหม่ (pnu_no ว่างไว้ท้าย) */
  return rows.sort(comparePnu);
}
