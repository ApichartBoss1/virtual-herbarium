"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/* =========================================================
   ADMIN CONTEXT
   app/account/layout.js ตรวจสิทธิ์ admin จุดเดียว
   แล้วส่ง user ให้ทุกหน้าใน /account ผ่าน useAdmin()
========================================================= */

export const AdminContext = createContext(null);

export function useAdmin() {
  const value = useContext(AdminContext);

  if (!value) {
    throw new Error("useAdmin() must be used inside app/account/layout.js");
  }

  return value;
}

/* =========================================================
   SIGNED-IN ADMIN (สำหรับ header และหน้า public)
   ใช้แสดงลิงก์ของ admin เท่านั้น ห้ามใช้ตัดสินว่าจะแสดงข้อมูลหรือไม่
   อ่าน session จากเบราว์เซอร์ (ไม่เรียกเซิร์ฟเวอร์) จึงไม่ทำให้หน้าโหลดช้า
   สิทธิ์จริงตรวจที่ app/account/layout.js และ RLS
========================================================= */

function adminOrNull(user) {
  return user?.app_metadata?.role === "admin" ? user : null;
}

export function useSignedInAdmin() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    /* ได้ INITIAL_SESSION ทันทีที่ subscribe แล้วจึงติดตามการเปลี่ยนแปลง */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(adminOrNull(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return user;
}
