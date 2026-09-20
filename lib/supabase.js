import { createClient } from "@supabase/supabase-js";

/* =========================================================
   SUPABASE ENVIRONMENT
========================================================= */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* =========================================================
   VALIDATE ENVIRONMENT VARIABLES
========================================================= */

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.");
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables.",
  );
}

/* =========================================================
   SUPABASE CLIENT

   NEXT_PUBLIC_SUPABASE_ANON_KEY สามารถใช้ใน browser ได้
   แต่ห้ามนำ SERVICE_ROLE_KEY มาใส่ไฟล์นี้เด็ดขาด
========================================================= */

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
