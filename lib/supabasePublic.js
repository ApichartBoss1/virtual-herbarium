import { createClient } from "@supabase/supabase-js";

/* =========================================================
   SUPABASE PUBLIC CLIENT
   สำหรับหน้า public เท่านั้น อ่านข้อมูลด้วย anon key เสมอ
   - ไม่อ่าน/เก็บ session จาก browser จึงไม่พังเมื่อมี session
     ที่ใช้ไม่ได้ค้างอยู่ใน localStorage
   - storageKey แยกจาก client หลัก (lib/supabase.js) กันคำเตือน
     "Multiple GoTrueClient instances"
   ฝั่ง admin และ Navbar ใช้ client หลักเหมือนเดิม
========================================================= */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.");
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.",
  );
}

export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: "vh-public-anon",
  },
});
