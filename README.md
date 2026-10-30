# Virtual Herbarium

คลังพรรณไม้ดิจิทัลของหอพรรณไม้ คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร
พัฒนาเป็นโครงงานปริญญาตรี คณะวิทยาศาสตร์ มหาวิทยาลัยนเรศวร

เว็บจริง: <https://virtual-herbarium.vercel.app>

## ฟีเจอร์หลัก (Features)

- **ค้นหาและกรอง**: ค้นหาด้วย PNU, ชื่อวิทยาศาสตร์, วงศ์, ผู้เก็บ หรือสถานที่ และกรองตามวงศ์ กลุ่มพืช และผู้เก็บตัวอย่าง ตัวกรองอยู่ใน URL จึงแชร์ลิงก์ได้
- **หน้ารายละเอียดพร้อมข้อมูลจาก GBIF**: แสดงลำดับชั้นทางอนุกรมวิธาน ชื่อสามัญ จำนวนบันทึกทั่วโลกและในประเทศไทย แผนที่การกระจายพันธุ์ และรูปถ่ายพร้อมเครดิตและสัญญาอนุญาต
- **แผนที่รวม** (`/map`): หมุดของทุกรายการที่มีพิกัด จัดกลุ่มอัตโนมัติ และใช้ตัวกรองชุดเดียวกับหน้ารายการพรรณไม้
- **QR code และพิมพ์ป้าย**: ทุกรายการมี QR code ลิงก์ไปยังหน้ารายละเอียด และผู้ดูแลพิมพ์ป้ายติดตัวอย่าง (A4 หน้าละ 8 ป้าย) ได้ตามช่วง PNU หรือตามรายการที่เลือก
- **ตรวจชื่อวิทยาศาสตร์กับ GBIF**: ตรวจในหน้าเพิ่มและแก้ไขรายการ บอกได้ว่าชื่อสะกดผิด เป็นชื่อพ้อง หรือไม่พบ
- **นำเข้าข้อมูล**: นำเข้าไฟล์ Excel (.xlsx) หรือ CSV โดยตรวจทุกแถวก่อนบันทึก และอัปโหลดรูปหลายไฟล์พร้อมกัน (จับคู่กับรายการตาม PNU ในชื่อไฟล์)

ผู้เข้าชมทั่วไปดูข้อมูลได้โดยไม่ต้องล็อกอิน ส่วนการเพิ่ม แก้ไข นำเข้า และพิมพ์ป้ายทำได้เฉพาะผู้ดูแล (admin) และระบบไม่มีการสมัครสมาชิก

## เทคโนโลยีที่ใช้ (Tech Stack)

