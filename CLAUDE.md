@AGENTS.md

## Project rules

- Next.js 16 App Router + React 19, JavaScript เท่านั้น, Tailwind v4
- ผู้ล็อกอินได้คนเดียวคือ admin (`app_metadata.role === "admin"`), ไม่มีการสมัครสมาชิก
- หน้า public ไม่ต้องล็อกอิน อ่านข้อมูลด้วย anon key ผ่าน `lib/plantQueries.js`; หน้าใน `/account` ป้องกันด้วย `app/account/layout.js`
  และใช้ `useAdmin()` (`components/AdminContext.js`) ห้ามเขียนโค้ดตรวจสิทธิ์ซ้ำในหน้า
- ฝั่ง admin เห็นและจัดการข้อมูลทุกรายการ ไม่กรองด้วย `user_id`
- session อยู่ฝั่ง browser (ไม่มี `@supabase/ssr`)
- ข้อความในหน้าเว็บอยู่ในออบเจกต์ TH/EN ในไฟล์ของหน้าหรือ component
- แผนที่ใช้ Leaflet ผ่าน `lib/useLeafletMap.js`
- ดึงข้อมูลจาก Supabase เกิน 1000 แถวต้องวน `range()`
- query ฝั่ง public ใช้ client จาก `lib/supabasePublic.js` เสมอ (ไม่ขึ้นกับ session ใน browser)
  ฟังก์ชันที่ใช้ร่วมกับฝั่ง admin (เช่น `fetchPlantsPage`, `fetchPlantFacets`) ให้หน้า public ส่ง `client: supabasePublic`
  ฝั่ง admin และ Navbar ใช้ client หลักจาก `lib/supabase.js`
- ตรรกะกรองพรรณไม้ใช้ `applyPlantFilters()` และการอ่านตัวกรองจาก URL ใช้ `readPlantFilters()` (`lib/plantQueries.js`) เท่านั้น ห้ามเขียนซ้ำ
- `lib/gbif.js` ใช้ได้ทั้ง browser และ server ห้ามใส่ `server-only`; โค้ดที่ต้องรันฝั่ง server เท่านั้นใส่ใน `lib/gbifSpecies.js`
- `NEXT_PUBLIC_SITE_URL` ตั้งไว้ใน Vercel ทั้ง Production และ Preview แล้ว; QR ทุกอันต้องสร้าง URL ด้วย `getPlantUrl()` (`lib/siteUrl.js`)
- การทดสอบด้วย Chrome headless ห้ามรอ network idle ให้กำหนด selector ที่รอและเวลาสูงสุดเสมอ
- ห้ามอัปเดต `@react-pdf/renderer` หรือ `pdfkit` โดยไม่รัน `npm run test:label-pdf` และตรวจภาพสระวรรณยุกต์ไทย
  เพราะ `lib/labelPdf.js` แทนที่โค้ดภายในของ react-pdf 4.9.0 เพื่อแก้บั๊กภาษาไทย
- SQL ห้ามรันเอง เขียนเป็นไฟล์ใน `supabase/sql/` ให้ผู้ใช้รันใน SQL Editor
- ทุกขั้นต้อง `npm run build` ผ่านและ commit แยก, ห้าม push เอง
- ห้ามมีตัวแปร `NEXT_PUBLIC_` ที่เป็นความลับ
- โปรเจกต์นี้ไม่ใช้ AI/LLM API ใดๆ ห้ามเพิ่ม
- ติดตั้ง package ใหม่ใช้ `--save-exact` และเวอร์ชันที่ออกมาแล้วอย่างน้อย 2 สัปดาห์
- ทำเฉพาะขั้นที่สั่ง ห้ามแก้ไฟล์ที่ไม่เกี่ยวข้อง
- ทดสอบเสร็จแล้วให้ปิด dev server ที่เปิดไว้ทุกครั้ง
