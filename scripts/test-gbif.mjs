/* =========================================================
   npm run test:gbif
   เรียก checkName กับชื่อตัวอย่างจริงผ่าน GBIF แล้วพิมพ์ตาราง
   และตรวจผลอัตโนมัติ (exit code 1 ถ้ามีข้อใด FAIL)
========================================================= */

import { checkName } from "../lib/gbif.js";

const CASES = [
  { botanical_name: "Michelia alba DC.", family: "Magnoliaceae" },
  { botanical_name: "Dipterocarp alatus Roxb. ex G. Don", family: "Dipterocarpaceae" },
  { botanical_name: "Hydrophila erecta (Burm. f.) Hochr.", family: "Acanthaceae" },
  { botanical_name: "Hygrophila erecta (Burm. f.) Hochr.", family: "Acanthaceae" },
  { botanical_name: "Clerodendrum  thomsonae Balf.", family: "Lamiaceae" },
  { botanical_name: "Zingiber sp.", family: "Zingiberaceae" },
  { botanical_name: "Samanea saman (Jacq.) Merr.", family: "Fabaceae-Mimosoideae" },
  { botanical_name: "Grewia eriocarpa Juss.", family: "Tiliaceae" },
  { botanical_name: "asdfgh" },
];

const startsWith = (value, prefix) =>
  String(value || "").startsWith(prefix);

const CHECKS = [
  {
    /* GBIF ถือว่าตัวสะกด "thomsonae" เป็นชื่อพ้องของ C. thomsoniae */
    label: '"Clerodendrum  thomsonae" → "synonym" และชื่อที่ยอมรับขึ้นต้นด้วย "Clerodendrum thomsoniae"',
    name: "Clerodendrum  thomsonae Balf.",
    test: (r) =>
      r.result === "synonym" &&
      startsWith(r.gbif?.acceptedName, "Clerodendrum thomsoniae"),
  },
  {
    /* เครื่องหมาย × ในชื่อของ GBIF ต้องไม่ทำให้กลายเป็น spelling */
    label: '"Michelia alba DC." → "synonym" และมีชื่อที่ยอมรับ',
    name: "Michelia alba DC.",
    test: (r) => r.result === "synonym" && Boolean(r.gbif?.acceptedName),
  },
  {
    label: '"Samanea saman" (Fabaceae-Mimosoideae) → "ok" และ familyCheck "match"',
    name: "Samanea saman (Jacq.) Merr.",
    test: (r) => r.result === "ok" && r.familyCheck === "match",
  },
  {
    label: '"Hydrophila erecta" → "spelling" และคำแนะนำแรกขึ้นต้นด้วย "Hygrophila erecta"',
    name: "Hydrophila erecta (Burm. f.) Hochr.",
    test: (r) =>
      r.result === "spelling" &&
      startsWith(r.suggestions[0]?.scientificName, "Hygrophila erecta"),
  },
  {
    label: '"Dipterocarp alatus" → "spelling" และคำแนะนำแรกขึ้นต้นด้วย "Dipterocarpus alatus"',
    name: "Dipterocarp alatus Roxb. ex G. Don",
    test: (r) =>
      r.result === "spelling" &&
      startsWith(r.suggestions[0]?.scientificName, "Dipterocarpus alatus"),
  },
  {
    /* ชื่อพืชถูก ต่างแค่การเขียนชื่อผู้ตั้ง ต้องไม่ถูกนับเป็น spelling */
    label: '"Hygrophila erecta (Burm. f.) Hochr." → "ok"',
    name: "Hygrophila erecta (Burm. f.) Hochr.",
    test: (r) => r.result === "ok",
  },
  {
    label: '"Grewia eriocarpa" (Tiliaceae) → familyCheck "differs" และวงศ์ GBIF เป็น "Malvaceae"',
    name: "Grewia eriocarpa Juss.",
    test: (r) => r.familyCheck === "differs" && r.gbif?.family === "Malvaceae",
  },
  {
    label: '"Zingiber sp." → result "genus_only"',
    name: "Zingiber sp.",
    test: (r) => r.result === "genus_only",
  },
  {
    label: '"asdfgh" → result "not_found" และไม่มีคำแนะนำ',
    name: "asdfgh",
    test: (r) => r.result === "not_found" && r.suggestions.length === 0,
  },
];

const results = [];

for (const item of CASES) {
  try {
    results.push(await checkName(item));
  } catch (error) {
    console.error(`ERROR ${item.botanical_name}: ${error.code || error.message}`);

    process.exit(1);
  }
}

console.table(
  results.map((r) => ({
    ชื่อ: r.input,
    result: r.result,
    "ชื่อที่ GBIF จับคู่": r.gbif?.scientificName
      ? `${r.gbif.scientificName} (${r.gbif.matchType} ${r.gbif.confidence})`
      : "—",
    ชื่อพืชล้วน: r.plainName || "—",
    ชื่อที่ยอมรับ: r.gbif?.acceptedName || "—",
    คำแนะนำ: r.suggestions.map((s) => s.scientificName).join("; ") || "—",
    familyCheck: r.familyCheck,
  })),
);

let failed = 0;

const report = (ok, label, detail = "") => {
  if (!ok) failed += 1;

  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
};

for (const check of CHECKS) {
  const r = results.find((item) => item.input === check.name);

  report(
    Boolean(r) && check.test(r),
    check.label,
    r
      ? `ได้ result="${r.result}", accepted="${r.gbif?.acceptedName || "—"}", ` +
          `familyCheck="${r.familyCheck}", gbifFamily="${r.gbif?.family || "—"}", ` +
          `suggestions=${r.suggestions.length}`
      : "ไม่พบผล",
  );
}

const missingUrl = results.flatMap((r) =>
  r.suggestions.filter((s) => !s.gbifUrl).map((s) => `${r.input} → ${s.scientificName}`),
);

report(
  missingUrl.length === 0,
  "ทุก suggestion มี gbifUrl",
  missingUrl.join(", "),
);

process.exit(failed ? 1 : 0);
