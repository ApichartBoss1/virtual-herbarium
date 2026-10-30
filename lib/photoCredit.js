/* =========================================================
   PHOTO CREDIT
   ชื่อสั้นของ license และบรรทัดเครดิตใต้รูปจาก GBIF
   ใช้ได้ทั้ง server และ browser
   รูปแบบ: "© creator · CC BY-NC 4.0 · ผ่าน iNaturalist"
========================================================= */

const COPY = {
  TH: {
    via: (publisher) => `ผ่าน ${publisher}`,
    license: "License",
  },
  EN: {
    via: (publisher) => `via ${publisher}`,
    license: "License",
  },
};

/* ส่วนของ CC license ที่รู้จัก (path ใน creativecommons.org/licenses/) */
const CC_TYPES = new Set(["by", "by-sa", "by-nd", "by-nc", "by-nc-sa", "by-nc-nd"]);

/* ค่า enum ของ GBIF เช่น CC_BY_NC_4_0 */
const GBIF_LICENSE_ENUMS = {
  CC0_1_0: "CC0",
  CC_BY_4_0: "CC BY 4.0",
  CC_BY_NC_4_0: "CC BY-NC 4.0",
};

/*
 * "http://creativecommons.org/licenses/by-nc/4.0/" → "CC BY-NC 4.0"
 * "https://creativecommons.org/publicdomain/zero/1.0/" → "CC0"
 * ไม่รู้จัก → null (ให้ UI แสดงคำว่า "License" เป็นลิงก์ไป URL เดิม)
 */
export function getLicenseLabel(license) {
  const value = String(license ?? "").trim();

  if (!value) return null;

  if (GBIF_LICENSE_ENUMS[value.toUpperCase()]) {
    return GBIF_LICENSE_ENUMS[value.toUpperCase()];
  }

  let url;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!/(^|\.)creativecommons\.org$/i.test(url.hostname)) return null;

  const [section, type, version] = url.pathname
    .toLowerCase()
    .split("/")
    .filter(Boolean);

  if (section === "publicdomain") {
    if (type === "zero") return "CC0";
    if (type === "mark") return "Public Domain Mark";
    return null;
  }

  if (section !== "licenses" || !CC_TYPES.has(type)) return null;

  const versionText = /^\d+(\.\d+)?$/.test(version || "") ? ` ${version}` : "";

  return `CC ${type.toUpperCase()}${versionText}`;
}

/* ลิงก์ได้เฉพาะ URL http(s) */
export function getLicenseUrl(license) {
  try {
    const url = new URL(String(license ?? "").trim());

    return /^https?:$/.test(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/*
 * ส่วนของบรรทัดเครดิต ให้ UI ต่อด้วย " · "
 * [{ text: "© creator" }, { text: "CC BY-NC 4.0", href }, { text: "ผ่าน iNaturalist" }]
 * ส่วนที่ไม่มีข้อมูลจะไม่ใส่
 */
export function getPhotoCreditParts(photo, language = "TH") {
  const t = language === "EN" ? COPY.EN : COPY.TH;

  const parts = [];

  const creator = String(photo?.creator ?? "").trim();

  if (creator) {
    parts.push({ text: `© ${creator}` });
  }

  const href = photo?.licenseUrl ?? getLicenseUrl(photo?.license);

  const label = photo?.licenseLabel ?? getLicenseLabel(photo?.license);

  if (label || href) {
    parts.push({ text: label || t.license, href: href || null });
  }

  const publisher = String(photo?.publisher ?? "").trim();

  if (publisher) {
    parts.push({ text: t.via(publisher) });
  }

  return parts;
}

export function formatPhotoCredit(photo, language = "TH") {
  return getPhotoCreditParts(photo, language)
    .map((part) => part.text)
    .join(" · ");
}
