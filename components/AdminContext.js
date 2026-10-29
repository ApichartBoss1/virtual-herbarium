"use client";

import { createContext, useContext } from "react";

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
