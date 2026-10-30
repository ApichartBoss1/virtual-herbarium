"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/* =========================================================
   BIO 3D GATE
   ตัดสินว่าจะโหลดภาพ 3D (three.js) หรือไม่
   ไฟล์นี้ต้องไม่ import three / @react-three เพื่อให้ตัดสินได้ก่อนโหลด

   ไม่โหลดและไม่ render เลยเมื่อ
   - prefers-reduced-motion: reduce
   - จอแคบกว่า minWidth (อย่างน้อย 768 px)
   - navigator.connection.saveData เป็น true
   กรณีอื่น รอให้หน้าโหลดเสร็จ (load) และเบราว์เซอร์ว่าง (requestIdleCallback)
   ก่อน เพื่อไม่ให้แย่งโหลดกับเนื้อหาหลัก

   ใช้กับพื้นหลัง (BioBackgroundMount) และภาพส่วนหัว (BioHeroLazy)
========================================================= */

export const BIO_3D_MIN_WIDTH = 768;

/* requestIdleCallback อาจไม่ถูกเรียกถ้าหน้าไม่ว่างเลย จึงกำหนดเวลาสูงสุด */
const IDLE_TIMEOUT_MS = 3000;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function widthQuery(minWidth) {
  return `(min-width: ${minWidth}px)`;
}

function canUse3D(minWidth) {
  if (navigator.connection?.saveData) return false;

  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return false;

  return window.matchMedia(widthQuery(minWidth)).matches;
}

function subscribe(minWidth, onChange) {
  const queries = [
    window.matchMedia(REDUCED_MOTION_QUERY),
    window.matchMedia(widthQuery(minWidth)),
  ];

  const connection = navigator.connection;

  queries.forEach((query) => query.addEventListener("change", onChange));
  connection?.addEventListener?.("change", onChange);

  return () => {
    queries.forEach((query) => query.removeEventListener("change", onChange));
    connection?.removeEventListener?.("change", onChange);
  };
}

/* เรียก callback หลัง load แล้วรอให้เบราว์เซอร์ว่าง คืนฟังก์ชันยกเลิก */
function afterLoadAndIdle(callback) {
  let idleId = null;
  let timer = null;

  function scheduleIdle() {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    } else {
      timer = window.setTimeout(callback, 1);
    }
  }

  if (document.readyState === "complete") {
    scheduleIdle();
  } else {
    window.addEventListener("load", scheduleIdle, { once: true });
  }

  return () => {
    window.removeEventListener("load", scheduleIdle);

    if (idleId !== null) window.cancelIdleCallback(idleId);
    if (timer !== null) window.clearTimeout(timer);
  };
}

/* true เมื่อควรโหลดภาพ 3D แล้ว (ฝั่ง server และตอน hydrate เป็น false เสมอ) */
export function useBio3D(minWidth = BIO_3D_MIN_WIDTH) {
  const width = Math.max(minWidth, BIO_3D_MIN_WIDTH);

  const allowed = useSyncExternalStore(
    (onChange) => subscribe(width, onChange),
    () => canUse3D(width),
    () => false,
  );

  const [idle, setIdle] = useState(false);

  useEffect(() => afterLoadAndIdle(() => setIdle(true)), []);

  return allowed && idle;
}