- [Next.js](https://nextjs.org) 16 (App Router) และ React 19 เขียนด้วย JavaScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Supabase](https://supabase.com): ฐานข้อมูล PostgreSQL, Auth และ Storage
- [Leaflet](https://leafletjs.com) และ leaflet.markercluster สำหรับแผนที่ ใช้แผนที่ฐานจาก OpenStreetMap
- [GBIF API](https://techdocs.gbif.org) สำหรับตรวจชื่อและข้อมูลชนิดพันธุ์
- qrcode สำหรับสร้าง QR code และ SheetJS (xlsx) สำหรับอ่านไฟล์ Excel
- three.js และ React Three Fiber สำหรับภาพพื้นหลังสามมิติ (โหลดเฉพาะจอกว้าง)
- Deploy บน [Vercel](https://vercel.com)

## ติดตั้งและรันในเครื่อง (Getting Started)

ต้องมี Node.js เวอร์ชันที่ Next.js 16 รองรับ (20.9 ขึ้นไป)

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่าจริงใน .env.local
npm run dev
```

เปิด <http://localhost:3000>

ตัวแปรใน `.env.example`:

| ตัวแปร | จำเป็น | ความหมาย |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ใช่ | URL ของโปรเจกต์ Supabase (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ใช่ | anon key (เปิดเผยได้ ข้อมูลป้องกันด้วย RLS) |
| `NEXT_PUBLIC_SITE_URL` | แนะนำ | URL หลักของเว็บ ใช้สร้างลิงก์ใน QR code (ไม่มี `/` ท้าย) ถ้าเว้นว่างจะใช้ origin ของหน้าที่เปิดอยู่ |
| `NEXT_PUBLIC_MAP_TILE_URL` | ไม่ | tile ของแผนที่ (ค่าเริ่มต้น OpenStreetMap) |
| `NEXT_PUBLIC_FORWARD_GEOCODING_URL` | ไม่ | บริการค้นพิกัดจากชื่อสถานที่ (ค่าเริ่มต้น Nominatim) |
| `NEXT_PUBLIC_ELEVATION_URL` | ไม่ | บริการความสูงจากระดับน้ำทะเล (ค่าเริ่มต้น Open-Meteo) |

ห้าม commit ไฟล์ `.env.local` และห้ามใส่ค่าที่เป็นความลับ (เช่น service role key) ในตัวแปร `NEXT_PUBLIC_` เพราะตัวแปรเหล่านี้ถูกส่งไปที่เบราว์เซอร์

## ตั้งค่าบน Vercel (Deployment)

ตั้งตัวแปรต่อไปนี้ใน Project Settings → Environment Variables ให้ครบทั้ง **Production** และ **Preview**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (เช่น `https://virtual-herbarium.vercel.app`)
- ตัวแปรแผนที่ที่ไม่บังคับ (ถ้าใช้)

ตัวแปร `NEXT_PUBLIC_` ถูกฝังลงในโค้ดตอน build ดังนั้นหลังเพิ่มหรือแก้ค่า ต้องสั่ง **Redeploy** ใหม่ทุกครั้ง ค่าใหม่จึงจะมีผล

## ตั้งค่าฐานข้อมูล (Database Setup)

ไฟล์ SQL อยู่ใน `supabase/sql/` ให้รันใน Supabase Dashboard → SQL Editor **ตามลำดับเลขหน้าชื่อไฟล์** และอ่านคอมเมนต์ต้นไฟล์ก่อนรันทุกครั้ง

1. `01_search_and_facets.sql`: คอลัมน์ `search_text` สำหรับค้นหา, index และฟังก์ชัน `get_plant_facets()` สำหรับสถิติและตัวเลือกตัวกรอง
2. `02_cleanup_profile_policies.sql`: ลบ policy ของตาราง `profiles` ที่ซ้ำกัน

ไฟล์เหล่านี้ปรับเพิ่มบนโปรเจกต์ที่มีตาราง `plants`, `profiles` และ Storage bucket `plant-images`, `avatars` อยู่แล้ว

## ตั้งผู้ดูแลระบบ (Admin Setup)

1. Supabase Dashboard → Authentication → Users → **Add user** แล้วสร้างผู้ใช้ด้วยอีเมลและรหัสผ่าน
2. แก้ **app_metadata** ของผู้ใช้นั้นให้มี `{"role":"admin"}` (เช่นใน SQL Editor:
   `update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '<อีเมล>';`)
3. Authentication → Sign In / Providers → ปิด **Allow new users to sign up** เพื่อไม่ให้มีการสมัครสมาชิกเอง

ผู้ใช้ที่ไม่มี `role` เป็น `admin` จะเข้าหน้า `/account` ไม่ได้ (ระบบจะออกจากระบบให้และพาไปหน้าเข้าสู่ระบบ)

## ทดสอบ (Testing)

```bash
npm run test:gbif
```

ตรวจการเทียบชื่อวิทยาศาสตร์กับ GBIF (`lib/gbif.js`) ด้วยชื่อตัวอย่างจริง ต้องต่ออินเทอร์เน็ต

```bash
npm run build && npm start      # หรือ npm run dev
npm run test:gbif-species       # อีกหน้าต่างหนึ่ง
```

ตรวจ API `/api/gbif/species` ของเซิร์ฟเวอร์ที่รันอยู่ (ค่าเริ่มต้น `http://localhost:3000` เปลี่ยนได้ด้วย `BASE_URL=... npm run test:gbif-species`)

ทั้งสองคำสั่งจบด้วย exit code 1 ถ้ามีข้อใดไม่ผ่าน

## ล้าง cache ข้อมูล GBIF (Clearing the GBIF Cache)

ข้อมูลจาก GBIF ถูก cache ไว้ฝั่ง server 7 วัน ถ้าต้องการให้ดึงใหม่ทันที:

- **บน Vercel**: Project → Settings → Data Cache → **Purge Everything**
- **ในเครื่อง**: หยุดเซิร์ฟเวอร์ ลบโฟลเดอร์ `.next/cache` แล้วรันใหม่
