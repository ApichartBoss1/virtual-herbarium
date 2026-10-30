-- =========================================================
-- 02_cleanup_profile_policies.sql
-- ลบ policy ของตาราง profiles ที่ซ้ำกัน
--
-- ตาราง profiles มี policy สองชุดที่ทำหน้าที่เดียวกัน
-- - ชุด "... own profile"         ตั้งให้ role public        → ลบ
-- - ชุด "... their own profile"   ตั้งให้ role authenticated → เก็บไว้
--
-- วิธีใช้ (Supabase SQL Editor)
-- - รันส่วน A ก่อน เพื่อดูว่าตอนนี้มี policy อะไรบ้าง
-- - รันส่วน B เพื่อลบ (รันซ้ำได้ ไม่ error เพราะใช้ if exists)
-- - รันส่วน C เพื่อตรวจผล
-- =========================================================


-- =========================================================
-- ส่วน A: ตรวจสอบก่อนลบ (อ่านอย่างเดียว)
-- ควรเห็นทั้งชุด role {public} และชุด role {authenticated}
-- =========================================================

select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;


-- =========================================================
-- ส่วน B: ลบชุดที่ตั้งให้ role public
-- =========================================================

drop policy if exists "Users can insert own profile" on public.profiles;

drop policy if exists "Users can view own profile" on public.profiles;

drop policy if exists "Users can update own profile" on public.profiles;


-- =========================================================
-- ส่วน C: ตรวจผล
-- ผลที่ควรได้: 3 แถว (insert, select, update)
-- ชื่อมีคำว่า "their own" และ roles เป็น {authenticated} ทั้งหมด
-- =========================================================

select policyname, cmd, roles from pg_policies where tablename = 'profiles';
