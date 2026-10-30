/* =========================================================
   LOCALITY FIXES
   ใช้ตอนค้นพิกัดเท่านั้น ข้อความ locality ในฐานข้อมูลไม่เปลี่ยน
   มี 2 ตาราง:
   1. LOCALITY_QUERY_RULES: ชื่อสถานที่ที่ค้นไม่เจอ ให้ค้นด้วยข้อความที่กำหนดแทน
   2. LOCALITY_FIXES: คำสะกดผิดที่พบบ่อย แทนที่เฉพาะคำนั้นในข้อความ

   ผลที่ค้นไว้ในเบราว์เซอร์ (cache) ผูกกับข้อความที่ใช้ค้นจริง
   เพิ่มหรือแก้กฎแล้วไม่ต้องล้าง cache: ชื่อที่ตรงกฎใหม่จะถูกค้นใหม่เอง
   และผล "หาไม่เจอ" ไม่ถูกเก็บไว้ กด "เติมพิกัดให้รายการที่ยังไม่มี" อีกครั้งได้เลย
========================================================= */

/*
 * วิธีเพิ่มกฎใน LOCALITY_QUERY_RULES
 * 1. ดูชื่อสถานที่ที่ "หาไม่เจอ" ในรายงาน Excel ของการเติมพิกัด (geocode-report_*.xlsx)
 * 2. ลองค้นชื่อที่ถูกต้องที่ https://nominatim.openstreetmap.org/ ให้เจอจุดที่ใช่
 *    รูปแบบที่มักเจอ: "ชื่อสถานที่, อำเภอ, จังหวัด" หรือ "ชื่อสถานที่, จังหวัด" (ภาษาอังกฤษ)
 * 3. เพิ่มบรรทัด [/รูปแบบ/, "ข้อความที่ใช้ค้น"] ในตารางด้านล่าง
 *    - รูปแบบเป็น regex ไม่สนตัวพิมพ์ใหญ่-เล็ก เทียบกับข้อความเดิมทั้งข้อความ
 *      (ช่องว่างหลายตัวถูกรวมเป็นตัวเดียวแล้ว)
 *    - ใช้ส่วนที่เจาะจงพอ ไม่ให้ไปตรงกับสถานที่อื่น เช่น /Khanu Waralakburi/
 *    - ต้องการให้ตรงทั้งข้อความใช้ ^ และ $ เช่น /^Naresuan University$/
 *    - ใส่อักขระพิเศษของ regex เช่น ( ) . ให้ใส่ \ นำหน้า เช่น \(
 *    - กฎแรกที่ตรงจะถูกใช้ (เรียงจากบนลงล่าง)
 * 4. รัน npm run build แล้ว commit จากนั้นกด "เติมพิกัดให้รายการที่ยังไม่มี" อีกครั้ง
 *
 * ถ้าค้นด้วยข้อความที่กำหนดแล้วยังไม่เจอ ระบบจะลองค้นจังหวัดในข้อความนั้นแทน
 */
