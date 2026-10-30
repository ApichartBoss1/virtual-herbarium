-- =========================================================
-- 01_search_and_facets.sql
-- ค้นหาที่ฐานข้อมูล + แบ่งหน้า + สถิติ/ตัวเลือกตัวกรอง
--
-- วิธีใช้
-- - รันทีละส่วนตามลำดับ A → B → C → D ใน Supabase SQL Editor
-- - ส่วน A ให้รันทีละคำสั่ง (เลือกข้อความแล้วกด Run)
--   เพราะ SQL Editor แสดงผลเฉพาะคำสั่งสุดท้าย
-- - ส่วน E และ F ถูกครอบด้วยคอมเมนต์ไว้ เพื่อไม่ให้รันโดยไม่ตั้งใจ
--   ถ้าจะใช้ ให้ลบ /* และ */ ของส่วนนั้นออกก่อน
-- =========================================================


-- =========================================================
-- ส่วน A: ตรวจสอบ (อ่านอย่างเดียว ไม่แก้ไขอะไร)
-- =========================================================

-- A1) plant_id มี default หรือ identity หรือไม่
--     ใช้ได้ถ้า is_identity = 'YES' หรือ column_default ขึ้นต้นด้วย nextval(...)
--     ถ้าว่างทั้งคู่ การเพิ่มพรรณไม้จากหน้าเว็บจะ error เพราะไม่ได้ส่ง plant_id
select
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_identity,
  identity_generation
from information_schema.columns
where table_schema = 'public'
  and table_name = 'plants'
  and column_name in ('plant_id', 'id');

-- A2) ค่าล่าสุดของ sequence ต้องไม่น้อยกว่า max(plant_id)
--     ถ้าน้อยกว่า การ insert ครั้งถัดไปจะเกิด duplicate key
--     (ถ้า sequence_name เป็น null แปลว่า plant_id ไม่มี sequence ผูกอยู่)
select
  pg_get_serial_sequence('public.plants', 'plant_id') as sequence_name,
  (select max(plant_id) from public.plants) as max_plant_id;

-- A3) pnu_no ที่ซ้ำกัน (ต้องแก้ให้ไม่เหลือก่อนรันส่วน E)
select pnu_no, count(*) as total, array_agg(plant_id order by plant_id) as plant_ids
from public.plants
group by pnu_no
having count(*) > 1
order by pnu_no;

-- A4) pnu_no ที่ว่าง
select count(*) as empty_pnu_no
from public.plants
where pnu_no is null;

-- A5) index ที่มีอยู่แล้วในตาราง plants
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'plants'
order by indexname;

-- A6) pg_trgm ติดตั้งแล้วหรือยัง และอยู่ใน schema ไหน
--     ถ้าไม่มีแถว = ยังไม่ติดตั้ง (ส่วน B จะติดตั้งให้ใน schema extensions)
--     ถ้าอยู่ใน schema public ให้แก้ extensions.gin_trgm_ops ในส่วน B
--     เป็น public.gin_trgm_ops ก่อนรัน
select extname, extnamespace::regnamespace as schema_name, extversion
from pg_extension
where extname = 'pg_trgm';

-- A7) จำนวนแถวทั้งหมด (ถ้าเกิน 1000 แปลว่าหน้าเว็บตอนนี้แสดงไม่ครบ)
select count(*) as total_plants from public.plants;


-- =========================================================
-- ส่วน B: คอลัมน์ search_text + trigram index
-- =========================================================

-- B1) ติดตั้ง pg_trgm สำหรับค้นหาข้อความบางส่วน (ilike '%คำค้น%') ให้เร็ว
create extension if not exists pg_trgm with schema extensions;

-- B2) คอลัมน์รวมข้อความสำหรับค้นหา
--     เป็น generated column แบบ stored ฐานข้อมูลคำนวณให้เองทุกครั้งที่ insert/update
--     จึงไม่ต้องแก้โค้ดหน้าเพิ่ม/แก้ไข และหน้านำเข้า Excel ในอนาคต
--     ไม่ต้อง lower() เพราะ ilike ไม่สนตัวพิมพ์เล็กใหญ่อยู่แล้ว
alter table public.plants
  add column if not exists search_text text
  generated always as (
    coalesce(pnu_no::text, '') || ' ' ||
    coalesce(botanical_name, '') || ' ' ||
    coalesce(family, '') || ' ' ||
    coalesce(artificial_group, '') || ' ' ||
    coalesce(locality, '') || ' ' ||
    coalesce(collected_by, '') || ' ' ||
    coalesce(collector_no, '')
  ) stored;

-- B3) GIN trigram index บน search_text
--     ช่วยได้เมื่อคำค้นยาวตั้งแต่ 3 ตัวอักษรขึ้นไป
create index if not exists plants_search_text_trgm_idx
  on public.plants
  using gin (search_text extensions.gin_trgm_ops);


