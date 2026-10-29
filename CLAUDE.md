@AGENTS.md

## Project rules

- Next.js 16 App Router + React 19, JavaScript เท่านั้น, Tailwind v4
- ผู้ล็อกอินได้คนเดียวคือ admin (`app_metadata.role === "admin"`), ไม่มีการสมัครสมาชิก
- หน้า public ไม่ต้องล็อกอิน อ่านข้อมูลด้วย anon key ผ่าน `lib/plantQueries.js`; หน้าใน `/account` ป้องกันด้วย `app/account/layout.js`
  และใช้ `useAdmin()` (`components/AdminContext.js`) ห้ามเขียนโค้ดตรวจสิทธิ์ซ้ำในหน้า
- ฝั่ง admin เห็นและจัดการข้อมูลทุกรายการ ไม่กรองด้วย `user_id`
- session อยู่ฝั่ง browser (ไม่มี `@supabase/ssr`), API Route ตรวจตัวตนด้วย
  `Authorization: Bearer` + `supabase.auth.getUser(token)` เท่านั้น
- ข้อความในหน้าเว็บอยู่ในออบเจกต์ TH/EN ในไฟล์ของหน้าหรือ component
- แผนที่ใช้ Leaflet ผ่าน `lib/useLeafletMap.js`
- ดึงข้อมูลจาก Supabase เกิน 1000 แถวต้องวน `range()`
- SQL ห้ามรันเอง เขียนเป็นไฟล์ใน `supabase/sql/` ให้ผู้ใช้รันใน SQL Editor
- ทุกขั้นต้อง `npm run build` ผ่านและ commit แยก, ห้าม push เอง
- ห้ามมีตัวแปร `NEXT_PUBLIC_` ที่เป็นความลับ, key ของ AI อยู่ฝั่ง server เท่านั้น
- ติดตั้ง package ใหม่ใช้ `--save-exact` และเวอร์ชันที่ออกมาแล้วอย่างน้อย 2 สัปดาห์
- ทำเฉพาะขั้นที่สั่ง ห้ามแก้ไฟล์ที่ไม่เกี่ยวข้อง
- ทดสอบเสร็จแล้วให้ปิด dev server ที่เปิดไว้ทุกครั้ง
