/* =========================================================
   ADMIN REDIRECT
   ใช้กับ /login?next=... ให้กลับไปได้เฉพาะหน้าใน /account
   กัน open redirect เช่น next=https://evil.com หรือ next=//evil.com
========================================================= */

export const ADMIN_HOME = "/account";

const LOCAL_ORIGIN = "https://virtual-herbarium.invalid";

export function getSafeAdminPath(value, fallback = ADMIN_HOME) {
  if (typeof value !== "string" || !/^\/account(?:[/?#]|$)/.test(value)) {
    return fallback;
  }

  /* ห้าม backslash, ช่องว่าง/อักขระควบคุม และ // ที่อาจกลายเป็น host */
  if (/[\\\s\u0000-\u001f]/.test(value) || value.includes("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, LOCAL_ORIGIN);

    /* ตรวจหลัง normalize แล้ว เช่น /account/../plants → /plants */
    if (
      url.origin !== LOCAL_ORIGIN ||
      !/^\/account(?:\/|$)/.test(url.pathname)
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getLoginPathFor(currentPath) {
  return `/login?next=${encodeURIComponent(getSafeAdminPath(currentPath))}`;
}