export const LOCALITY_QUERY_RULES = [
  [/Praputtachai\s*\(Sahm Lahn/i, "Namtok Sam Lan National Park, Saraburi"],
  [/Khao Kitchagoot Natio?n?al Park/i, "Khao Khitchakut National Park, Chanthaburi"],
  [/Khanu Waralakburi/i, "Khanu Woralaksaburi, Kamphaeng Phet"],
  [/Burirum,\s*Non Din Dang/i, "Non Din Daeng, Buriram"],
  [/^Naresuan University$/i, "Naresuan University, Phitsanulok"],
  [
    /Rajamangala University of technology Thanyaburi/i,
    "Rajamangala University of Technology Thanyaburi, Pathum Thani",
  ],
  [/Loom Soom Subdistrict/i, "Lum Sum, Sai Yok, Kanchanaburi"],
  [/Centre for Pu Fah/i, "Bo Kluea, Nan"],
];

/* ข้อความที่ใช้ค้นแทน ถ้าตรงกฎใน LOCALITY_QUERY_RULES (ไม่ตรงคืน null) */
export function findLocalityQueryRule(text) {
  const value = String(text ?? "").replace(/\s+/g, " ").trim();

  const rule = LOCALITY_QUERY_RULES.find(([pattern]) => pattern.test(value));

  return rule ? rule[1] : null;
}

/*
 * คำสะกดผิดที่พบบ่อยในชื่อสถานที่ของข้อมูลเดิม (PNU Herbarium)
 * [รูปแบบ (ไม่สนตัวพิมพ์ใหญ่-เล็ก), คำที่ถูก]
 */
export const LOCALITY_FIXES = [
  /* จังหวัด */
  [/\bPh?i?t?sa?[nm]ulok?e?\b/gi, "Phitsanulok"],
  [/\bPhitsamulok\b/gi, "Phitsanulok"],
  [/\bPh?etchaboon\b/gi, "Phetchabun"],
  [/\bPetchabun\b/gi, "Phetchabun"],
  [/\bUttadit\b/gi, "Uttaradit"],
  [/\bNa?kh?or?n\b/gi, "Nakhon"],
  [/\bNakh?o?r?n\s?sawan\b/gi, "Nakhon Sawan"],
  [/\bChachoengchao\b/gi, "Chachoengsao"],
  [/\bK[ua]mphaeng\s?phet\b/gi, "Kamphaeng Phet"],
  [/\bSukho Thai\b/gi, "Sukhothai"],
  [/\bChan Taburi\b/gi, "Chanthaburi"],
  [/\bChampho?n\b/gi, "Chumphon"],
  [/\bLamphoon\b/gi, "Lamphun"],
  [/\bPhattalung\b/gi, "Phatthalung"],
  [/\bChaiyaphoom\b/gi, "Chaiyaphum"],
  [/\bSrakaew\b/gi, "Sa Kaeo"],
  [/\bPrachuap\s?kirikhan\b/gi, "Prachuap Khiri Khan"],
  [/\bPhang Ngaa\b/gi, "Phang Nga"],
  [/\bCh(?:ia|ai)ng\s?mai\b/gi, "Chiang Mai"],
  [/\bChiengmai\b/gi, "Chiang Mai"],
  [/\bChiangrai\b/gi, "Chiang Rai"],
  [/\bKhonkaen\b/gi, "Khon Kaen"],

  /* อำเภอ / พื้นที่ */
  [/\bMu(?:a|e)?[nm]g\b/gi, "Mueang"],
  [/\bMuamg\b/gi, "Mueang"],
  [/\bWang?\s?tha?o?ng\b/gi, "Wang Thong"],
  [/\bTha\s?-?\s?pho\b/gi, "Tha Pho"],
  [/\bLomsak\b/gi, "Lom Sak"],
  [/\bBang\s?mu[nl]\s?nak\b/gi, "Bang Mun Nak"],
  [/\bChiang Sean\b/gi, "Chiang Saen"],
  [/\bNakon Thai\b/gi, "Nakhon Thai"],
  [/\bSaklek\b/gi, "Sak Lek"],
  [/\bKao Yai\b/gi, "Khao Yai"],

  /* คำทั่วไป */
  [/\bNatioa?nal Pak\b/gi, "National Park"],
  [/\bNatioal\b/gi, "National"],
  [/\bsub-?di[sa]t?ri?ct?\b/gi, "Subdistrict"],
  [/\bd[ei]st?rict?\b/gi, "District"],
  [/\bcmmunity\b/gi, "community"],
  [/\bHeadquaters\b/gi, "Headquarters"],
  [/\bmusium\b/gi, "museum"],
  [/\bTombon\b/gi, "Tambon"],
];

export function applyLocalityFixes(text) {
  return LOCALITY_FIXES.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    String(text ?? ""),
  );
}
