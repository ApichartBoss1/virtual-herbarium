/* =========================================================
   SITE URL
   URL หลักของเว็บ ใช้สร้างลิงก์ที่ออกนอกหน้าเว็บ เช่น QR code
   - NEXT_PUBLIC_SITE_URL (ตัด / ท้าย) ถ้ามี
   - ไม่มี env → window.location.origin ฝั่ง browser
========================================================= */

export function getSiteUrl() {
  const fromEnv = String(process.env.NEXT_PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function getPlantUrl(id) {
  return `${getSiteUrl()}/plants/${encodeURIComponent(id)}`;
}