-- =========================================================
-- ส่วน C: ฟังก์ชัน get_plant_facets()
-- คืนสถิติและตัวเลือกตัวกรองทั้งหมดในการเรียกครั้งเดียว
--
-- รูปแบบผลลัพธ์
-- {
--   "total": 1234,
--   "family_count": 56,
--   "group_count": 7,
--   "families":   [{ "name": "Fabaceae", "count": 120 }, ...],
--   "groups":     [{ "name": "...", "count": 10 }, ...],
--   "collectors": [{ "name": "...", "count": 10 }, ...],
--   "localities": [{ "name": "...", "count": 10 }, ...]
-- }
--
-- - ตัดช่องว่างหัวท้าย (trim) และไม่เอาค่าว่าง
-- - เรียงตามตัวอักษร
-- - security invoker = ทำงานภายใต้ RLS ของผู้เรียก (ทุกคน SELECT ได้อยู่แล้ว)
-- - set search_path = '' และระบุ public.plants เต็ม ตามคำแนะนำของ Supabase linter
-- =========================================================

create or replace function public.get_plant_facets()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with cleaned as (
    select
      nullif(trim(family), '') as family,
      nullif(trim(artificial_group), '') as artificial_group,
      nullif(trim(collected_by), '') as collected_by,
      nullif(trim(locality), '') as locality
    from public.plants
  ),
  families as (
    select family as name, count(*) as count
    from cleaned
    where family is not null
    group by family
  ),
  groups as (
    select artificial_group as name, count(*) as count
    from cleaned
    where artificial_group is not null
    group by artificial_group
  ),
  collectors as (
    select collected_by as name, count(*) as count
    from cleaned
    where collected_by is not null
    group by collected_by
  ),
  localities as (
    select locality as name, count(*) as count
    from cleaned
    where locality is not null
    group by locality
  )
  select json_build_object(
    'total', (select count(*) from cleaned),
    'family_count', (select count(*) from families),
    'group_count', (select count(*) from groups),
    'families', coalesce(
      (select json_agg(json_build_object('name', name, 'count', count) order by name) from families),
      '[]'::json
    ),
    'groups', coalesce(
      (select json_agg(json_build_object('name', name, 'count', count) order by name) from groups),
      '[]'::json
    ),
    'collectors', coalesce(
      (select json_agg(json_build_object('name', name, 'count', count) order by name) from collectors),
      '[]'::json
    ),
    'localities', coalesce(
      (select json_agg(json_build_object('name', name, 'count', count) order by name) from localities),
      '[]'::json
    )
  );
$$;

-- ให้ผู้เยี่ยมชม (anon) และผู้ล็อกอิน (authenticated) เรียกใช้ได้
grant execute on function public.get_plant_facets() to anon, authenticated;

-- ทดสอบหลังรัน
-- select public.get_plant_facets();


-- =========================================================
-- ส่วน D: index เพิ่มเติม
-- =========================================================

-- D1) เรียง "ล่าสุดก่อน" + แบ่งหน้า
--     โค้ดจะเรียง created_at desc แล้วตามด้วย plant_id desc
--     เพื่อให้ลำดับคงที่เมื่อ created_at เท่ากัน (เช่น นำเข้าจาก Excel พร้อมกัน)
--     index นี้ใช้ได้ทั้งเรียงล่าสุดก่อนและเก่าสุดก่อน (สแกนย้อนกลับ)
create index if not exists plants_created_at_plant_id_idx
  on public.plants (created_at desc, plant_id desc);

-- D2) กรองตามวงศ์
create index if not exists plants_family_idx
  on public.plants (family);


-- =========================================================
-- ส่วน E (ทางเลือก): unique index บน pnu_no
-- รันหลังจากผลของ A3 ไม่มีแถวแล้วเท่านั้น
-- ถ้ายังมีค่าซ้ำ คำสั่งนี้จะ error และไม่สร้าง index
-- ลบ /* และ */ ออกก่อนรัน
-- =========================================================

/*
create unique index if not exists plants_pnu_no_unique_idx
  on public.plants (pnu_no);
*/


-- =========================================================
-- ส่วน F: ย้อนกลับ (rollback)
-- ลบทุกอย่างที่ส่วน B ถึง E สร้าง เรียงย้อนจากหลังไปหน้า
-- ห้ามรันก่อนย้อนโค้ดหน้าเว็บกลับ เพราะโค้ดใหม่จะเรียกใช้ search_text และ get_plant_facets()
-- ลบ /* และ */ ออกก่อนรัน
-- =========================================================

/*
-- ส่วน E
drop index if exists public.plants_pnu_no_unique_idx;

-- ส่วน D
drop index if exists public.plants_family_idx;
drop index if exists public.plants_created_at_plant_id_idx;

-- ส่วน C
drop function if exists public.get_plant_facets();

-- ส่วน B (ลบคอลัมน์จะลบ index บนคอลัมน์ไปด้วย แต่ระบุไว้ให้ชัดเจน)
drop index if exists public.plants_search_text_trgm_idx;
alter table public.plants drop column if exists search_text;

-- ไม่ลบ pg_trgm โดยปริยาย เพราะอาจมีส่วนอื่นใช้อยู่
-- ถ้าแน่ใจว่าไม่มีใครใช้ ค่อยรันบรรทัดนี้
-- drop extension if exists pg_trgm;
*/
