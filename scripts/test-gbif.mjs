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
  { botanical_name: "Clerodendrum  thomsonae Balf.", family: "Lamiaceae" },
  { botanical_name: "Zingiber sp.", family: "Zingiberaceae" },
  { botanical_name: "Samanea saman (Jacq.) Merr.", family: "Fabaceae-Mimosoideae" },
  { botanical_name: "Grewia eriocarpa Juss.", family: "Tiliaceae" },
  { botanical_name: "asdfgh" },
];

const CHECKS = [
  {
    /*
     * GBIF ถือว่าตัวสะกด "thomsonae" เป็นชื่อพ้องของ C. thomsoniae
     * ข้อนี้ตรวจว่าตัดช่องว่างซ้อนแล้วพบชื่อ จึงรับทั้ง ok และ synonym
     */
    label: '"Clerodendrum  thomsonae" → result "ok" หรือ "synonym"',
    name: "Clerodendrum  thomsonae Balf.",
    test: (r) => ["ok", "synonym"].includes(r.result),
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
    r ? `ได้ result="${r.result}", suggestions=${r.suggestions.length}` : "ไม่พบผล",
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
