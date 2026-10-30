-- =========================================================
-- 03_coordinate_source.sql
-- ที่มาของพิกัดและความคลาดเคลื่อน (แนว Darwin Core)
--
-- coordinate_source
-- - 'manual'   = admin ใส่เองหรือยืนยันแล้ว
-- - 'geocoded' = ประมาณจากชื่อสถานที่ (locality) โดยระบบเติมพิกัดอัตโนมัติ
-- - null       = ไม่มีพิกัด
-- coordinate_uncertainty_m
-- - รัศมีความคลาดเคลื่อนเป็นเมตร (dwc:coordinateUncertaintyInMeters)
-- - ใช้กับ 'geocoded' เท่านั้น ส่วน 'manual' เป็น null
--
-- วิธีใช้ (Supabase SQL Editor)
-- - รันส่วน A แล้วส่วน B (รันซ้ำได้ ไม่ error เพราะใช้ if not exists)
-- - ส่วน C ตรวจผล
-- - ต้องรันไฟล์นี้ก่อนใช้หน้าเพิ่ม/แก้ไขพรรณไม้ และการเติมพิกัดอัตโนมัติ
--   ถ้ายังไม่รัน การบันทึกจะแจ้งให้รันไฟล์นี้ก่อน
-- =========================================================


-- =========================================================
-- ส่วน A: เพิ่มคอลัมน์
-- =========================================================

alter table public.plants
  add column if not exists coordinate_source text
  check (coordinate_source in ('manual', 'geocoded'));

alter table public.plants
  add column if not exists coordinate_uncertainty_m integer
  check (coordinate_uncertainty_m > 0);

comment on column public.plants.coordinate_source is
  'manual = admin ใส่เอง/ยืนยันแล้ว, geocoded = ประมาณจากชื่อสถานที่ (แนว Darwin Core georeferenceProtocol)';

comment on column public.plants.coordinate_uncertainty_m is
  'รัศมีความคลาดเคลื่อนของพิกัดเป็นเมตร (dwc:coordinateUncertaintyInMeters) ใช้กับ geocoded';


-- =========================================================
-- ส่วน B: พิกัดเดิมทั้งหมดถือว่า admin ใส่เอง
-- =========================================================

update public.plants
set coordinate_source = 'manual'
where latitude is not null
  and longitude is not null
  and coordinate_source is null;


-- =========================================================
-- ส่วน C: ตรวจผล (อ่านอย่างเดียว)
-- =========================================================

-- C1) id ต้องมี default (เช่น gen_random_uuid()) เพราะหน้านำเข้าไม่ได้ส่ง id
--     ถ้า column_default ว่าง การนำเข้าจาก Excel จะ error ทุกชุด
select column_name, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'plants'
  and column_name in ('id', 'coordinate_source', 'coordinate_uncertainty_m');

-- C2) จำนวนรายการตามที่มาของพิกัด
select coordinate_source, count(*) from public.plants group by 1 order by 1;
